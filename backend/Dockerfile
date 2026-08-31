# PMC 后端镜像（所有微服务共用此镜像，通过 command 选择启动入口）
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# 默认启动网关；其余服务在 docker-compose.yml 中用 command 覆盖
CMD ["uvicorn", "gateway.main:app", "--host", "0.0.0.0", "--port", "8000"]
