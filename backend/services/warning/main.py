# 预警微服务：消费 RabbitMQ 数据变更事件，按规则评估并落库；提供预警查询/处理接口
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta

from fastapi import Depends, FastAPI, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from common.config import settings
from common.database import Base, engine, get_db, init_db
from common.models import PmcRecord, WarningRecord
from common.rabbit import publish, start_consumer
from common.security import require_internal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("warning")

CHANNEL_CHANGED = "pmc.data.changed"
DAY = 86400


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    start_consumer(settings.rabbitmq_url, CHANNEL_CHANGED, on_event, enabled=settings.rabbitmq_enabled)
    yield


app = FastAPI(title="PMC Warning Service", version="1.0.0", lifespan=lifespan)


def _today():
    return datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)


def _d(s):
    try:
        return datetime.fromisoformat(str(s)[:10])
    except Exception:  # noqa: BLE001
        return None


def _days_left(dt: datetime) -> int:
    return (dt - _today()).days


def evaluate(db: Session):
    """重新评估全部预警（幂等：按 signature 去重）"""
    added = 0
    records = {m: db.query(PmcRecord).filter(PmcRecord.module == m, PmcRecord.archived == 0).all() for m in [
        "sales_order", "purchase_order", "minmax_stock", "safety_stock", "work_order",
        "equipment", "slow_stock", "iqc_quality", "process_quality", "finished_quality",
        "mrp", "report_capacity", "bom_loss", "ecn", "stocktake",
    ]}

    def emit(module, sig, data):
        nonlocal added
        exists = db.query(WarningRecord).filter(
            WarningRecord.module == module, WarningRecord.signature == sig, WarningRecord.status != "已消除"
        ).first()
        if not exists:
            db.add(WarningRecord(module=module, signature=sig, data=data, status="待处理"))
            added += 1

    # 订单交期
    for s in records["sales_order"]:
        d = _d(s.data.get("承诺交期"))
        if d and s.data.get("状态") != "已取消":
            dl = _days_left(d)
            if dl < 0:
                emit("warn_delivery", f"del|{s.data.get('订单号')}", {"订单号": s.data.get("订单号"), "客户": s.data.get("客户"), "剩余天数": dl, "预警级别": "高", "说明": "交期已逾期"})
            elif dl <= 7:
                emit("warn_delivery", f"del|{s.data.get('订单号')}", {"订单号": s.data.get("订单号"), "客户": s.data.get("客户"), "剩余天数": dl, "预警级别": "高", "说明": f"距交期 {dl} 天"})

    # 采购延期
    for p in records["purchase_order"]:
        d = _d(p.data.get("计划到货"))
        if d and p.data.get("状态") not in ("已到货", "已关闭"):
            dl = _days_left(d)
            if dl < 0:
                emit("warn_purchase", f"po|{p.data.get('采购单号')}", {"采购单号": p.data.get("采购单号"), "供应商": p.data.get("供应商"), "延期天数": -dl, "预警级别": "高", "说明": "计划到货已逾期"})

    # 工单延期
    for w in records["work_order"]:
        d = _d(w.data.get("计划完工"))
        if d and w.data.get("状态") not in ("已完工", "已结案") and _days_left(d) < 0:
            emit("warn_wo", f"wo|{w.data.get('工单号')}", {"工单号": w.data.get("工单号"), "产品名称": w.data.get("产品名称"), "延期天数": -_days_left(d), "预警级别": "高"})

    # 设备维保
    for e in records["equipment"]:
        d = _d(e.data.get("下次维保"))
        if d:
            dl = _days_left(d)
            if 0 <= dl <= 7:
                emit("warn_equip", f"eq|{e.data.get('设备编码') or e.data.get('设备名称')}", {"设备名称": e.data.get("设备名称"), "剩余天数": dl, "预警级别": "中", "说明": "维保即将到期"})

    # 品质异常
    for q in [*records["iqc_quality"], *records["process_quality"], *records["finished_quality"]]:
        if q.data.get("状态") != "已关闭":
            emit("warn_quality", f"q|{q.data.get('异常单号')}", {"异常单号": q.data.get("异常单号"), "异常类型": "品质", "异常等级": q.data.get("异常等级"), "预警级别": "中"})

    db.commit()
    if added:
        logger.info("新增预警 %d 条", added)
    return added


def on_event(channel, method, properties, body):
    """RabbitMQ 消费者：收到数据变更事件后重新评估预警"""
    try:
        msg = json.loads(body)
        logger.info("收到事件: %s", msg.get("module"))
        db = next(get_db())
        try:
            evaluate(db)
        finally:
            db.close()
    except Exception as e:  # noqa: BLE001
        logger.warning("事件处理失败: %s", e)


class HandleIn(BaseModel):
    status: str = "已消除"


@app.get("/api/warnings", tags=["warning"])
def list_warnings(
    _: None = Depends(require_internal),
    db: Session = Depends(get_db),
    module: str = "",
    status: str = "",
    limit: int = Query(100, le=500),
):
    query = db.query(WarningRecord)
    if module:
        query = query.filter(WarningRecord.module == module)
    if status:
        query = query.filter(WarningRecord.status == status)
    rows = query.order_by(WarningRecord.id.desc()).limit(limit).all()
    return {"items": [{"id": r.id, "module": r.module, "status": r.status, **r.data} for r in rows]}


@app.post("/api/warnings/recalc", tags=["warning"])
def recalc(_: None = Depends(require_internal), db: Session = Depends(get_db)):
    n = evaluate(db)
    return {"added": n, "ok": True}


@app.patch("/api/warnings/{warning_id}/handle", tags=["warning"])
def handle(warning_id: int, body: HandleIn, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rec = db.query(WarningRecord).filter(WarningRecord.id == warning_id).first()
    if not rec:
        from fastapi import HTTPException
        raise HTTPException(404, "预警不存在")
    rec.status = body.status
    db.commit()
    return {"id": warning_id, "status": body.status}


@app.get("/healthz", tags=["ops"])
def health():
    return {"service": "warning", "status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("services.warning.main:app", host="0.0.0.0", port=8003)
