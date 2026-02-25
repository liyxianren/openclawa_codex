# 架构设计（OpenClawA Codex Dev Workflow）

这套“辅助开发”能力把一次开发请求拆成 3 个独立阶段，并通过**明确的契约产物**把阶段之间解耦：

- **Plan**：产出 Plan Bundle（JSON）——“要做什么 + 完成标准 + 怎么验收”
- **Run**：调用 Codex 全自动改代码，并落盘 latest.json
- **Verify**：严格按 run_commands 验收并产出 verify.json
- **Fix（可选）**：Verify 失败且属于 test_fail 时，最多触发 1 次最小补丁修复

## 目标
- 把“写代码”从主对话线程挪走（异步子 agent）
- 让执行可验证、可复现、可审计
- 限制自动修复次数，避免无限循环/成本失控

## 关键产物（Contract）
- Plan Bundle JSON（从 planner-agent 返回）
- Runner `latest.json`（落盘到 `<workdir>/.openclaw-runs/<run_id>/latest.json`）
- Verifier `verify.json`（落盘到 `<workdir>/.openclaw-runs/<run_id>/verify.json`）

## Mermaid 流程图
```mermaid
flowchart TD
  U[User request] --> A[Main agent ACK]
  A --> P[planner-agent: Plan Bundle]
  P --> R[executor-agent: Codex Run]
  R --> V[reviewer-agent: Verify]
  V -->|pass| DONE[Report back]
  V -->|fail_kind=test_fail & retry=0| FP[planner-agent: Fix prompt]
  FP --> R2[executor-agent: Run minimal patch]
  R2 --> V2[reviewer-agent: Verify again]
  V2 -->|pass| DONE
  V2 -->|fail| HUMAN[Stop + ask human]
  V -->|fail_kind=infra_or_auth_blocked| HUMAN
```

## 设计取舍
- 不做 `git reset` 语义的回滚：而是“失败证据驱动的最小修复”
- 自动修复最多 1 次：保证成本/风险上界
- Verify 只跑命令、不写业务代码：防止“验收 agent 越权改代码”
