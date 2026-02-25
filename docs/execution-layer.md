# 执行层（Executor）到底怎么跑？

本项目的核心观点：**把“写代码”从对话里剥离出来**，交给一个“执行层”去做，并且让它产出可审计的中间产物。

在 dev-workflow v3 里，执行层由 `executor-agent` 负责，它不是“手写 patch”，而是**在指定 workdir 里调用 Codex CLI 自动改代码**。

## 1) 执行层的最小执行闭环
Executor 必须做到 4 件事：

1. **定位工作目录**：确保 `workdir` 存在且可写
2. **保证是 Git repo**：`git init`（Codex CLI 默认要求在 Git 仓库内运行）
3. **通过 OpenClaw 的 exec 工具执行命令（必须 PTY）**
4. **落盘产物**：除了 `latest.json`，还应沉淀 Codex 的事件流与最终输出，形成可审计、可回放的 artifacts（见第 5 节）。

## 2) Executor 实际会执行的命令是什么
最典型的命令（当前 v3 规范）：

```bash
# 由 OpenClaw exec(pty:true) 执行：
# 关键点：把 prompt 写入文件，避免 shell 转义问题；把事件流与最终消息落盘。
WORKDIR=<workdir>
RUN_DIR="$WORKDIR/.openclaw-runs/<run_id>"

codex exec --full-auto -C "$WORKDIR" \
  --output-schema "$RUN_DIR/codex-output.schema.json" \
  --output-last-message "$RUN_DIR/codex-last-message.json" \
  --json - < "$RUN_DIR/codex-prompt.txt" > "$RUN_DIR/codex-events.jsonl"
```

说明：
- `--full-auto`：低摩擦自动执行（仍有 sandbox 策略）
- `--json`：输出 JSONL 事件流（建议重定向到 `codex-events.jsonl`）
- `--output-last-message`：把 Codex 的最终消息写入文件（建议强制为 JSON）
- `--output-schema`：给最终消息加一层 JSON Schema 约束，显著降低“不可解析输出”概率
- `codex_prompt` 由 Planner 生成，建议同时要求：DoD + 验收命令（run_commands）

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
执行层（Runner）建议至少沉淀：
- `<workdir>/.openclaw-runs/<run_id>/latest.json`
- `<workdir>/.openclaw-runs/<run_id>/task-output.txt`
- `<workdir>/.openclaw-runs/<run_id>/codex-prompt.txt`
- `<workdir>/.openclaw-runs/<run_id>/codex-events.jsonl`（`codex exec --json` 输出）
- `<workdir>/.openclaw-runs/<run_id>/codex-last-message.json`（`--output-last-message` 输出）
- `<workdir>/.openclaw-runs/<run_id>/codex-output.schema.json`（`--output-schema` 使用）

验证层（Verifier）会额外生成：
- `<workdir>/.openclaw-runs/<run_id>/verify.json`
- `<workdir>/.openclaw-runs/<run_id>/verify-report.txt`
