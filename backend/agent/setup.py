from langgraph.prebuilt import create_react_agent
from langchain_core.messages import SystemMessage
from agent.tools import get_tools
from agent.prompts import build_system_prompt
from agent.memory import get_checkpointer, register_session, clear_memory
from llm_runtime import get_langchain_chat_model
import logging

logger = logging.getLogger(__name__)

# Cache compiled graphs per session so we don't rebuild on every request
_agents: dict[str, object] = {}
_agent_keys: dict[str, tuple] = {}   # session_id -> (bearer_token, pkr, oil, conf)


def _cache_key(
    bearer_token: str, macro_pkr: float, macro_oil: float, macro_conf: float
) -> tuple:
    return (bearer_token, macro_pkr, macro_oil, macro_conf)


def get_or_create_agent(
    session_id: str,
    bearer_token: str,
    macro_pkr: float,
    macro_oil: float,
    macro_conf: float,
):
    """
    Returns a compiled LangGraph react agent for the given session.
    Re-creates when bearer token OR macro inputs change so tool closures
    always reflect the user's current macro settings.
    """
    key = _cache_key(bearer_token, macro_pkr, macro_oil, macro_conf)
    if session_id in _agents and _agent_keys.get(session_id) == key:
        return _agents[session_id]

    llm = get_langchain_chat_model()

    tools = get_tools(bearer_token, macro_pkr, macro_oil, macro_conf)
    system_prompt = build_system_prompt(macro_pkr, macro_oil, macro_conf)

    agent = create_react_agent(
        model=llm,
        tools=tools,
        prompt=SystemMessage(content=system_prompt),
        checkpointer=get_checkpointer(),
    )

    register_session(session_id)
    _agents[session_id] = agent
    _agent_keys[session_id] = key
    return agent


def invoke_agent(session_id: str, user_message: str) -> tuple[str, list[str]]:
    """
    Invoke the agent for a session. Returns (response_text, tools_used_list).
    On any error the corrupted agent is evicted from the cache so the next
    request gets a fresh instance.
    """
    agent = _agents.get(session_id)
    if not agent:
        return "Session not found. Please start a new conversation.", []

    from langchain_core.messages import HumanMessage
    config = {"configurable": {"thread_id": session_id}}

    try:
        result = agent.invoke(
            {"messages": [HumanMessage(content=user_message)]},
            config=config,
        )

        messages = result.get("messages", [])
        response_text = ""
        tools_used = []

        for msg in messages:
            msg_type = type(msg).__name__
            if msg_type == "AIMessage" and msg.content:
                response_text = (
                    msg.content if isinstance(msg.content, str) else str(msg.content)
                )
            if msg_type == "ToolMessage" and hasattr(msg, "name") and msg.name:
                tools_used.append(msg.name)

        return (
            response_text or "I could not generate a response.",
            list(dict.fromkeys(tools_used)),
        )

    except Exception as e:
        err_str = str(e)
        logger.exception("Agent invoke error for session %s: %s", session_id, err_str)

        # Evict the agent so the next request creates a fresh one
        _agents.pop(session_id, None)
        _agent_keys.pop(session_id, None)

        if "tool call validation failed" in err_str or "tool_use_failed" in err_str:
            return (
                "The assistant hit a tool-call validation error and has been reset. "
                "Please retry your question.",
                [],
            )

        def _looks_like_rate_limit(exc: BaseException, msg: str) -> bool:
            """Avoid false positives — substring \"429\" alone can appear in unrelated token counts."""
            m = msg.lower()
            try:
                from openai import RateLimitError

                if isinstance(exc, RateLimitError):
                    return True
            except ImportError:
                pass
            if type(exc).__name__ == "RateLimitError":
                return True
            if "ratelimit" in m.replace(" ", "") or "rate_limit" in m or "too many requests" in m:
                return True
            if " tpm" in m or " tpm," in m or "requests per minute" in m:
                return True
            if (
                "status_code=429" in m
                or "status code: 429" in m
                or "429 too many requests" in m
                or "response_code=429" in m
            ):
                return True
            return False

        if _looks_like_rate_limit(e, err_str):
            return (
                "The AI service is currently rate-limited. "
                "Please wait a moment and try again.",
                [],
            )

        if "connection" in err_str.lower() or "timeout" in err_str.lower():
            return (
                "Could not reach the AI service. "
                "Please check your connection and try again.",
                [],
            )

        el = err_str.lower()
        if (
            "invalid_api_key" in el
            or "incorrect api key" in el
            or "401" in err_str
            or "authentication" in el
        ):
            return (
                "The AI API rejected the request (invalid key, permissions, or billing). "
                "Check OPENAI_API_KEY / GROQ_API_KEY and AGENT_LLM_PROVIDER in backend/.env, then restart the server.",
                [],
            )

        return (
            "The assistant encountered an unexpected error. "
            "Please try again or rephrase your question.",
            [],
        )


def clear_session(session_id: str) -> None:
    _agents.pop(session_id, None)
    _agent_keys.pop(session_id, None)
    clear_memory(session_id)
