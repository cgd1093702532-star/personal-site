#!/usr/bin/env bash
# 同时启动本地数据库 API + 浏览器预览
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PREVIEW_PORT="${1:-8765}"
DB_PORT="${2:-8787}"

if [ ! -f "$ROOT/data/seed.json" ]; then
  python3 "$ROOT/scripts/generate-seed.py"
fi

echo "同步需求文档到预览…"
python3 "$ROOT/preview/build-pages.py" || exit 1
python3 "$ROOT/scripts/check-docs-preview-sync.py" || exit 1
python3 "$ROOT/scripts/check-preview-page-nav.py" || exit 1

bash "$ROOT/scripts/start-local-db.sh" "$DB_PORT" &
DB_PID=$!

sleep 0.5
echo ""
echo "预览页面：http://127.0.0.1:${PREVIEW_PORT}/"
echo "本地 API：http://127.0.0.1:${DB_PORT}/api/health"
echo "按 Ctrl+C 停止全部服务"
cd "$ROOT/preview" && python3 -m http.server "$PREVIEW_PORT" &
PREVIEW_PID=$!

trap 'kill $DB_PID $PREVIEW_PID 2>/dev/null; exit' INT TERM
wait
