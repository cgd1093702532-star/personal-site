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
git push -u origin main

echo ""
echo "GitHub Actions 将把 preview/ 部署到 gh-pages 分支。"
echo "Pages 地址：${PAGES_URL}"
echo "离线演示：${PAGES_URL}英雄广场-离线演示.html"
echo ""
echo "请在 GitHub 仓库 Settings → Pages 中确认 Source 为 Deploy from branch → gh-pages → / (root)"
