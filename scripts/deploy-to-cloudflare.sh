#!/bin/bash
# 将 preview/ 部署到 Cloudflare Pages（国内更好访问）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PROJECT="personal-site"
CF_URL="https://personal-site-1e8.pages.dev/"

echo "部署 preview/ → Cloudflare Pages（${PROJECT}）..."
npx --yes wrangler@4 pages deploy preview \
  --project-name="${PROJECT}" \
  --branch=main \
  --commit-dirty=true

echo ""
echo "完成。预览地址："
echo "  总入口：${CF_URL}"
echo "  小程序：${CF_URL}miniprogram/index.html"
echo "  后台：  ${CF_URL}admin/dashboard.html"
