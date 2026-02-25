# OpenClawA Codex Dev Workflow (dev-workflow v3)

一套可落地的“辅助开发”工作流：把一次开发需求编排为 **Plan → Run(Codex) → Verify →（最多一次 Fix）**，并通过 JSON 契约产物实现可复现、可验收、可审计。

## 你会得到什么
- **Plan Bundle（JSON）**：明确“做什么 + 完成标准 + 怎么验证”
- **Runner latest.json**：记录执行摘要与产物路径
- **Verifier verify.json**：记录逐条验收命令的 exit code 与输出尾部
- **最多一次自动修复**：只在 `fail_kind=test_fail` 时触发，避免无限循环

## 快速开始
### 0) 前置条件
- 已安装 OpenClaw
- 本机可用 `codex` CLI（能运行 `codex exec --full-auto ...`）
- 你已配置好 `planner-agent / executor-agent / reviewer-agent`（以及可选的 `requirement-agent`）

### 1) 安装 skill
把本仓库的 `skills/dev-workflow/` 复制到你的：

- `~/.openclaw/workspace/skills/dev-workflow/`

然后确保 OpenClaw 能加载到该 skill。

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
- 示例 JSON：`examples/*.json`

## 仓库结构
```
.
├─ skills/
│  └─ dev-workflow/
│     └─ SKILL.md
├─ docs/
├─ examples/
├─ LICENSE
└─ README.md
```

## License
MIT
