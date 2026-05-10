from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database.connection import get_db
from database import crud
from schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from middleware.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, req.email):
        raise HTTPException(status_code=409, detail="Email already registered")

    user = crud.create_user(
        db,
        email=req.email,
        hashed_password=hash_password(req.password),
        full_name=req.full_name
    )
    token, expires_in = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )


@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, req.email)
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    crud.update_last_login(db, user.id)
    token, expires_in = create_access_token(user.id, user.email)
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name
    )


@router.get("/me", response_model=UserResponse)
def get_me(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = crud.get_user_by_id(db, current_user["user_id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        created_at=user.created_at,
        last_login=user.last_login
    )


@router.get("/verify")
def verify_token(current_user: dict = Depends(get_current_user)):
    """Quick token check — 200 means valid, 401 means invalid/expired."""
    return {"valid": True, "user_id": current_user["user_id"], "email": current_user["email"]}
