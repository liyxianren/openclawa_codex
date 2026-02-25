# OpenClawA Codex Dev Workflow (dev-workflow v3)

[![CI](https://github.com/liyxianren/openclawa_codex/actions/workflows/ci.yml/badge.svg)](https://github.com/liyxianren/openclawa_codex/actions/workflows/ci.yml)

**Contract-first** 的“辅助开发”流水线规范：把一次开发需求编排为 **Plan → Run(Codex) → Verify →（最多一次 Fix）**，并通过可校验的 JSON 契约产物实现**可复现、可验收、可审计**。

> 这不是“可直接运行的应用”，而是你在 OpenClaw 里搭建 Dev Agent Pipeline 的一套最小、可落地的架构与契约。

## ⭐ 你会得到什么
- **Plan Bundle（JSON）**：明确“做什么 + 完成标准 + 怎么验证（run_commands）”
- **Runner latest.json**：记录执行摘要与产物路径
- **Verifier verify.json**：记录逐条验收命令的 exit code 与 stdout/stderr tail
- **风险约束**：最多一次自动修复；区分 `test_fail` / `infra_or_auth_blocked`；强调敏感目录与外发确认

## 🧩 架构图（Plan → Run → Verify → Fix）
```mermaid
flowchart TD
  U[用户需求] --> A[主代理编排]

  A --> P[规划代理 产出 PlanBundle]
  P --> R[执行代理 调用 Codex]
  R --> L[产出 latestjson]

  R --> V[验证代理 执行验收命令]
  V --> Z[产出 verifyjson]

  Z --> OK[通过]
  OK --> DONE[回传结果]

  Z --> BAD[失败]
  BAD --> TF[测试失败]
  TF --> FP[生成最小修复提示]
  FP --> R2[执行最小补丁]
  R2 --> V2[再次验证]
  V2 --> DONE2[回传结果]

  BAD --> IA[环境或鉴权阻塞]
  IA --> HUMAN[人工介入]
```

## 🔧 执行层（Executor）怎么执行
一句话：**executor-agent 会在 workdir 里通过 OpenClaw exec（必须 PTY）调用 Codex CLI**。

典型命令形态：
```bash
cd <workdir>
codex exec --full-auto "<codex_prompt>"
```

更详细的执行层说明见：`docs/execution-layer.md`（包含为什么需要 Git repo、为什么必须 PTY、以及与 OpenClaw openai-codex 模型的区别）。

## 📦 契约产物（Contract Artifacts）
- Plan 阶段：`Plan Bundle JSON`
- Run 阶段：`latest.json`
- Verify 阶段：`verify.json`

这些产物让流程**可复现/可审计**：失败时不靠“复述”，而是直接拿 `verify.json` 的失败证据驱动最小修复。

## 在 OpenClaw 里使用（推荐入口）
这套框架的定位是：**服务 OpenClaw 的 Codex 辅助编程范式**。

你可以把仓库地址发给你的 OpenClaw，让它按 `OPENCLAW.md` 自动安装：
- 导入指南：`OPENCLAW.md`

### 手动安装（可选）
把本仓库的 `skills/dev-workflow/` 复制到你的：
- `~/.openclaw/workspace/skills/dev-workflow/`

然后确保 OpenClaw 能加载该 skill。

## 维护者工具（可选）
仓库内包含 JSON Schema + 本地校验脚本 + demo 契约回放，用于维护质量与 CI：

```bash
npm install
npm test
```

它会：
1) 校验 `examples/` 与 `demo/artifacts/` 下所有契约 JSON
2) 回放一个典型流程：fail → fix → pass（不执行真实 Codex，仅回放产物）

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
- OpenClaw 导入指南：`OPENCLAW.md`
- 路由规范：`docs/routing.md`
- 执行层细节：`docs/execution-layer.md`
- FAQ：`docs/faq.md`

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
