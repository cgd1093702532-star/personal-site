# 资料变更待审：修改资料回填最新提交

> 日期：2026-07-13 · 状态：已确认（A + 方案 1）

## 目标

已认证英雄再次「修改资料」并提交后，在审核通过前：

- **修改资料表单**显示最新一次待审提交内容
- **对外 / 正式 `heroes`** 仍为上一版已通过数据，仅审核通过后更新

## 规则

1. 同一英雄最多一条 `profile_change_requests.status=pending`
2. 再次提交时 **覆盖** 该 pending 的 `after`（并刷新 `before`、`submitted_at`），不新增多条
3. 编辑模式回填：有 pending → `hero` ∪ `after`；无 pending → 已通过 `hero`
4. 个人中心「修改资料」角标：有 pending 显示「审核中」

## 改动

| 层 | 内容 |
|----|------|
| `server/db.py` | upsert pending；`get_pending_profile_change`；apply status 返回 `pending_profile_change` |
| 预览 / 小程序 | `mode=edit` 优先用 `pending_profile_change.after` 回填 |
| 文档 | 申请成为英雄 / 我的英雄资料 |

## 非目标

- 不在广场、英雄详情等对外页展示待审内容
- 不改后台审核通过写库逻辑（仍 `update_hero(after)`）
