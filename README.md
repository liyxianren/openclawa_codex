# OpenClawA Codex Dev Workflow (dev-workflow v3)

[![CI](https://github.com/liyxianren/openclawa_codex/actions/workflows/ci.yml/badge.svg)](https://github.com/liyxianren/openclawa_codex/actions/workflows/ci.yml)

**Contract-first** 的“辅助开发”流水线规范：把一次开发需求编排为 **Plan → Run(Codex) → Verify →（最多一次 Fix）**，并通过可校验的 JSON 契约产物实现**可复现、可验收、可审计**。

> 这不是“可直接运行的应用”，而是你在 OpenClaw 里搭建 Dev Agent Pipeline 的一套最小、可落地的架构与契约。

## ⭐ 你会得到什么
- **Plan Bundle（JSON）**：明确“做什么 + 完成标准 + 怎么验证（run_commands）”
- **Runner latest.json**：记录执行摘要与产物路径
- **Verifier verify.json**：记录逐条验收命令的 exit code 与 stdout/stderr tail
- **风险约束**：最多一次自动修复；区分 `test_fail` / `infra_or_auth_blocked`；强调敏感目录与外发确认

## ✅ 先跑起来（不依赖 OpenClaw）
这个仓库包含 **JSON Schema + 本地校验脚本 + demo 契约回放**，可以先在任何机器上跑通：

```bash
npm ci
npm test
```

它会做两件事：
1) 校验 `examples/` 与 `demo/artifacts/` 下所有契约 JSON
2) 回放一个典型流程：fail → fix → pass（不执行真实 Codex，仅回放产物）

## 在 OpenClaw 里使用（需要你已安装 OpenClaw）
### 1) 安装 skill
把本仓库的 `skills/dev-workflow/` 复制到你的：

- `~/.openclaw/workspace/skills/dev-workflow/`

然后确保 OpenClaw 能加载该 skill。

### 2) 使用
在主会话里直接提需求（例如“帮我开发一个xxx”），让编排触发：

- Plan（planner-agent 输出 Plan Bundle JSON）
- Run（executor-agent 调 Codex 自动实现）
- Verify（reviewer-agent 跑 run_commands 验收）
- Fix（可选，最多一次最小补丁修复）

## 文档
- 架构：`docs/architecture.md`
- 子 agent 角色：`docs/agents.md`
- Preflight checklist：`docs/preflight-checklist.md`
- Demo：`demo/README.md`
- 示例 JSON：`examples/*.json`
- JSON Schema：`schemas/*.schema.json`
- 契约说明：`docs/contract-spec.md`
- Roadmap：`docs/roadmap.md`

## CI
GitHub Actions 会自动跑：
- `npm test`（契约校验 + demo 回放）
- Markdown 链接检查（lychee）

## 仓库结构
```
.
├─ skills/
│  └─ dev-workflow/
│     └─ SKILL.md
├─ schemas/
├─ scripts/
├─ demo/
├─ docs/
├─ examples/
└─ .github/workflows/ci.yml
```

## License
MIT
