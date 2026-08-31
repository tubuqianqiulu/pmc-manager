# ============================================================
# PMC 管理工作台 - 本地后端一键启动（PyCharm/命令行开发用）
# 说明：使用 conda 环境 pmc，SQLite 数据库 + 关闭 RabbitMQ（纯本地）
# 启动顺序：auth/pmc/warning/report 可同时，最后 gateway
# 用法：powershell -ExecutionPolicy Bypass -File run_dev.ps1
# ============================================================
$ErrorActionPreference = "Stop"

# 定位 conda 环境 python
$py = Get-Command python -ErrorAction SilentlyContinue
$pyPath = "D:\anaconda3\envs\pmc\python.exe"
if (Test-Path $pyPath) { $python = $pyPath } else { $python = "python" }
$root = $PSScriptRoot

Write-Host "使用 Python: $python" -ForegroundColor Cyan

# 本地开发环境变量
$env:RABBITMQ_ENABLED = "false"                 # 关闭 RabbitMQ（纯本地）
$env:AUTH_SERVICE_URL   = "http://127.0.0.1:8001"
$env:PMC_SERVICE_URL    = "http://127.0.0.1:8002"
$env:WARNING_SERVICE_URL = "http://127.0.0.1:8003"
$env:REPORT_SERVICE_URL  = "http://127.0.0.1:8004"
# 数据库默认 SQLite（sqlite:///./pmc.db，已 gitignore）；如需 Postgres 取消下行注释
# $env:DATABASE_URL = "postgresql+psycopg2://pmc:pmc_pass@127.0.0.1:5432/pmc"

$services = @(
  @{ name = "auth";    port = "8001"; mod = "services.auth.main:app" },
  @{ name = "pmc";     port = "8002"; mod = "services.pmc.main:app" },
  @{ name = "warning"; port = "8003"; mod = "services.warning.main:app" },
  @{ name = "report";  port = "8004"; mod = "services.report.main:app" },
  @{ name = "gateway"; port = "8000"; mod = "gateway.main:app" }
)

foreach ($s in $services) {
  $out = Join-Path $root "run_$($s.name).log"
  $err = Join-Path $root "run_$($s.name)_err.log"
  Start-Process -FilePath $python -ArgumentList @("-m","uvicorn",$s.mod,"--host","127.0.0.1","--port",$s.port) `
    -WorkingDirectory $root -RedirectStandardOutput $out -RedirectStandardError $err -WindowStyle Hidden
  Write-Host "已启动 $($s.name)  ->  http://127.0.0.1:$($s.port)  (日志: $out)" -ForegroundColor Green
}

Start-Sleep -Seconds 6
Write-Host ""
Write-Host "后端已全部启动。网关入口: http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "日志文件在当前目录 run_*.log，如需停止：Get-Process python | Stop-Process" -ForegroundColor Yellow
