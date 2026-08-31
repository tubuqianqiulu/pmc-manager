# 端到端联调脚本：验证 网关(JWT/转发/限流/反爬) -> 认证服务 -> 数据服务 全链路
import httpx

BASE = "http://127.0.0.1:8000"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) PMC-Manager-Test/1.0"}

c = httpx.Client(headers=UA, timeout=15)

# 1. 反爬：爬虫 UA 访问业务路径应被拒绝（/healthz 属于白名单放行）
r = c.get(BASE + "/api/auth/login", headers={"User-Agent": "curl/8.0"})
assert r.status_code == 403, r.status_code
print("[PASS] 反爬拦截 curl UA ->", r.status_code)

# 2. 登录
r = c.post(BASE + "/api/auth/login", json={"username": "admin", "password": "admin123"})
assert r.status_code == 200, r.text
token = r.json()["access_token"]
print("[PASS] 登录成功，获取 JWT")

# 3. 未带令牌访问受保护接口应 401
r = c.get(BASE + "/api/pmc/sales_order")
assert r.status_code == 401, r.status_code
print("[PASS] 未登录访问被拒 401")

# 4. 带令牌新增/查询
h = {"Authorization": f"Bearer {token}"}
r = c.post(BASE + "/api/pmc/sales_order", json={"data": {"订单号": "SO-E2E001", "客户": "联调客户", "产品名称": "测试产品", "数量": 10}}, headers=h)
assert r.status_code == 201, r.text
rid = r.json()["id"]
r = c.get(BASE + "/api/pmc/sales_order", headers=h)
assert r.status_code == 200 and r.json()["total"] >= 1
print("[PASS] JWT 鉴权 + 数据服务 CRUD 创建/查询")

# 5. 更新 + 归档
r = c.put(BASE + f"/api/pmc/sales_order/{rid}", json={"data": {"订单号": "SO-E2E001", "客户": "联调客户", "数量": 20}}, headers=h)
assert r.status_code == 200
r = c.patch(BASE + f"/api/pmc/sales_order/{rid}/archive", headers=h)
assert r.status_code == 200 and r.json()["archived"] == 1
print("[PASS] 更新与归档接口")

# 6. 删除
r = c.delete(BASE + f"/api/pmc/sales_order/{rid}", headers=h)
assert r.status_code == 200
print("[PASS] 删除接口")

# 7. 报表聚合
r = c.get(BASE + "/api/reports/overview", headers=h)
assert r.status_code == 200 and "work_order_total" in r.json()
print("[PASS] 报表服务聚合", r.json())

# 8. 无效 token 应 401
r = c.get(BASE + "/api/pmc/sales_order", headers={"Authorization": "Bearer bad.token.here"})
assert r.status_code == 401
print("[PASS] 无效 JWT 被拒 401")

print("\n=== 端到端联调全部通过 ===")
