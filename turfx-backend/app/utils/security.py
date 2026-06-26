import random
import string
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.config import settings
from app.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)


# ── Passwords ─────────────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(days=settings.JWT_EXPIRES_DAYS)
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])


# ── OTP ───────────────────────────────────────────────────────────────────────

def generate_otp(length: int = 6) -> str:
    return "".join(random.choices(string.digits, k=length))


def store_otp(conn, identifier: str, otp: str, otp_type: str = "login"):
    with conn.cursor() as cur:
        cur.execute(
            "DELETE FROM otps WHERE identifier=%s AND type=%s",
            (identifier, otp_type),
        )
        expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
        cur.execute(
            "INSERT INTO otps (identifier, otp, type, expires_at) VALUES (%s,%s,%s,%s)",
            (identifier, otp, otp_type, expires_at),
        )


def verify_otp(conn, identifier: str, otp: str, otp_type: str = "login") -> bool:
    with conn.cursor() as cur:
        cur.execute(
            """SELECT id FROM otps
               WHERE identifier=%s AND otp=%s AND type=%s
                 AND used=FALSE AND expires_at > NOW()""",
            (identifier, otp, otp_type),
        )
        row = cur.fetchone()
        if not row:
            return False
        cur.execute("UPDATE otps SET used=TRUE WHERE id=%s", (row["id"],))
        return True


# ── Auth dependency helpers ───────────────────────────────────────────────────

def _get_user_from_token(token: str):
    """Decode JWT and load user from DB. Returns dict or raises HTTPException."""
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
        )

    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id,name,phone,email,role,is_active,created_at FROM users WHERE id=%s",
                (user_id,),
            )
            user = cur.fetchone()

    if not user:
        raise HTTPException(status_code=401, detail="User not found.")
    if not user["is_active"]:
        raise HTTPException(status_code=401, detail="Account is deactivated.")
    return dict(user)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Authorization token required.")
    return _get_user_from_token(credentials.credentials)


def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    """Returns user dict if token present and valid, else None."""
    if not credentials:
        return None
    try:
        return _get_user_from_token(credentials.credentials)
    except HTTPException:
        return None


def require_roles(*roles: str):
    """Dependency factory that enforces one of the given roles."""
    def _check(user: dict = Depends(get_current_user)):
        if user["role"] not in roles:
            raise HTTPException(
                status_code=403,
                detail=f"Access denied. Required role: {' or '.join(roles)}",
            )
        return user
    return _check
