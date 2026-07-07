#!/bin/bash
# 一键推送 main 并触发 GitHub Pages 部署（preview/ → gh-pages）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

USER="cgd1093702532-star"
REPO="personal-site"
PAGES_URL="https://${USER}.github.io/${REPO}/"

git remote get-url origin >/dev/null 2>&1 || \
  git remote add origin "https://github.com/${USER}/${REPO}.git"

echo "推送 main 分支..."
if git rev-parse origin/main >/dev/null 2>&1 && ! git merge-base --is-ancestor origin/main main 2>/dev/null; then
  echo "检测到本地与远程 main 无共同历史（将用英雄广场覆盖旧 personal-site）。"
  echo "执行：git push -u origin main --force-with-lease"
  git push -u origin main --force-with-lease
else
  git push -u origin main
fi

echo ""
echo "GitHub Actions 将把 preview/ 部署到 gh-pages 分支。"
echo "Pages 地址：${PAGES_URL}"
echo ""
echo "请在 GitHub 仓库 Settings → Pages 中确认 Source 为 Deploy from branch → gh-pages → / (root)"
