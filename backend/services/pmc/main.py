# PMC 数据微服务：通用模块 CRUD + CSV 导出，数据变更通过 RabbitMQ 广播事件
import csv
import io
import json
import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Query, Response
from pydantic import BaseModel
from sqlalchemy import or_
from sqlalchemy.orm import Session

from common.config import settings
from common.database import Base, engine, get_db
from common.models import OperationLog, PmcRecord
from common.rabbit import publish
from common.security import require_internal

logger = logging.getLogger("pmc")
logging.basicConfig(level=logging.INFO)

CHANNEL_CHANGED = "pmc.data.changed"


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="PMC Data Service", version="1.0.0", lifespan=lifespan)


class RecordIn(BaseModel):
    data: dict


def _emit(module: str, action: str, record_id: int | None = None):
    publish(
        settings.rabbitmq_url,
        CHANNEL_CHANGED,
        {"module": module, "action": action, "id": record_id, "ts": __import__("datetime").datetime.now().isoformat()},
        enabled=settings.rabbitmq_enabled,
    )


@app.get("/api/pmc/modules", tags=["pmc"])
def list_modules(_: None = Depends(require_internal), db: Session = Depends(get_db)):
    rows = db.query(PmcRecord.module).distinct().all()
    return {"modules": [r[0] for r in rows]}


@app.get("/api/pmc/{module}", tags=["pmc"])
def list_records(
    module: str,
    _: None = Depends(require_internal),
    db: Session = Depends(get_db),
    archived: int = Query(0, ge=0, le=1),
    q: str = "",
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=200),
):
    query = db.query(PmcRecord).filter(PmcRecord.module == module, PmcRecord.archived == archived)
    if q:
        like = f"%{q}%"
        query = query.filter(or_(PmcRecord.data.cast(str).like(like)))
    total = query.count()
    rows = query.order_by(PmcRecord.id.desc()).offset((page - 1) * size).limit(size).all()
    return {"total": total, "items": [{**r.data, "id": r.id, "archived": r.archived} for r in rows]}


@app.post("/api/pmc/{module}", tags=["pmc"], status_code=201)
def create_record(module: str, body: RecordIn, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rec = PmcRecord(module=module, data=body.data)
    db.add(rec)
    db.commit()
    db.refresh(rec)
    _emit(module, "create", rec.id)
    db.add(OperationLog(user="api", op="新增", target=module, detail=json.dumps(body.data, ensure_ascii=False)[:500]))
    db.commit()
    return {"id": rec.id}


@app.put("/api/pmc/{module}/{record_id}", tags=["pmc"])
def update_record(module: str, record_id: int, body: RecordIn, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rec = db.query(PmcRecord).filter(PmcRecord.id == record_id, PmcRecord.module == module).first()
    if not rec:
        raise HTTPException(404, "记录不存在")
    rec.data = body.data
    db.commit()
    _emit(module, "update", record_id)
    return {"id": record_id}


@app.delete("/api/pmc/{module}/{record_id}", tags=["pmc"])
def delete_record(module: str, record_id: int, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rec = db.query(PmcRecord).filter(PmcRecord.id == record_id, PmcRecord.module == module).first()
    if not rec:
        raise HTTPException(404, "记录不存在")
    db.delete(rec)
    db.commit()
    _emit(module, "delete", record_id)
    return {"ok": True}


@app.patch("/api/pmc/{module}/{record_id}/archive", tags=["pmc"])
def archive_record(module: str, record_id: int, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rec = db.query(PmcRecord).filter(PmcRecord.id == record_id, PmcRecord.module == module).first()
    if not rec:
        raise HTTPException(404, "记录不存在")
    rec.archived = 0 if rec.archived else 1
    db.commit()
    _emit(module, "archive", record_id)
    return {"id": record_id, "archived": rec.archived}


@app.get("/api/pmc/export/{module}", tags=["pmc"])
def export_csv(module: str, _: None = Depends(require_internal), db: Session = Depends(get_db)):
    rows = db.query(PmcRecord).filter(PmcRecord.module == module).all()
    if not rows:
        return Response(content="\uFEFF", media_type="text/csv; charset=utf-8")
    # 以所有记录键的并集作为表头
    keys: list[str] = []
    for r in rows:
        for k in r.data:
            if k not in keys:
                keys.append(k)
    buf = io.StringIO()
    buf.write("\uFEFF")
    writer = csv.writer(buf)
    writer.writerow(keys)
    for r in rows:
        writer.writerow([r.data.get(k, "") for k in keys])
    filename = f"{module}.csv"
    return Response(
        content=buf.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.get("/healthz", tags=["ops"])
def health():
    return {"service": "pmc", "status": "ok"}
