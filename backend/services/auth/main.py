# 认证微服务：登录签发 JWT、用户信息
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common.config import settings
from common.database import Base, engine, get_db
from common.models import User
from common.security import create_token, get_current_user, hash_password, require_internal, verify_password

logger = logging.getLogger("auth")
logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = next(get_db())
    if not db.query(User).filter(User.username == "admin").first():
        db.add(User(username="admin", password_hash=hash_password("admin123"), name="系统管理员", role="admin"))
        db.commit()
        logger.info("已初始化默认账号 admin / admin123（生产环境请立即修改）")
    db.close()
    yield


app = FastAPI(title="PMC Auth Service", version="1.0.0", lifespan=lifespan)


class LoginIn(BaseModel):
    username: str
    password: str


@app.post("/api/auth/login", tags=["auth"])
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(401, "用户名或密码错误")
    token = create_token(user.id, user.username, user.role, user.name)
    return {"access_token": token, "token_type": "bearer", "user": {"id": user.id, "username": user.username, "name": user.name, "role": user.role}}


@app.get("/api/auth/me", tags=["auth"])
def me(_internal: None = Depends(require_internal), user: dict = Depends(get_current_user)):
    return user


@app.post("/api/auth/register", tags=["auth"])
def register(body: LoginIn, _internal: None = Depends(require_internal), db: Session = Depends(get_db)):
    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(409, "用户名已存在")
    u = User(username=body.username, password_hash=hash_password(body.password), name=body.username, role="user")
    db.add(u)
    db.commit()
    return {"ok": True, "username": body.username}


@app.get("/healthz", tags=["ops"])
def health():
    return {"service": "auth", "status": "ok"}
