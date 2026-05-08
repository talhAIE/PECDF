from langgraph.prebuilt import create_react_agent
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from agent.tools import get_tools
from agent.prompts import build_system_prompt
from agent.memory import get_checkpointer, register_session, clear_memory
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

# Cache compiled graphs per session so we don't rebuild on every request
_agents: dict[str, object] = {}
_agent_tokens: dict[str, str] = {}   # session_id -> bearer_token (for tool auth)


def get_or_create_agent(
    session_id: str,
    bearer_token: str,
    macro_pkr: float,
    macro_oil: float,
    macro_conf: float,
):
    """
    Returns a compiled LangGraph react agent for the given session.
    Re-creates if the token changes (e.g. after login refresh).
    """
    if session_id in _agents and _agent_tokens.get(session_id) == bearer_token:
        return _agents[session_id]

    llm = ChatGroq(
        model=settings.agent_model,
        api_key=settings.groq_api_key,
        max_tokens=settings.agent_max_tokens,
        temperature=0.2,
    )

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
    _agent_tokens[session_id] = bearer_token
    return agent


def invoke_agent(session_id: str, user_message: str) -> tuple[str, list[str]]:
    """
    Invoke the agent for a session. Returns (response_text, tools_used_list).
    """
    agent = _agents.get(session_id)
    if not agent:
        return "Session not found. Please start a new conversation.", []

    from langchain_core.messages import HumanMessage
    config = {"configurable": {"thread_id": session_id}}

    result = agent.invoke(
        {"messages": [HumanMessage(content=user_message)]},
        config=config
    )

    messages = result.get("messages", [])
    response_text = ""
    tools_used = []

    for msg in messages:
        msg_type = type(msg).__name__
        if msg_type == "AIMessage" and msg.content:
            response_text = msg.content if isinstance(msg.content, str) else str(msg.content)
        if msg_type == "ToolMessage":
            if hasattr(msg, "name") and msg.name:
                tools_used.append(msg.name)

    return response_text or "I could not generate a response.", list(dict.fromkeys(tools_used))


def clear_session(session_id: str) -> None:
    _agents.pop(session_id, None)
    _agent_tokens.pop(session_id, None)
    clear_memory(session_id)
