#!/bin/bash
# 确保预览服务在 5500 端口运行，就绪后退出
cd "$(dirname "$0")/.."
PORT=5500
URL="http://127.0.0.1:${PORT}/"

if ! lsof -ti :"$PORT" >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 &
fi

for _ in $(seq 1 30); do
  if curl -sf "$URL" >/dev/null 2>&1; then
    echo "Preview server ready: $URL"
    exit 0
  fi
  sleep 0.2
done

echo "Failed to start preview server on port $PORT" >&2
exit 1
