# 后端冒烟测试：安全组件 + 认证接口
import os

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_pmc.db")

from fastapi.testclient import TestClient  # noqa: E402

from common.security import (  # noqa: E402
    create_token,
    decode_token,
    hash_password,
    verify_password,
)
from services.auth.main import app as auth_app  # noqa: E402


def test_password_hash():
    h = hash_password("secret123")
    assert verify_password("secret123", h)
    assert not verify_password("wrong", h)


def test_jwt_roundtrip():
    token = create_token(1, "admin", "admin", "管理员")
    payload = decode_token(token)
    assert payload["username"] == "admin"
    assert payload["role"] == "admin"


def test_login_success():
    with TestClient(auth_app) as c:
        r = c.post("/api/auth/login", json={"username": "admin", "password": "admin123"})
        assert r.status_code == 200
        body = r.json()
        assert "access_token" in body
        assert body["user"]["username"] == "admin"


def test_login_wrong_password():
    with TestClient(auth_app) as c:
        r = c.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
        assert r.status_code == 401
