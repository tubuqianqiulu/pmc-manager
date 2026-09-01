# 数据模型（多服务共享同一数据源的物理表）
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Integer, String, Text

from .database import Base


def _now():
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "pmc_users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    name = Column(String(64), default="")
    role = Column(String(32), default="admin")
    dept = Column(String(64), default="PMC 部")
    created_at = Column(DateTime, default=_now)


class PmcRecord(Base):
    """通用业务记录：module 为模块 key，data 为 JSON 字段；owner 为归属用户（admin 可见全部）"""
    __tablename__ = "pmc_records"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module = Column(String(64), index=True, nullable=False)
    data = Column(JSON, nullable=False, default=dict)
    owner = Column(String(64), index=True, default="")
    archived = Column(Integer, default=0)
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now, onupdate=_now)


class WarningRecord(Base):
    __tablename__ = "pmc_warnings"
    id = Column(Integer, primary_key=True, autoincrement=True)
    module = Column(String(64), index=True)
    signature = Column(String(128), index=True)
    data = Column(JSON, nullable=False, default=dict)
    status = Column(String(16), default="待处理")
    created_at = Column(DateTime, default=_now)
    handled_at = Column(DateTime, nullable=True)


class OperationLog(Base):
    __tablename__ = "pmc_operation_logs"
    id = Column(Integer, primary_key=True, autoincrement=True)
    user = Column(String(64), default="")
    op = Column(String(32), nullable=False)
    target = Column(String(128), default="")
    detail = Column(Text, default="")
    created_at = Column(DateTime, default=_now)
