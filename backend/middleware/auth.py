from datetime import datetime, timedelta, timezone
from typing import Optional
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from jose import jwt, JWTError
from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from config import settings

_ph = PasswordHasher()
_bearer = HTTPBearer()


# ─────────────────────────────────────────
# Password hashing (Argon2)
# ─────────────────────────────────────────

def hash_password(plain: str) -> str:
    return _ph.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


# ─────────────────────────────────────────
# JWT token creation
# ─────────────────────────────────────────

def create_access_token(user_id: str, email: str) -> tuple[str, int]:
    """
    Returns (token_string, expires_in_seconds).
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, settings.jwt_expire_hours * 3600


# ─────────────────────────────────────────
# JWT token verification (FastAPI dependency)
# ─────────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(_bearer)
) -> dict:
    """
    FastAPI dependency — verifies JWT on every protected route.
    Returns {"user_id": ..., "email": ...}

    Usage: add  current_user: dict = Depends(get_current_user)
    to any endpoint that requires authentication.
    """
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm]
        )
        user_id: Optional[str] = payload.get("sub")
        email: Optional[str] = payload.get("email")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
        return {"user_id": user_id, "email": email}
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Token invalid or expired: {str(e)}")


# Convenience alias
CurrentUser = Depends(get_current_user)
