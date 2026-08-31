# 本地后端自包含验证：一条命令内 启动5服务 -> 联调测试 -> 自动停止
import os
import subprocess
import sys
import time

import httpx

ROOT = os.path.dirname(os.path.abspath(__file__))
PY = r"D:\anaconda3\envs\pmc\python.exe"

base_env = dict(os.environ)
base_env["RABBITMQ_ENABLED"] = "false"
base_env["AUTH_SERVICE_URL"] = "http://127.0.0.1:8001"
base_env["PMC_SERVICE_URL"] = "http://127.0.0.1:8002"
base_env["WARNING_SERVICE_URL"] = "http://127.0.0.1:8003"
base_env["REPORT_SERVICE_URL"] = "http://127.0.0.1:8004"

services = [
    ("auth", "services.auth.main:app", 8001),
    ("pmc", "services.pmc.main:app", 8002),
    ("warning", "services.warning.main:app", 8003),
    ("report", "services.report.main:app", 8004),
    ("gateway", "gateway.main:app", 8000),
]

procs = []
try:
    for name, mod, port in services:
        p = subprocess.Popen(
            [PY, "-m", "uvicorn", mod, "--host", "127.0.0.1", "--port", str(port)],
            cwd=ROOT, env=base_env,
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
        )
        procs.append((name, port, p))
        print(f"已启动 {name} -> 127.0.0.1:{port}", flush=True)

    # 等待全部就绪
    for _ in range(20):
        ok = True
        for _, port, p in procs:
            if p.poll() is not None:
                print(f"[警告] {port} 进程已退出 code={p.returncode}")
                ok = False
                break
            try:
                httpx.get(f"http://127.0.0.1:{port}/healthz", timeout=1)
            except Exception:
                ok = False
                break
        if ok:
            break
        time.sleep(1)
    else:
        raise SystemExit("服务未在预期时间内全部就绪")

    UA = {"User-Agent": "Mozilla/5.0 PMC-LocalDev/1.0"}
    GW = "http://127.0.0.1:8000"
    r = httpx.get(GW + "/healthz", headers=UA, timeout=8)
    print("[1] 网关健康:", r.status_code, r.json())
    assert r.status_code == 200

    r = httpx.post(GW + "/api/auth/login", json={"username": "admin", "password": "admin123"}, headers=UA, timeout=8)
    print("[2] 登录:", r.status_code)
    assert r.status_code == 200
    token = r.json()["access_token"]
    h = {**UA, "Authorization": f"Bearer {token}"}

    r = httpx.post(GW + "/api/pmc/sales_order", json={"data": {"订单号": "SO-LOCAL001", "客户": "本地验证", "产品名称": "测试", "数量": 10, "承诺交期": "2026-09-05"}}, headers=h, timeout=8)
    print("[3] 建单:", r.status_code, r.json())
    assert r.status_code == 201

    r = httpx.get(GW + "/api/pmc/sales_order", headers=h, timeout=8)
    print("[4] 查询订单 total:", r.json()["total"])
    assert r.json()["total"] >= 1

    r = httpx.get(GW + "/api/reports/overview", headers=h, timeout=8)
    print("[5] 报表聚合:", r.status_code, "sales_order_total:", r.json()["sales_order_total"])
    assert r.status_code == 200

    r = httpx.get(GW + "/api/warnings", headers=h, timeout=8)
    print("[6] 预警接口:", r.status_code, "items:", len(r.json()["items"]))
    assert r.status_code == 200

    print("\n=== PyCharm 本地后端联调全部通过 ===")
finally:
    for name, port, p in procs:
        if p.poll() is None:
            p.terminate()
    time.sleep(1)
    for name, port, p in procs:
        if p.poll() is None:
            p.kill()
    print("已停止全部验证用服务进程")
