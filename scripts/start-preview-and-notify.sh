#!/bin/bash
# 启动预览服务 + 复制链接到剪贴板 + 提示
cd "$(dirname "$0")/.."
URL="http://127.0.0.1:5500/"

bash scripts/ensure-preview-server.sh || {
  osascript -e 'display alert "预览服务启动失败" message "请确认已安装 Python3。"'
  exit 1
}

echo -n "$URL" | pbcopy

osascript <<EOF
display notification "链接已复制！粘贴到中间 Browser Tab 地址栏，然后回车" with title "预览服务已启动 ✓" subtitle "$URL"
EOF

echo ""
echo "✅ 预览服务已运行"
echo "🔗 $URL"
echo "📋 链接已复制到剪贴板"
echo ""
echo "→ 在中间 Browser Tab 顶部地址栏粘贴链接，回车"
echo ""

# 若 Browser Tab 没反应，同时在系统浏览器打开一份备用
open "$URL" 2>/dev/null || true
