"""
Shared LLM routing: Groq and/or OpenAI. Used by the agent (LangChain) and report generator.
Configure via .env — at least one API key required when AI features run.
"""
from __future__ import annotations

from typing import Literal

from langchain_core.language_models.chat_models import BaseChatModel

import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import settings


def resolve_agent_llm_provider() -> Literal["groq", "openai"]:
    """
    Resolution order:
      - agent_llm_provider == groq/openai forces that backend (requires the matching key).
      - auto: only Groq key -> Groq; only OpenAI key -> OpenAI;
              both keys set -> OpenAI (set AGENT_LLM_PROVIDER=groq to stay on Groq).
    """
    mode = (settings.agent_llm_provider or "auto").strip().lower()

    if mode == "groq":
        if not settings.groq_api_key:
            raise ValueError(
                "AGENT_LLM_PROVIDER=groq but GROQ_API_KEY is empty. Set it in backend/.env."
            )
        return "groq"

    if mode == "openai":
        if not settings.openai_api_key:
            raise ValueError(
                "AGENT_LLM_PROVIDER=openai but OPENAI_API_KEY is empty. Set it in backend/.env."
            )
        return "openai"

    has_g = bool(settings.groq_api_key)
    has_o = bool(settings.openai_api_key)
    if has_g and has_o:
        return "openai"  # explicit AGENT_LLM_PROVIDER overrides; else prefer OpenAI when both set
    if has_g:
        return "groq"
    if has_o:
        return "openai"

    raise ValueError(
        "No LLM API key configured. Set OPENAI_API_KEY and/or GROQ_API_KEY in backend/.env "
        "(and optionally AGENT_LLM_PROVIDER=auto|openai|groq)."
    )


def get_langchain_chat_model() -> BaseChatModel:
    """LangGraph agent model (Groq or OpenAI)."""
    provider = resolve_agent_llm_provider()

    if provider == "groq":
        from langchain_groq import ChatGroq

        return ChatGroq(
            model=settings.agent_model,
            api_key=settings.groq_api_key,
            max_tokens=settings.agent_max_tokens,
            temperature=0.2,
        )

    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        max_tokens=settings.agent_max_tokens,
        temperature=0.2,
    )


def chat_completion_text(prompt: str, max_tokens: int | None = None) -> str:
    """
    One-shot chat completion for report generation (same provider as agent).
    """
    provider = resolve_agent_llm_provider()
    mt = max_tokens if max_tokens is not None else settings.agent_max_tokens
    messages = [{"role": "user", "content": prompt}]

    if provider == "groq":
        from groq import Groq

        client = Groq(api_key=settings.groq_api_key)
        r = client.chat.completions.create(
            model=settings.agent_model,
            max_tokens=mt,
            messages=messages,
        )
        return (r.choices[0].message.content or "").strip()

    from openai import OpenAI

    client = OpenAI(api_key=settings.openai_api_key)
    r = client.chat.completions.create(
        model=settings.openai_model,
        max_tokens=mt,
        messages=messages,
    )
    return (r.choices[0].message.content or "").strip()
