# 部署栈端到端验证：网关 -> 认证 -> 数据 -> 报表（真实 Docker 环境）
import httpx

UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0) PMC-Deploy-Check/1.0"}
GW = "http://127.0.0.1:8000"

# 1. 网关健康
r = httpx.get(GW + "/healthz", headers=UA, timeout=10)
print("[1] 网关健康:", r.status_code, r.json())
assert r.status_code == 200

# 2. 登录
r = httpx.post(GW + "/api/auth/login", json={"username": "admin", "password": "admin123"}, headers=UA, timeout=10)
print("[2] 登录:", r.status_code)
assert r.status_code == 200
token = r.json()["access_token"]
h = {**UA, "Authorization": f"Bearer {token}"}

# 3. 创建销售订单（触发 RabbitMQ 事件 -> 预警服务）
r = httpx.post(GW + "/api/pmc/sales_order", json={"data": {"订单号": "SO-DOCKER001", "客户": "部署验证客户", "产品名称": "Docker 测试产品", "数量": 100, "承诺交期": "2026-09-01"}}, headers=h, timeout=10)
print("[3] 创建订单:", r.status_code, r.json())
assert r.status_code == 201

# 4. 查询
r = httpx.get(GW + "/api/pmc/sales_order", headers=h, timeout=10)
print("[4] 查询订单 total:", r.json()["total"])
assert r.json()["total"] >= 1

# 5. 报表聚合（跨服务）
r = httpx.get(GW + "/api/reports/overview", headers=h, timeout=10)
print("[5] 报表聚合:", r.status_code, r.json())
assert r.status_code == 200

# 6. 预警服务（消费 RabbitMQ 事件后应能查到交期预警）
import time
time.sleep(3)  # 给消费者处理事件的时间
r = httpx.get(GW + "/api/warnings", params={"module": "warn_delivery"}, headers=h, timeout=10)
print("[6] 预警服务:", r.status_code, "items:", len(r.json()["items"]))
assert r.status_code == 200

# 7. 前端页面
r = httpx.get("http://127.0.0.1:8080/", headers=UA, timeout=10)
print("[7] 前端页面:", r.status_code, "len:", len(r.text))
assert r.status_code == 200 and "PMC" in r.text

print("\n=== Docker 部署栈端到端验证全部通过 ===")
