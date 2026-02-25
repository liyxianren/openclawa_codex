# 执行层（Executor）到底怎么跑？

本项目的核心观点：**把“写代码”从对话里剥离出来**，交给一个“执行层”去做，并且让它产出可审计的中间产物。

在 dev-workflow v3 里，执行层由 `executor-agent` 负责，它不是“手写 patch”，而是**在指定 workdir 里调用 Codex CLI 自动改代码**。

## 1) 执行层的最小执行闭环
Executor 必须做到 4 件事：

1. **定位工作目录**：确保 `workdir` 存在且可写
2. **保证是 Git repo**：`git init`（Codex CLI 默认要求在 Git 仓库内运行）
3. **通过 OpenClaw 的 exec 工具执行命令（必须 PTY）**
4. **落盘产物**：写 `task-output.txt` + `latest.json`（并把路径回传给主代理）

## 2) Executor 实际会执行的命令是什么
最典型的命令（当前 v3 规范）：

```bash
cd <workdir>
# 由 OpenClaw exec(pty:true) 执行：
codex exec --full-auto "<codex_prompt>"
```

说明：
- `--full-auto` 是 Codex CLI 的便捷模式（低摩擦自动执行，且有 sandbox 策略）
- `codex_prompt` 由 Planner 生成，必须包含：要改哪些文件、DoD、验收命令（run_commands）

你可以用 `codex exec --help` 查看更多选项，例如：
- `-C/--cd <DIR>` 指定工作目录
- `--json` 输出 JSONL 事件流（更利于沉淀日志）
- `--output-schema <FILE>` 约束最终输出形状（后续可用于强化契约）

## 3) 为什么强调 PTY
Codex CLI 是交互式终端应用，缺 PTY 容易输出异常或卡住。

因此在 OpenClaw 里，Executor 必须使用：
- `exec` 工具 + `pty:true`

## 4) 这和 OpenClaw 的 openai-codex 模型是什么关系
两层概念：
- **OpenClaw 里的模型 provider（openai-codex/…）**：决定 planner/reviewer/executor-agent 的“对话推理模型”
- **Codex CLI（codex exec …）**：真正“落地改代码”的执行器（会读取 `~/.codex/config.toml`，可能需要 `codex login`）

本项目的执行层依赖的是 **Codex CLI**。

## 5) 建议的可观测产物（Artifacts）
- `<workdir>/.openclaw-runs/<run_id>/task-output.txt`
- `<workdir>/.openclaw-runs/<run_id>/latest.json`

Verifier 会额外生成：
- `<workdir>/.openclaw-runs/<run_id>/verify.json`
- `<workdir>/.openclaw-runs/<run_id>/verify-report.txt`
