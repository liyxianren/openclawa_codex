# OPENCLAW Import Guide（把本仓库能力引入你的 OpenClaw）

> 目标：你只需要把仓库地址发给你的 OpenClaw，它读完本文件后，就能把 **dev-workflow v3（Plan → Run → Verify → Fix）** 安装到你的 OpenClaw workspace，并具备可用的“Codex 辅助编程范式”。

## 给 OpenClaw 的一句话（推荐直接复制）
把下面这段发给你的 OpenClaw：

> 请阅读并执行：https://github.com/liyxianren/openclawa_codex/blob/main/OPENCLAW.md
> 
> 目标：把 dev-workflow v3 安装到我的 OpenClaw，并给我一个 smoke 用法示例。注意不要做任何对外发布/上传/删库删文件等操作；如需外部副作用请先问我确认。

---

## 安装步骤（OpenClaw 需要在本机执行）

### 0) Preflight（安全门禁）
- **禁止**触碰敏感目录：`~/.openclaw/credentials/`、`~/.openclaw/**/auth*.json`
- 本次操作只允许：clone 仓库、复制 skill 文件到 `~/.openclaw/workspace/skills/`
- 任何“对外发送/发布/上传/删除”动作一律先停下问确认

### 1) Clone 本仓库
```bash
mkdir -p ~/.openclaw/workspace/repos
cd ~/.openclaw/workspace/repos

# 如果已存在，先 git pull；否则 clone
if [ -d openclawa_codex/.git ]; then
  cd openclawa_codex && git pull
else
  git clone https://github.com/liyxianren/openclawa_codex.git
  cd openclawa_codex
fi
```

### 2) 检查 Codex CLI 可用（执行层依赖）
```bash
codex --version
# 如未登录：
# codex login
```

> 说明：本项目执行层使用的是 **Codex CLI（codex exec）** 来落地改代码。

### 3) 安装 dev-workflow skill 到 OpenClaw workspace
```bash
mkdir -p ~/.openclaw/workspace/skills

# 覆盖式同步（只同步这个 skill）
rm -rf ~/.openclaw/workspace/skills/dev-workflow
cp -R ./skills/dev-workflow ~/.openclaw/workspace/skills/dev-workflow
```

> 如果你的 OpenClaw 需要重启 gateway 才能识别新增 skill：
```bash
openclaw gateway restart
```

### 3)（强烈推荐）在 AGENTS.md 加“辅助编程”强制路由
把本仓库的这段规则追加到你的：
- `~/.openclaw/workspace/AGENTS.md`

规则内容见：
- `snippets/AGENTS-routing.md`

这样当用户说“辅助编程/辅助开发/帮我开发…”时，会固定进入 dev-workflow 工作流。

### 4)（可选但强烈推荐）确保 workspace 根目录有 CHECKLIST.md
本仓库提供了 checklist 文档：`docs/preflight-checklist.md`。

你可以把它保存为：`~/.openclaw/workspace/CHECKLIST.md`，并让所有写文件/执行命令前先过一遍，降低误操作风险。

### 4) 子 agent 准备（最小要求）
dev-workflow v3 默认会调用这些子 agent（如果你的环境里 agentId 不同，需要你把 skill 里的 agentId 对齐）：
- `planner-agent`：产出 Plan Bundle（JSON）
- `executor-agent`：调用 Codex CLI 执行改动
- `reviewer-agent`：执行 run_commands 做验证，产出 verify.json
- （可选）`requirement-agent`

推荐原则：
- executor 用更擅长编码执行的模型
- planner/reviewer 用更擅长规划/验证的模型

### 5) Smoke（验证已安装并可触发）
在你的 OpenClaw 主会话里发送：

- `辅助开发：帮我在 /tmp/devwf-smoke 创建一个 README.md，写一句话介绍这个目录，并给出验证命令。`

期望看到：
- planner 输出 `BEGIN_PLAN_BUNDLE_JSON ... END_PLAN_BUNDLE_JSON`
- executor 运行 Codex 并产出 `latest.json`
- reviewer 跑命令并产出 `verify.json`

---

## 你安装的是什么
- 这是一个 **OpenClaw + Codex 的辅助编程范式/编排规范**：Plan → Run → Verify → Fix
- 核心价值是“契约化中间产物”（plan/latest/verify JSON），让执行可审计、可复现

文档入口：
- 架构说明：`docs/architecture.md`
- 契约说明：`docs/contract-spec.md`
- dev-workflow 规范：`skills/dev-workflow/SKILL.md`
