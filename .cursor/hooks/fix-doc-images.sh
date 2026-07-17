#!/usr/bin/env bash
# afterFileEdit：改动需求文档 md 后自动恢复丢失的 ![alt](src) 配图语法。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INPUT="$(cat || true)"

FILE_PATH="$(
  python3 -c '
import json, sys
try:
    data = json.loads(sys.stdin.read() or "{}")
except Exception:
    data = {}
print(data.get("file_path") or "")
' <<<"$INPUT"
)"

case "$FILE_PATH" in
  *"/docs/miniprogram/pages/"*.md|*"/docs/miniprogram/pages/images/IMAGE_REGISTRY.json")
    ;;
  *)
    exit 0
    ;;
esac

cd "$ROOT"
# 先修粘连/纯文字 alt，再写预览兜底映射；表格序号换行铁律一并修复；失败不阻断编辑（exit 0）
python3 scripts/check-doc-images.py --fix --write-preview-map >/dev/null 2>&1 || true
python3 scripts/check-doc-table-linebreaks.py --fix >/dev/null 2>&1 || true
exit 0
