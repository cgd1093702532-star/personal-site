#!/bin/bash
# 一键推送 main 并触发 GitHub Pages 部署（preview/ → gh-pages）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

USER="cgd1093702532-star"
REPO="personal-site"
PAGES_URL="https://${USER}.github.io/${REPO}/"
CF_PAGES_URL="https://personal-site-1e8.pages.dev/"

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
echo "同步部署 Cloudflare Pages..."
bash "${ROOT}/scripts/deploy-to-cloudflare.sh" || {
  echo "Cloudflare 部署失败（可稍后手动：bash scripts/deploy-to-cloudflare.sh）"
}

echo ""
echo "预览地址："
echo "  - Cloudflare（优先）：${CF_PAGES_URL}"
echo "  - GitHub Pages 备用：${PAGES_URL}"
echo "GitHub Pages：Settings → Pages → Source = gh-pages → / (root)"
