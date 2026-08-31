# 报表微服务：跨模块聚合统计，供仪表盘与报表中心使用
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from sqlalchemy.orm import Session

from common.database import Base, engine, get_db, init_db
from common.models import PmcRecord, WarningRecord
from common.security import require_internal

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="PMC Report Service", version="1.0.0", lifespan=lifespan)


def _sum(db: Session, module: str, field: str) -> float:
    rows = db.query(PmcRecord).filter(PmcRecord.module == module).all()
    return round(sum(float(r.data.get(field) or 0) for r in rows), 2)


def _count(db: Session, module: str) -> int:
    return db.query(PmcRecord).filter(PmcRecord.module == module, PmcRecord.archived == 0).count()


@app.get("/api/reports/overview", tags=["report"])
def overview(_: None = Depends(require_internal), db: Session = Depends(get_db)):
    return {
        "work_order_total": _count(db, "work_order"),
        "sales_order_total": _count(db, "sales_order"),
        "purchase_order_total": _count(db, "purchase_order"),
        "inventory_amount": _sum(db, "raw_inventory", "金额") + _sum(db, "finished_inventory", "金额"),
        "pending_warnings": db.query(WarningRecord).filter(WarningRecord.status == "待处理").count(),
        "stock_amount_raw": _sum(db, "raw_inventory", "金额"),
        "stock_amount_finished": _sum(db, "finished_inventory", "金额"),
    }


@app.get("/api/reports/module/{module}/summary", tags=["report"])
def module_summary(module: str, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rows = db.query(PmcRecord).filter(PmcRecord.module == module, PmcRecord.archived == 0).all()
    numeric = {}
    for r in rows:
        for k, v in r.data.items():
            try:
                v = float(v)
            except (TypeError, ValueError):
                continue
            numeric.setdefault(k, []).append(v)
    return {
        "count": len(rows),
        "numeric_sums": {k: round(sum(vs), 2) for k, vs in numeric.items()},
        "numeric_avgs": {k: round(sum(vs) / len(vs), 2) for k, vs in numeric.items()},
    }


@app.get("/healthz", tags=["ops"])
def health():
    return {"service": "report", "status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("services.report.main:app", host="0.0.0.0", port=8004)
