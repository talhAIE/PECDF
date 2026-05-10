from langgraph.checkpoint.memory import MemorySaver

# One shared MemorySaver — langgraph handles per-thread isolation via thread_id
_checkpointer = MemorySaver()

# Track active session IDs so clear_session knows what to remove
_active_sessions: set[str] = set()


def get_checkpointer() -> MemorySaver:
    return _checkpointer


def register_session(session_id: str) -> None:
    _active_sessions.add(session_id)


def clear_memory(session_id: str) -> None:
    _active_sessions.discard(session_id)
    # MemorySaver stores per thread_id — clear it by writing empty checkpoint
    try:
        config = {"configurable": {"thread_id": session_id}}
        _checkpointer.put(config, {}, {}, {})
    except Exception:
        pass
