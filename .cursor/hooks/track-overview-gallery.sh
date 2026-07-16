#!/usr/bin/env bash
# afterFileEdit：弹框/Toast 相关文件改动时打脏标记；总览真源改动时清除。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
FLAG="$ROOT/.tools/.overview-gallery-dirty"
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

[ -n "$FILE_PATH" ] || exit 0

case "$FILE_PATH" in
  */preview/assets/preview-dialog-gallery.js|*/preview/assets/dialog-gallery/*)
    rm -f "$FLAG"
    exit 0
    ;;
esac

# 可能影响弹框 / Toast 的实现文件
case "$FILE_PATH" in
  */preview/assets/profile-preview.js|\
  */preview/assets/hero-detail-page.js|\
  */preview/assets/hero-share.js|\
  */preview/assets/hero-apply-preview.js|\
  */preview/assets/recruitment-*-preview.js|\
  */preview/assets/course-*-preview.js|\
  */preview/assets/preview-toast.js|\
  */preview/assets/image-viewer.js|\
  */miniprogram/pages/profile/*|\
  */miniprogram/pages/hero-detail/*|\
  */miniprogram/pages/hero-apply/*)
    mkdir -p "$(dirname "$FLAG")"
    echo "$FILE_PATH" >>"$FLAG"
    ;;
esac

exit 0
