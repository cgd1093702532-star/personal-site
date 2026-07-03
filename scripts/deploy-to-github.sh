#!/bin/bash
# 一键部署到 GitHub Pages（需先完成 gh auth login）
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

GH="${GH_BIN:-gh}"
USER="cgd1093702532-star"
REPO="personal-site"
PAGES_URL="https://${USER}.github.io/${REPO}/"

if ! command -v "$GH" >/dev/null 2>&1; then
  echo "未找到 gh 命令。请先安装 GitHub CLI 或设置 GH_BIN 环境变量。" >&2
  exit 1
fi

if ! "$GH" auth status >/dev/null 2>&1; then
  echo "尚未登录 GitHub。请先运行：" >&2
  echo "  $GH auth login --hostname github.com --git-protocol https --web --scopes repo,workflow" >&2
  exit 1
fi

if ! "$GH" repo view "${USER}/${REPO}" >/dev/null 2>&1; then
  echo "创建仓库 ${USER}/${REPO} ..."
  "$GH" repo create "$REPO" --public --source=. --remote=origin --description "扶摇个人站"
else
  echo "仓库已存在，推送代码 ..."
  git remote get-url origin >/dev/null 2>&1 || \
    git remote add origin "https://github.com/${USER}/${REPO}.git"
fi

git push -u origin main

echo ""
echo "启用 GitHub Pages（GitHub Actions）..."
"$GH" api "repos/${USER}/${REPO}/pages" -X POST \
  -f build_type=workflow >/dev/null 2>&1 || true

echo ""
echo "✅ 部署已触发"
echo "🔗 站点地址：${PAGES_URL}"
echo "📦 仓库地址：https://github.com/${USER}/${REPO}"
echo ""
echo "首次发布通常需要 1~3 分钟。可在 Actions 页查看进度："
echo "https://github.com/${USER}/${REPO}/actions"
