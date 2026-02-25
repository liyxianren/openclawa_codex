# Roadmap

目标：把仓库从“早期模板”推进到“开箱即用的 Dev Agent Pipeline 工具箱”。

## P0（已完成）
- JSON Schema（plan/latest/verify）
- 本地校验脚本（`npm test`）
- Demo 契约回放（fail → fix → pass）
- GitHub Actions CI（契约校验 + 链接检查）

## P1（下一步最能涨星的）
- 提供一个 **CLI**（例如 `npx openclawa-devwf validate <file>` / `replay <dir>`）
- 提供“真实 OpenClaw 跑通”的录屏/日志（成功一次 + 失败修复一次）
- 补齐 `latest.json` 的字段约束与更严格的 schema（并保持向后兼容）

## P2（工程化与生态）
- 把 Plan/Verify 契约升级成可复用的 TypeScript types + schema 同源生成
- 增加更多项目类型的 `run_commands` 模板（Python/Node/Go）
- 增加“安全门禁”：外发/破坏性命令识别（静态规则）
