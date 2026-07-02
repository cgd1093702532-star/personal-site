#!/bin/bash
# 固定端口 5500，供编辑器中间面板预览
cd "$(dirname "$0")/.."
PORT=5500

if lsof -ti :"$PORT" >/dev/null 2>&1; then
  exit 0
fi

python3 -m http.server "$PORT" --bind 127.0.0.1
