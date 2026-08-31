# SQLAlchemy 引擎与会话（默认 SQLite，生产切换 Postgres）
import logging

from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

from .config import settings

logger = logging.getLogger("db")

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
Base = declarative_base()


def init_db(bind=None):
    """安全建表：多服务同时启动（共享 SQLite 文件）时避免 'table already exists' 竞态"""
    target = bind or engine
    try:
        Base.metadata.create_all(bind=target)
    except OperationalError as e:
        logger.warning("建表时表已存在（并发启动常见），继续运行: %s", e)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
