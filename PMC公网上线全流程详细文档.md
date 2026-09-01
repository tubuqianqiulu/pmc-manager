# PMC 管理工作台 · 公网上线全流程详细文档（通俗详解版）

> **从服务器环境安装 → 项目部署 → 公网正式访问** 完整实录
> 本版在每步操作前解释"这是在干嘛"，对每条命令拆解"装的是什么/干什么用"
> 生成日期：2026-09-01 ｜ 适用：腾讯云轻量服务器（Ubuntu 22.04）

---

## 快速认识：这整件事在干嘛

用一句大白话概括全流程：

> **租一间"云上的房子"（服务器）→ 给房子装好"水电"（Docker 环境）→ 把我们的软件搬进去（部署）→ 在门口挂个"招牌"（域名）+ 装个"安全门"（HTTPS）→ 告诉大家地址，大家就能访问了。**

下面每一步，我都先说"为什么要做"，再说"做了什么"。

---

## 一、项目背景与最终成果

### 1.1 项目是什么

**PMC 管理工作台**：一套面向生产与物料控制（PMC）的完整管理软件，含销售订单、生产计划、物料 BOM、采购、库存、车间、品质、委外、报表、预警等 102 个业务模块。

### 1.2 技术架构（每个组件是干嘛的）

| 组件 | 是干嘛的（人话） |
|---|---|
| **Vue3 前端** | 用户看到的界面（网页），负责展示和交互 |
| **Nginx** | 前端网页的"服务员"，负责把网页发给浏览器，并把 API 请求转给后端 |
| **FastAPI 网关** | 所有请求的"大门保安"，检查登录身份（JWT）、限流防攻击、把请求分发给对应微服务 |
| **4 个微服务** | 分工干活的"部门"：auth=管账号密码、pmc=管业务数据、warning=管预警、report=管统计报表 |
| **PostgreSQL** | "仓库"，所有数据存在这里（订单、库存、台账等） |
| **RabbitMQ** | "传话员"，服务之间发消息（比如数据变了 → 通知预警） |
| **Caddy** | "前台接待"，公网唯一入口，自动给网站加 HTTPS 加密 |
| **Docker** | "集装箱系统"，把每个软件打包成独立容器，互不干扰、一键启动 |

### 1.3 最终成果（已上线）

| 项 | 值 |
|---|---|
| **正式访问地址** | **https://pcm-personal.com** |
| 备用访问 | https://www.pcm-personal.com ｜ http://139.199.12.160（自动跳 HTTPS） |
| **管理员账号** | `admin` / `admin123` |
| 服务器 | 腾讯云轻量 2核4G / 60G SSD / 500G流量 / 广州 |
| 系统 | Ubuntu 22.04 LTS |

---

## 二、阶段一：服务器准备

### 2.1 选购云服务器

**为什么要买**：要让全世界能访问你的网站，需要一个 24 小时开机、有公网 IP 的电脑——自己家电脑不能保证，所以"租"云服务器。

**选什么**：
- **2核4G**：2 个 CPU 核心 + 4GB 内存，够跑我们这套系统（9 个容器），是入门主流配置
- **60G SSD**：硬盘 60GB，系统 + 软件 + 数据库都够
- **500G 流量**：每月能向外传送 500GB 数据，PMC 这类工具用量很小，够用
- **广州**：离你近，访问快

### 2.2 系统镜像选择（非常重要）

**镜像 = 服务器的"操作系统"**。必须选 **Ubuntu 22.04 LTS（Linux 系统）**。

**为什么必须 Linux 而不是 Windows**：
- 我们的软件全部用 **Docker（Linux 容器）** 技术打包，只有 Linux 系统能原生运行
- Windows 服务器跑不了 Linux 容器，宝塔 Windows 版也没有 Docker 管理器
- 如果买错了（选了"宝塔Windows面板"），控制台有**「重装系统」**按钮可免费换成 Ubuntu（新机器没数据，零损失）

**验证重装成功**：网页终端（OrcaTerm）登录后提示符显示 `root@VM-xxx-ubuntu:~#`（root=超级管理员，ubuntu=系统名）。

### 2.3 防火墙放行

**为什么**：服务器的"门"默认全锁着，谁都不让进。我们要开放 3 个门：
- **22 端口**：SSH 远程管理门（你要连服务器改东西）
- **80 端口**：普通网页门（HTTP）
- **443 端口**：加密网页门（HTTPS）

**怎么开**：控制台 → 实例详情 → **「防火墙」** tab → 添加 3 条规则（来源 `0.0.0.0/0` = 允许所有人访问）：

| 应用类型 | 协议 | 端口 | 作用 |
|---|---|---|---|
| Linux登录(22) | TCP | 22 | SSH 远程管理 |
| HTTP(80) | TCP | 80 | 普通网页 |
| HTTPS(443) | TCP | 443 | 加密网页 |

> 这步不做，外部永远连不上——是最常见的卡点。腾讯云轻量的叫「防火墙」（在实例详情页里，不是安全组）。

### 2.4 SSH 连接服务器

**SSH 是什么**：一种安全的远程登录方式，让你在自己电脑上操作千里之外的服务器，就像坐在服务器面前敲键盘一样。

**命令**（Windows PowerShell 自带 SSH，不用装东西）：
```powershell
ssh root@139.199.12.160
# 输入 root 密码，出现 root@VM-xxx-ubuntu:~# 即连接成功
```
**拆解**：`ssh` = 远程登录命令；`root` = 登录用户名（超级管理员）；`@139.199.12.160` = 服务器地址。

**验证连通**（本机执行）：
```powershell
Test-NetConnection 139.199.12.160 -Port 22   # TcpTestSucceeded: True 表示 22 门开着
```

---

## 三、阶段二：服务器环境搭建（Docker）

### 3.1 安装 Docker

**Docker 是什么（人话）**：一个"软件集装箱系统"。我们的系统有 9 个软件组件（前端、网关、4 个微服务、数据库、消息队列、Caddy），如果直接装在一起容易互相打架、还难卸载。Docker 把每个软件装进独立"集装箱"（容器），一键启动、互不干扰、到哪都能跑。

**安装步骤拆解**：

```bash
# ① 先更新软件列表（apt 是 Ubuntu 的"应用商店"，update 是刷新商店目录）
apt-get update

# ② 安装 3 个基础小工具：
#    ca-certificates = 证书工具（下载时验证网站身份用）
#    curl           = 命令行下载工具（用来下载东西）
#    gnupg          = 加密工具（用来验证下载的软件是否可信）
apt-get install -y ca-certificates curl gnupg

# ③ 创建存放"软件钥匙"的目录（install -m 0755 -d = 建目录并设置权限）
install -m 0755 -d /etc/apt/keyrings

# ④ 下载 Docker 官方的"软件源钥匙"，放进钥匙目录
#    作用：apt 商店从此信任 Docker 官方这个"卖家"
curl -fsSL https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# ⑤ 把 Docker 官方"店铺"加进 apt 商店列表（jammy = Ubuntu 22.04 的代号）
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/docker.gpg] https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu jammy stable" > /etc/apt/sources.list.d/docker.list

# ⑥ 再次刷新商店列表（让 Docker 店铺上架）
apt-get update

# ⑦ 正式安装 Docker 全家桶，4 个包各管一摊：
#    docker-ce             = Docker 主程序（核心引擎，负责运行容器）
#    docker-ce-cli         = Docker 命令行工具（你在终端敲 docker xxx 靠它）
#    containerd.io         = 容器运行时（真正把容器"跑起来"的底层引擎）
#    docker-buildx-plugin  = 镜像构建插件（把软件代码打包成镜像用）
#    docker-compose-plugin = 编排工具（一条命令同时启动/管理 9 个容器）
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# ⑧ 启动 Docker 并设为开机自启（enable=开机自动启动，start=现在启动）
systemctl enable --now docker

# ⑨ 验证装好没有（有版本号输出即成功）
docker --version        # 例：Docker version 29.x
docker compose version  # 例：Docker Compose version v5.x
```

### 3.2 配置国内镜像加速器

**为什么**：Docker 装软件要上网"拉镜像"，但 Docker 的官方仓库（Docker Hub）**在中国被墙了**，直接拉会超时失败。所以给 Docker 配一个"国内中转站"（镜像加速器），让它从国内仓库下载。

**命令拆解**：
```bash
# 创建 Docker 配置目录
mkdir -p /etc/docker

# 写入加速器配置（cat <<'EOF' 表示"从下面开始写入内容直到 EOF 结束"）
cat > /etc/docker/daemon.json <<'EOF'
{
  "registry-mirrors": [
    "https://mirror.ccs.tencentyun.com",   # 腾讯云内网镜像（本服务器专属，最快）
    "https://docker.m.daocloud.io"         # 备用公共镜像
  ]
}
EOF

# 重启 Docker 让配置生效
systemctl restart docker

# 验证加速器是否生效（能看到 Registry Mirrors 列表即成功）
docker info | grep -A3 'Registry Mirrors'
```

---

## 四、阶段三：项目部署与镜像构建

### 4.1 拉取项目代码

**为什么**：项目源码在 GitHub 上，服务器需要把代码下载下来。

```bash
cd /opt          # 进入 /opt 目录（Linux 放软件的常用位置）
git clone --depth 1 https://github.com/tubuqianqiulu/pmc-manager.git
# git clone = 下载代码；--depth 1 = 只要最新版（省流量）；后面是仓库地址
```

下载后结构：
```
/opt/pmc-manager/
├── frontend/          # 前端代码
├── backend/           # 后端代码（5 个微服务共用）
├── docker-compose.yml # 本地开发用编排
└── deploy/            # 生产部署包（本次用的）
```

### 4.2 镜像来源决策

**背景**：生产部署包原本引用 GitHub 上的现成镜像（ghcr.io），但 GitHub 的镜像包**默认是私有的**，服务器匿名拉取会被拒绝（报 `unauthorized`）。

**决策**：改为在服务器上**用源码直接构建镜像**——源码已在服务器，不需要任何账号密码，最稳妥。

### 4.3 构建镜像

**"构建镜像"是什么**：把源代码 + 运行环境打包成一个"集装箱"（镜像），以后每个集装箱一启动就是一个完整软件。

**先给构建加速**（两个 sed 命令 = 修改 Dockerfile 里的下载源）：
```bash
cd /opt/pmc-manager

# 后端：把 pip（Python 的下载工具）默认源换成清华源（国内快）
# sed 的写法：s/旧内容/新内容/  = 把文件里的旧内容替换成新内容
sed -i 's#pip install --no-cache-dir -r requirements.txt#pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple#' backend/Dockerfile

# 前端：把 npm（JS 的下载工具）默认源换成 npmmirror（国内快）
sed -i 's#RUN npm ci || npm install#RUN npm config set registry https://registry.npmmirror.com \&\& npm ci || npm install#' frontend/Dockerfile
```

**构建后端镜像**（约 5-10 分钟）：
```bash
# docker build = 打包；-t = 给镜像起名；./backend = 打包哪个目录
docker build -t pmc-backend:local ./backend
```

**为什么 5 个服务共用一个镜像**：4 个微服务 + 网关的代码都在 backend 目录里，所以打包成一个镜像，启动时用不同命令告诉它"你是哪个部门"。
```bash
# 给同一个镜像打 5 个标签（标签=别名，让生产配置能按名找到它）
for svc in auth-service pmc-service warning-service report-service gateway; do
  docker tag pmc-backend:local ghcr.io/tubuqianqiulu/pmc-manager-$svc:latest
done
```

**构建前端镜像**：
```bash
docker build -t ghcr.io/tubuqianqiulu/pmc-manager-frontend:latest ./frontend
# 前端构建是"多阶段"的：先用 Node 把源码编译成网页文件，再用 Nginx 托管
```

### 4.4 生成生产配置（.env + Caddyfile）

**.env 是什么**：一个"配置文件"，存放系统的 3 个密码/密钥，软件启动时读取。

```bash
cd /opt/pmc-manager/deploy

# openssl rand -hex 32 = 生成 32 字节随机字符串（乱码密码）
# 三个变量分别是：
#   JWT_SECRET     = 登录令牌的签名密码（防止别人伪造登录）
#   INTERNAL_TOKEN = 内部服务互相信任的暗号
#   DB_PASSWORD    = 数据库的密码
JWT=$(openssl rand -hex 32)
INT=$(openssl rand -hex 16)
DBP=$(openssl rand -hex 16)

# 把三个密码写进 .env 文件（printf = 按格式输出并保存）
printf 'JWT_SECRET=%s\nINTERNAL_TOKEN=%s\nDB_PASSWORD=%s\nCORS_ORIGINS=*\nRATE_LIMIT=120/minute\n' "$JWT" "$INT" "$DBP" > .env

# 无域名阶段：把 Caddyfile 里"示例域名"改成"监听 80 端口"（先让 IP 能访问）
sed -i 's/^pmc\.example\.com {/:80 {/' Caddyfile
```

---

## 五、阶段四：启动与故障修复

### 5.1 启动全部服务

**docker compose 是什么**：把 9 个容器按编排文件（docker-compose.prod.yml）一次全部启动，不用一个个手动起。

```bash
cd /opt/pmc-manager/deploy
# -f 指定用哪个编排文件（重要！默认文件名是 docker-compose.yml，我们是 .prod.yml 所以要指定）
# up = 启动；-d = 后台运行（不占终端）
docker compose -f docker-compose.prod.yml up -d

# 查看 9 个容器状态（都显示 Up 即正常）
docker compose -f docker-compose.prod.yml ps
```

### 5.2 遇到的 Bug：下游服务不可用（已修复）

**现象**：网页能打开，但登录报 `{"detail":"下游服务不可用"}`。

**根因（人话）**：9 个容器里，5 个后端容器都"忘记告诉自己要干什么岗位"，结果全都跑去当了"网关保安"，真正的登录部门（auth）没人在岗。网关去找登录部门发现没人，就报"下游服务不可用"。

**原因**：生产配置文件里**漏写了每个服务的启动命令（command）**。

**修复**：给 5 个服务补上各自的岗位命令：

| 服务 | 岗位命令 | 端口 |
|---|---|---|
| gateway | `uvicorn gateway.main:app --host 0.0.0.0 --port 8000` | 8000 |
| auth-service | `uvicorn services.auth.main:app --host 0.0.0.0 --port 8001` | 8001 |
| pmc-service | `uvicorn services.pmc.main:app --host 0.0.0.0 --port 8002` | 8002 |
| warning-service | `uvicorn services.warning.main:app --host 0.0.0.0 --port 8003` | 8003 |
| report-service | `uvicorn services.report.main:app --host 0.0.0.0 --port 8004` | 8004 |

```bash
# 修复后强制重建（让新命令生效）
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

**同时**：此修复已推送到 GitHub（commit a3fa920），保证仓库里的部署包是对的。

### 5.3 验证端口

```bash
# curl = 命令行访问网页；-A "Mozilla/5.0" = 假装是浏览器（因为系统有反爬，真用 curl 会被拦 403）
curl -s -o /dev/null -w '%{http_code}\n' -A "Mozilla/5.0" http://localhost/   # 200 = 网页正常
```

---

## 六、阶段五：全链路验证

**验证 = 确认整条链路真的通了**（登录 → 业务 → 预警 → 报表）：

```bash
# 1) 登录：用管理员账号换一个"登录令牌"（token）
curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
# 返回 access_token 即成功（后续请求带上它就代表"我是已登录的 admin"）

# 2) 业务数据：查销售订单台账（带上令牌）
curl -s -H "Authorization: Bearer <token>" http://localhost/api/pmc/sales_order
# → {"total":0,"items":[]}

# 3) 预警服务
curl -s -H "Authorization: Bearer <token>" http://localhost/api/warnings
# → {"items":[]}

# 4) 报表服务
curl -s -H "Authorization: Bearer <token>" http://localhost/api/reports/overview
# → {"work_order_total":0,"sales_order_total":0,...}
```

> **网关路由规则（人话）**：所有请求统一走 `/api/服务名/功能名`。服务名是 `auth` / `pmc` / `warnings` / `reports`（注意 warnings/reports 是复数）。除了登录和注册，其他接口都要带令牌（JWT）。前端 Nginx 会自动把 `/api/` 开头的请求转发给网关。

---

## 七、阶段六：域名购买与 HTTPS 上线

### 7.1 购买域名

**域名是什么**：网站的"门牌号/招牌"。服务器地址是一串数字（139.199.12.160）很难记，域名（pcm-personal.com）是给这串数字起的好记名字。

**流程**：
1. 腾讯云 DNSPod（https://dnspod.cn）搜索名字 + 后缀 `.com`
2. **只买域名**（约 83 元/年），不买附加项（SSL证书/DNS套餐/企业邮箱都是坑，我们的方案用免费的）
3. **实名认证**：填个人姓名 + 身份证正反面（国内域名强制要求，1 小时内通过，通过前域名不能用）

### 7.2 DNS 解析（把名字指到服务器）

**DNS 解析是什么**：在"电话簿"（DNS）里登记——"pcm-personal.com 这个牌子，挂在 139.199.12.160 这台服务器上"。别人输入域名，就知道去哪个服务器。

添加 2 条 A 记录（A = Address，记录"域名→IP"的对应关系）：
- `@`（代表根域名 pcm-personal.com）→ 139.199.12.160
- `www`（代表 www.pcm-personal.com）→ 139.199.12.160

**验证生效**（本机执行，看到返回 139.199.12.160 即生效）：
```powershell
nslookup pcm-personal.com 8.8.8.8
```

### 7.3 切换 Caddy 到域名 HTTPS

**HTTPS 是什么**：网站加密协议，地址栏显示小锁，数据加密传输，别人偷看也看不懂。浏览器对没加密的网站会提示"不安全"。

**Caddy 的魔法**：只要把配置里的域名写对，Caddy **自动向 Let's Encrypt（免费证书机构）申请证书并自动续期**，零配置搞定 HTTPS。

服务器上把 Caddyfile 改成域名版：
```
pcm-personal.com, www.pcm-personal.com {
	encode gzip                                  # 网页压缩，传得更快
	handle {
		reverse_proxy frontend:80                # 把所有请求转给前端容器
	}
	header {                                     # 加安全响应头（防嗅探/点击劫持）
		-X-Server
		X-Content-Type-Options "nosniff"
		X-Frame-Options "DENY"
		Referrer-Policy "no-referrer"
	}
}
```

```bash
docker restart pmc-manager-prod-caddy-1   # 重启 Caddy 让新配置生效
```

### 7.4 上线验证

```
https://pcm-personal.com        → 200  ✅（加密网页正常）
https://www.pcm-personal.com    → 200  ✅
http://pcm-personal.com         → 308 跳转 https ✅（访问 http 自动跳加密）
https://pcm-personal.com/api/auth/login → 200（登录接口正常）✅
```

---

## 八、踩坑记录与解决方案（8 个真实坑）

| # | 问题 | 现象 | 为什么 | 怎么解决 |
|---|---|---|---|---|
| 1 | 镜像选错 | 买来是 Windows 系统 | 买了"宝塔Windows面板"镜像 | 控制台免费重装 Ubuntu 22.04 |
| 2 | 端口连不上 | 22/80/443 全超时 | 防火墙没放行 | 防火墙加 22/80/443 规则 |
| 3 | Docker Hub 拉不动 | `registry-1.docker.io i/o timeout` | Docker 官方仓库国内被墙 | daemon.json 配国内加速器 |
| 4 | ghcr 镜像拉取失败 | `unauthorized` | GitHub 镜像包默认私有 | 改服务器本地构建 |
| 5 | 构建下载慢 | 卡在下载 | 国外源国内慢 | 换清华 pip 源 / npmmirror |
| 6 | 登录报下游不可用 | `下游服务不可用` | 生产配置漏写 command，5 服务全跑网关 | 补 5 条 command + 重建 |
| 7 | curl 访问 403 | 返回 403 | 反爬机制拦工具 UA | 正常防护，浏览器访问即可 |
| 8 | 预警/报表报未知服务 | `未知服务` | 服务名是复数 warnings/reports | 用 `/api/warnings`、`/api/reports` |

---

## 九、日常运维命令速查

| 想做什么 | 命令 |
|---|---|
| 看 9 个容器状态 | `docker compose -f /opt/pmc-manager/deploy/docker-compose.prod.yml ps` |
| 看某个服务日志 | `docker logs -f pmc-manager-prod-gateway-1` |
| 重启全部 | `docker compose -f .../docker-compose.prod.yml restart` |
| 停止全部 | `docker compose -f .../docker-compose.prod.yml down` |
| **备份数据库** | `docker exec pmc-manager-prod-postgres-1 pg_dump -U pmc pmc > backup_$(date +%F).sql` |
| 恢复数据库 | `cat backup.sql \| docker exec -i pmc-manager-prod-postgres-1 psql -U pmc pmc` |
| 更新代码 | `cd /opt/pmc-manager && git pull` |
| 更新后重建 | 重新构建镜像（见 4.3）→ `docker compose -f ... up -d --force-recreate` |
| HTTPS 证书续期 | 自动（Let's Encrypt 90 天自动续，Caddy 托管，无需管） |

---

## 十、重要信息备忘

| 项 | 值 |
|---|---|
| 正式地址 | https://pcm-personal.com |
| 管理员账号 | admin / admin123（⚠️ 上线后尽快改！） |
| 公网 IP | 139.199.12.160 |
| 实例 ID | lhins-8586ckll |
| 服务器系统 | Ubuntu 22.04 LTS |
| 项目目录 | /opt/pmc-manager |
| 生产配置目录 | /opt/pmc-manager/deploy |
| 容器前缀 | pmc-manager-prod-* |
| GitHub 仓库 | https://github.com/tubuqianqiulu/pmc-manager |
| 本机项目源码 | D:\PMC_Manager |

---

*文档结束 · 按此文档可在一台全新 Ubuntu 服务器上完整复现整个部署*
