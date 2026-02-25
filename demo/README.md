# Demo（端到端契约回放）

这个 demo 的目的：证明该仓库不只是“方法论”，而是有**可被机器校验**的契约产物（Plan Bundle / latest.json / verify.json），并能回放一个典型失败→修复→通过的流程。

> 注意：这里的 demo **不依赖 OpenClaw 或 Codex**，因为它只做“契约产物回放”。

## 运行
```bash
npm ci
npm test
```

你会看到：
- examples/ 与 demo/artifacts/ 下的 JSON 都通过 schema 校验
- demo 回放输出：fail → fix → pass
