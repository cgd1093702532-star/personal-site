#!/usr/bin/env bash
# 启动英雄广场浏览器静态预览
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${1:-8765}"
echo "英雄广场预览：http://127.0.0.1:${PORT}/"
echo "按 Ctrl+C 停止"
cd "$ROOT/preview" && python3 -m http.server "$PORT"
