## 🎯 辅助编程 / 辅助开发 路由规则（建议加入你的 ~/.openclaw/workspace/AGENTS.md）

当用户输入包含以下关键词时，固定走 **dev-workflow v3**（Plan → Run → Verify → Fix）：
- 辅助编程
- 辅助开发
- 帮我开发
- 帮我做一个
- 做一个xxx工具

### 路由策略
- 识别到关键词 → **必须调用 `dev-workflow` skill 作为统一入口**
- 默认用子 agent 异步执行（planner → executor → reviewer）
- 若涉及外发/上传/删库删文件等外部副作用：必须先明确确认

### 禁止事项
- 不要绕过 `dev-workflow` 直接让 executor 改代码
- 不要在未确认的情况下执行破坏性/对外操作
