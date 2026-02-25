# FAQ

## Q: 这是不是一个可以直接运行的应用？
不是。它是一个 **OpenClaw 的 Codex 辅助编程范式**：Plan → Run → Verify → Fix。

## Q: 为什么要搞 verify.json 这种“契约产物”？
因为否则失败只能靠“复述错误”，无法复现。
`verify.json` 让失败变成结构化证据（命令、exit_code、stdout/stderr tail），从而驱动最小修复。

## Q: 执行层到底用什么在改代码？
用 **Codex CLI**（例如 `codex exec --full-auto ...`），由 `executor-agent` 通过 OpenClaw 的 `exec` 工具（必须 PTY）去调用。
详见：`docs/execution-layer.md`。

## Q: 我只有一个主 agent，也能用吗？
可以，但体验会差一些。
这套范式推荐用子 agent 把 Plan/Run/Verify 隔离，减少上下文污染，并提升可审计性。
