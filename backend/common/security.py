# 安全组件：密码哈希 / JWT 签发与校验 / FastAPI 依赖
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, Header, HTTPException

from .config import settings

# ---------- 密码哈希（PBKDF2，无第三方二进制依赖） ----------
_ITER = 120_000


def hash_password(password: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), _ITER)
    return f"{salt}${dk.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        salt, _ = stored.split("$", 1)
    except ValueError:
        return False
    return hmac.compare_digest(hash_password(password, salt), stored)


# ---------- JWT ----------
def create_token(user_id: int, username: str, role: str, name: str = "") -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "username": username,
        "role": role,
        "name": name,
        "iat": now,
        "exp": now + timedelta(minutes=settings.jwt_expire_minutes),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "登录已过期，请重新登录")
    except jwt.PyJWTError:
        raise HTTPException(401, "无效的登录凭证")


# ---------- FastAPI 依赖 ----------
def get_current_user(authorization: str = Header(default="")) -> dict:
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(401, "未登录")
    return decode_token(token)


def require_internal(x_internal_token: str = Header(default="")) -> None:
    # 服务间通信校验：仅允许内部网关/服务调用
    if not x_internal_token or not hmac.compare_digest(x_internal_token, settings.internal_token):
        raise HTTPException(403, "禁止访问：内部令牌无效")
