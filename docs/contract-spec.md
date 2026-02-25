# Contract Spec（契约说明）

本仓库的核心不是“跑一个应用”，而是定义一组**可验证的中间产物**，用来把多 agent 的 Plan/Run/Verify 解耦。

## 1) Plan Bundle
- Schema：`schemas/plan-bundle.schema.json`
- 示例：`examples/plan-bundle.example.json`

关键字段：
- `task_name`：任务名
- `workdir`：执行目录（绝对路径）
- `codex_prompt`：交给 Codex 的完整指令
- `acceptance[]`：可核验的验收条目
- `run_commands[]`：验收命令序列（必须可执行；建议以 `cd workdir` 开头）

## 2) Runner latest.json
- Schema：`schemas/latest.schema.json`
- 示例：`examples/latest.example.json`

用途：记录 Runner 阶段执行摘要、日志尾部与产物路径。

推荐把执行层做成“可审计/可回放”：
- `artifacts.run_dir`
- `artifacts.codex_events_jsonl_path`（Codex JSONL 事件流）
- `artifacts.codex_last_message_path`（Codex 最终消息，建议为严格 JSON）
- `artifacts.codex_output_schema_path`（最终消息的 schema）

## 3) Verifier verify.json
- Schema：`schemas/verify.schema.json`

关键字段：
- `verify_status`：`pass|fail`
- `fail_kind`：失败分类（`test_fail` / `infra_or_auth_blocked`）
- `commands[]`：逐条命令的 `exit_code` + 输出尾部（用于复现/定位）

> 约束：当 `verify_status=fail` 时，必须提供 `fail_kind` 与 `fail_summary`。
