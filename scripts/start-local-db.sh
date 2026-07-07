#!/usr/bin/env bash
# 启动本地 SQLite API
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8787}"

if [ ! -f "$ROOT/data/seed.json" ]; then
  echo "生成种子数据..."
  python3 "$ROOT/scripts/generate-seed.py"
fi

echo "英雄广场本地数据库 API：http://127.0.0.1:${PORT}/api/health"
echo "数据库文件：$ROOT/data/local.db"
echo "按 Ctrl+C 停止"
python3 "$ROOT/server/local_api.py" "$PORT"
