# 通用配置：通过环境变量注入，生产环境务必覆盖默认值
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 服务标识
    service_name: str = "pmc-backend"

    # 安全
    jwt_secret: str = "please-change-this-secret-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    internal_token: str = "internal-pmc-token-change-me"

    # 数据源
    database_url: str = "sqlite:///./pmc.db"

    # 消息队列
    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    rabbitmq_enabled: bool = True

    # 网关
    cors_origins: str = "*"
    rate_limit: str = "120/minute"

    # 服务发现（docker-compose 内部域名）
    auth_service_url: str = "http://auth-service:8001"
    pmc_service_url: str = "http://pmc-service:8002"
    warning_service_url: str = "http://warning-service:8003"
    report_service_url: str = "http://report-service:8004"

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()
