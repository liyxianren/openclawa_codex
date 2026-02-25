# Demo（端到端契约回放）

这个 demo 的目的：证明该仓库不只是“方法论”，而是有**可被机器校验**的契约产物（Plan Bundle / latest.json / verify.json），并能回放一个典型失败→修复→通过的流程。

> 注意：这里的 demo **不依赖 OpenClaw 或 Codex**，因为它只做“契约产物回放”。
>
> 如果你想生成“真实 Codex 执行”的 artifacts，请先确保 `codex login` 可用，然后按 `OPENCLAW.md` 的 smoke 去跑一次工作流，或自行用 `codex exec --json --output-schema --output-last-message` 生成执行层产物。

## 运行
```bash
npm ci
npm test
```

你会看到：
- examples/ 与 demo/artifacts/ 下的 **contract JSON（plan/latest/verify）** 都通过 schema 校验
- demo 回放输出：fail → fix → pass

## 真实执行层样例（Codex real smoke）
在 `demo/artifacts/real-smoke/` 里包含一次真实 `codex exec` 运行沉淀的 artifacts（包含事件流 JSONL、最终消息 JSON、以及 latest/verify 合同产物）。

> 注意：事件流里可能包含类似 refresh token 无法刷新但仍可执行的告警；若你要彻底消除，请按 `OPENCLAW.md` / `docs/faq.md` 做 `codex logout/login`。
