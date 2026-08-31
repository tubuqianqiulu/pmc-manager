# API 网关：统一入口
#  - JWT 鉴权（除 /api/auth/login 外所有接口）
#  - 服务间内部令牌透传
#  - 限流（slowapi，按 IP）
#  - 安全响应头 / CORS 白名单 / 反爬（User-Agent 校验等）
import logging

import httpx
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from common.config import settings
from common.security import decode_token

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gateway")

app = FastAPI(title="PMC API Gateway", version="1.0.0", redirect_slashes=False)

# ---------- 限流 ----------
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.rate_limit])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ---------- CORS ----------
origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins != ["*"] else ["*"],
    allow_credentials=False if origins == ["*"] else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- 反爬 / 基础防护 ----------
_BLOCKED_UA = ["curl", "wget", "python-requests", "scrapy", "httpclient", "libwww", "apachebench", "go-http-client"]


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # 健康检查放行
    if request.url.path in ("/healthz", "/", "/docs", "/openapi.json"):
        return await call_next(request)

    # 反爬：拒绝空 UA 与常见爬虫 UA
    ua = (request.headers.get("user-agent") or "").lower()
    if not ua or len(ua) < 8 or any(b in ua for b in _BLOCKED_UA):
        return Response(status_code=403, content='{"detail":"Forbidden"}', media_type="application/json")

    # 拒绝可疑请求头（SQL 注入 / XSS 特征）
    danger = ["<script", "select%20", "union%20select", "';--", "javascript:"]
    for k, v in request.headers.items():
        if any(d in v.lower() for d in danger):
            return Response(status_code=400, content='{"detail":"Bad Request"}', media_type="application/json")

    resp = await call_next(request)
    # 安全响应头
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "DENY"
    resp.headers["X-XSS-Protection"] = "1; mode=block"
    resp.headers["Referrer-Policy"] = "no-referrer"
    resp.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    resp.headers["Cache-Control"] = "no-store"
    return resp


# ---------- 服务路由表 ----------
SERVICES = {
    "auth": settings.auth_service_url,
    "pmc": settings.pmc_service_url,
    "warnings": settings.warning_service_url,
    "reports": settings.report_service_url,
}

_WHITELIST = {("auth", "login"), ("auth", "register")}


async def _proxy(request: Request, service: str, path: str):
    base = SERVICES.get(service)
    if not base:
        raise HTTPException(404, "未知服务")

    # JWT 鉴权（白名单接口除外）
    if (service, path) not in _WHITELIST:
        authz = request.headers.get("authorization", "")
        token = authz.replace("Bearer ", "").strip()
        if not token:
            raise HTTPException(401, "未登录")
        decode_token(token)  # 无效/过期则抛 401

    url = f"{base}/api/{service}" + (f"/{path}" if path else "")
    if request.url.query:
        url += "?" + request.url.query

    headers = {"X-Internal-Token": settings.internal_token}
    # 透传关键头（业务服务需要 authorization 用于 /me）
    if request.headers.get("authorization"):
        headers["Authorization"] = request.headers["authorization"]
    if request.headers.get("content-type"):
        headers["Content-Type"] = request.headers["content-type"]

    body = await request.body()
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.request(request.method, url, content=body, headers=headers)
    except httpx.HTTPError as e:
        logger.error("转发失败 %s -> %s: %s", request.url.path, url, e)
        raise HTTPException(502, "下游服务不可用")

    media = resp.headers.get("content-type", "application/json")
    return Response(content=resp.content, status_code=resp.status_code, media_type=media)


@app.api_route("/api/{service}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit)
async def proxy_bare(request: Request, service: str):
    return await _proxy(request, service, "")


@app.api_route("/api/{service}/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit(settings.rate_limit)
async def proxy(request: Request, service: str, path: str):
    return await _proxy(request, service, path)


@app.get("/")
def root():
    return {"service": "PMC API Gateway", "version": "1.0.0", "services": list(SERVICES.keys()), "docs": "/docs"}


@app.get("/healthz")
def health():
    return {"service": "gateway", "status": "ok"}
