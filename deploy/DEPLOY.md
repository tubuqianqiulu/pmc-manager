# 公网部署指南（生产环境）

本文档用于把 PMC 管理工作台部署到**公网云服务器**，让所有人通过 HTTPS 访问。
镜像已推送到 `ghcr.io/tubuqianqiulu/pmc-manager-*`（与你 GitHub 同源）。

## 一、准备

| 项 | 说明 |
|---|---|
| 云服务器 | 推荐 2核4G、Ubuntu 22.04（阿里云/腾讯云轻量均可） |
| 域名 | 可选但强烈建议（Caddy 自动签发 HTTPS 证书）。把域名解析（A 记录）指向服务器公网 IP |
| 安全组/防火墙 | 只放行 `80`、`443`、`22(SSH)`，其余全部关闭 |

## 二、服务器初始化（只需一次）

```bash
# 1. 安装 Docker（Ubuntu）
curl -fsSL https://get.docker.com | sh
sudo systemctl enable --now docker

# 2. 安装 Docker Compose 插件（一般随 Docker 自带，验证一下）
docker compose version

# 3. 拉取部署包
cd ~
git clone https://github.com/tubuqianqiulu/pmc-manager.git
cd pmc-manager/deploy
```

## 三、配置

```bash
# 1. 复制 .env 模板并填入强密码
cp .env.example .env
nano .env
#    至少设置三处：
#    JWT_SECRET=  （一长串随机字符，可用：openssl rand -hex 32 生成）
#    INTERNAL_TOKEN= （同上，再生成一串）
#    DB_PASSWORD=  （数据库密码，再生成一串）

# 2. 把 Caddyfile 里的 pmc.example.com 换成你的域名
nano Caddyfile
```

> 暂未买域名：把 `Caddyfile` 第 1~4 行删除（只剩 `{ ... }`），改访问 `http://服务器IP`（无 HTTPS，仅临时演示用）。

## 四、启动

```bash
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps   # 全部 Up / healthy 即成功
```

## 五、访问

- 浏览器打开 `https://你的域名`（首次访问 Caddy 自动申请证书，1~2 分钟内生效）
- 登录账号：**admin / admin123**
- ⚠️ 上线后请立刻改掉默认密码：登录 → 系统设置 → 个人信息修改 / 密码修改

## 六、日常维护

```bash
docker compose -f docker-compose.prod.yml logs -f        # 看日志
docker compose -f docker-compose.prod.yml restart gateway # 重启某个服务
docker compose -f docker-compose.prod.yml down           # 停止（数据保留在卷里）
docker compose -f docker-compose.prod.yml pull           # 拉取最新镜像
docker compose -f docker-compose.prod.yml up -d          # 应用更新
```

数据都在 Docker 卷（`pgdata`）中，`down` 不会丢数据；备份数据库：
```bash
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U pmc pmc > backup.sql
```

## 七、CI/CD 自动部署（可选）

仓库已带 CD 工作流，在 GitHub 仓库 `Settings → Secrets and variables → Actions` 添加：
- `DEPLOY_HOST`：服务器 IP
- `DEPLOY_USER`：SSH 用户名（如 ubuntu）
- `DEPLOY_SSH_KEY`：SSH 私钥内容

之后每次 push 到 `master` 自动 `git pull + compose up` 更新线上环境。
（当前 CD 脚本按 `~/pmc-manager` 路径假设，按需修改 `.github/workflows/cd.yml` 中的部署命令。）
