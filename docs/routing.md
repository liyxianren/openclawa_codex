# 路由规范（OpenClaw 内）

本仓库的 dev-workflow 是一个 **OpenClaw + Codex 的辅助编程范式**。

为了让用户体验“像产品一样稳定”，建议在你的 OpenClaw workspace 级规则里加一条**强制路由**：

- 用户说“辅助编程/辅助开发/帮我开发…” → 固定走 `dev-workflow`

这样你不会出现“有时走编排、有时直接改代码”的不一致行为。

## 推荐做法
把 `snippets/AGENTS-routing.md` 的内容复制到你的：
- `~/.openclaw/workspace/AGENTS.md`

并放在“路由规则 / 工作流规则”区域。

## 为什么要放在 AGENTS.md
- 它是 workspace 的最高层工作习惯/框架约束
- 能约束主 agent 的日常行为（避免临时发挥）
- 对外部贡献者也更透明：看到规则就知道“怎么触发工作流”
