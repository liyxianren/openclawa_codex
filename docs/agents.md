# 子 Agent 角色建议

这套架构默认使用 3~4 个子 agent：

- `requirement-agent`（可选但推荐）：把用户自然语言需求抽成结构化约束（目标/范围/非目标/风险）
- `planner-agent`：输出 Plan Bundle（JSON）
- `executor-agent`：执行（调用 Codex CLI，全自动改代码）
- `reviewer-agent`：验证（只跑 run_commands，产出 verify.json，不写业务代码）

## 推荐模型分工（示例）
- planner/reviewer：更偏推理/规划的模型
- executor：更适合编码执行的模型（Codex 类）

> 具体模型/提供方取决于你的 OpenClaw 配置与可用额度。

## 最小权限原则
- reviewer 不应写业务代码
- executor 不应访问敏感目录（credentials/auth/token 文件）
- 所有 agent 在发现“外发/破坏性操作”时应停下并标记需要确认
