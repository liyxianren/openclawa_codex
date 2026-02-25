---
name: dev-workflow
description: 异步规划 + Codex 自动执行 + 自动验证（Plan→Run→Verify→Fix）
---

# dev-workflow — 异步规划 + Codex 自动执行 + 自动验证（v3）

## 1) Purpose
将“辅助开发/帮我开发xxx”类需求编排为：
**Plan(子agent) → Run(子agent+Codex) → Verify(子agent跑测试) →（失败则最多 1 次自动修复）→ 回传同入口会话**。

> 这里的“回滚”按这个项目的定义：不是 git reset，而是**把验证失败的问题带回主流程再跑一轮最小修复**（最多一次，仍失败则人工介入）。

## 2) Routing rules
触发：用户说（包含但不限于）：
- 帮我开发一个xxx / 做一个xxx应用 / 开发一个xxx工具 / 辅助开发xxx / 帮我做一个xxx

不适用（需转人工确认后再继续）：
- 明确涉及对外发送/发布/上传、改权限、删库/删文件等外部或破坏性操作

## 3) Inputs
- 用户原始需求文本（必需）
- 可选：`workdir`（用户指定项目目录；未提供则由 Plan agent 选择一个新目录）

## Tech defaults（经验规则）
当需求是“本地 web 页面 / 运维看板 / 管理后台（CRUD + 状态展示）”且未指定技术栈时：
- **优先：SQLite + Flask + 原生 HTML/CSS/JS（Jinja2 模板）**
  - 原因：Python 标准库自带 `sqlite3`，少依赖、少构建成本、适合快速落地。
- **默认中文站点**：除非用户明确要求英文，否则 UI 文案、页面标题、表单标签、提示语一律用中文；HTML `lang` 设为 `zh-CN`。
- 仅在有明确理由时才选 Node/React 等（例如：必须复用现有 Node 生态、或前端交互复杂到需要框架）。

## 4) Workflow steps（主 agent 仅编排，不阻塞）

### Step 0 — ACK（主 agent）
- 立即回复：已派发规划与执行（含自动验证），完成后自动回传结果。

### Step 1 — Plan（子 agent：合并 Preflight+需求+规划）
使用 `sessions_spawn` 调用 **planner-agent**（异步 run，不轮询）：

```js
sessions_spawn({
  agentId: "planner-agent",
  label: "devwf-plan",
  mode: "run",
  cleanup: "keep",
  timeoutSeconds: 240,
  thinking: "high",
  task: `你是 Plan agent（dev-workflow v3 的 Stage0-2：Preflight + 需求分析 + 技术规划）。\n\n输入：用户需求：{USER_INPUT}\n可选workdir：{WORKDIR_OR_EMPTY}\n\n目标：输出一个可执行的 Plan Bundle（JSON），供 Runner 子 agent 调用 Codex CLI 全自动实现，并供 Verifier 子 agent 跑测试验证。\n\n约束：\n1) 不要向用户提问；有歧义就做最合理假设，并在 codex_prompt 里要求 Codex 记录 assumptions。\n2) 给出明确 workdir（绝对路径）。若未指定目录，建议一个新目录，但不要放在 ~/.openclaw/agents 或 ~/.openclaw/credentials 下。\n3) codex_prompt 必须包含：要改哪些文件/模块、完成标准(DoD)、以及如何验证（run_commands）。\n4) codex_prompt 必须要求 Codex 的最终输出为严格 JSON（不要 Markdown、不要代码块），并符合 Runner 提供的 JSON Schema（默认字段：{"summary":string,"changes":string[]}）。\n5) run_commands 必须是可执行命令序列（以 cd workdir 开头），用于验收；acceptance 给出可核验的条目。\n6) 若是“本地 web 页面/看板”且用户未指定栈：默认优先 SQLite + Flask + 原生 HTML/CSS/JS（Jinja2）；除非有明确理由，否则避免引入重构建/重依赖的前端框架。\n7) 若产出 web 页面/网站：除非用户明确要求英文，否则 UI 文案默认中文（HTML lang=zh-CN）。\n\n输出格式（必须严格遵守）：\n- 先用 6~12 行给出人类可读摘要（目标/范围/假设/验收点）。\n- 然后输出 JSON，包在标记中：\n  BEGIN_PLAN_BUNDLE_JSON\n  { ... }\n  END_PLAN_BUNDLE_JSON\n\nPlan Bundle JSON 字段：task_name, workdir, codex_prompt, acceptance(string[]), run_commands(string[])。`
})
```

主 agent 收到回传后：
- 从 `BEGIN_PLAN_BUNDLE_JSON ... END_PLAN_BUNDLE_JSON` 中解析出 Plan Bundle（JSON）

### Step 2 — Run（子 agent：调用 Codex CLI 全自动实现）
使用 `sessions_spawn` 调用 **executor-agent**（作为 Runner）：

```js
sessions_spawn({
  agentId: "executor-agent",
  label: "devwf-run",
  mode: "run",
  cleanup: "keep",
  timeoutSeconds: 3600,
  thinking: "high",
  task: `你是 Runner agent（dev-workflow v3 的 Run：执行层通过 Codex CLI 全自动实现）。\n\n输入 Plan Bundle JSON：\n{PLAN_BUNDLE_JSON}\n\n要求：\n1) 禁止在敏感目录下运行（命中则直接失败回传原因）：\n   - ~/.openclaw/agents/\n   - ~/.openclaw/credentials/\n   - ~/.openclaw/**/auth*.json\n   允许在 ~/.openclaw/workspace 的“具体项目子目录”运行（workdir 不能是 workspace 根目录）。\n2) 确保 workdir 存在且可写：不存在则 mkdir -p；并确保 workdir 是 git 仓库（Codex CLI 默认要求在 git repo 内运行）。若不是 repo，则 git init。\n3) 必须使用 OpenClaw exec 工具（pty:true）调用 Codex CLI，并把执行过程沉淀为 artifacts（可审计/可回放）。\n\n   你需要在 <workdir>/.openclaw-runs/<run_id>/ 产出以下文件：\n   - codex-output.schema.json（用于 codex exec --output-schema；约束 Codex 最终输出为可校验 JSON）\n   - codex-prompt.txt（写入 <codex_prompt>，避免复杂转义）\n   - codex-events.jsonl（codex exec --json 的事件流输出）\n   - codex-last-message.json（codex exec --output-last-message 的最终消息；需符合 schema）\n   - task-output.txt（你自己的关键日志尾部/摘要）\n   - latest.json（Runner 合同产物）\n\n   推荐命令形态（可等价实现，但 artifacts 必须齐全）：\n   - RUN_ID=\"$(date +%Y%m%d-%H%M%S)-devwf\"\n   - RUN_DIR=\"<workdir>/.openclaw-runs/$RUN_ID\"\n   - mkdir -p \"$RUN_DIR\"\n   - 写 schema：\n     cat > \"$RUN_DIR/codex-output.schema.json\" <<'JSON'\n     {\n       \"$schema\": \"https://json-schema.org/draft/2020-12/schema\",\n       \"type\": \"object\",\n       \"additionalProperties\": false,\n       \"required\": [\"summary\", \"changes\"],\n       \"properties\": {\n         \"summary\": {\"type\": \"string\"},\n         \"changes\": {\"type\": \"array\", \"items\": {\"type\": \"string\"}}\n       }\n     }\n     JSON\n   - 写 prompt：\n     cat > \"$RUN_DIR/codex-prompt.txt\" <<'PROMPT'\n     <codex_prompt>\n     PROMPT\n   - 执行 Codex（事件流落盘到 JSONL）：\n     codex exec --full-auto -C \"<workdir>\" \\\n       --output-schema \"$RUN_DIR/codex-output.schema.json\" \\\n       --output-last-message \"$RUN_DIR/codex-last-message.json\" \\\n       --json - < \"$RUN_DIR/codex-prompt.txt\" > \"$RUN_DIR/codex-events.jsonl\"\n\n4) latest.json 字段（必须）：task_name,timestamp,workdir,status,summary,output_tail,artifacts{stdout_path,run_dir,codex_events_jsonl_path,codex_last_message_path,codex_output_schema_path}。\n5) 最终回传：status(done|failed)、summary（可直接发回入口会话）、latest.json 的绝对路径。\n\n注意：全自动，不要向用户提问；失败也要产出 latest.json（status=failed）并给 next suggestion。`
})
```

### Step 3 — Verify（子 agent：跑测试/验收）
使用 `sessions_spawn` 调用 **reviewer-agent**（作为 Verifier：负责跑 run_commands + 产出验证报告；不写业务代码）：

```js
sessions_spawn({
  agentId: "reviewer-agent",
  label: "devwf-verify",
  mode: "run",
  cleanup: "keep",
  timeoutSeconds: 1200,
  thinking: "high",
  task: `你是 Verifier agent（dev-workflow v3 的 Verify）。\n\n输入：\n- Plan Bundle JSON：\n{PLAN_BUNDLE_JSON}\n- Runner latest.json：\n{LATEST_JSON}\n\n要求：\n1) 只做验证：用 OpenClaw exec 工具在 workdir 依次执行 run_commands，记录每条命令的 exit_code、stdout_tail、stderr_tail。\n2) 生成 <workdir>/.openclaw-runs/<run_id>/verify-report.txt 与 verify.json（同目录）。\n3) 根据 acceptance + run_commands 结果给出 verify_status：pass|fail。\n4) 如果失败，输出 fail_summary（最关键的 3~8 行错误信息）以及 fail_kind：\n   - test_fail（代码/逻辑/测试失败，可通过修复解决）\n   - infra_or_auth_blocked（登录/验证码/网络/权限等导致，自动修复通常无意义）\n\n输出格式（必须严格遵守）：\nBEGIN_VERIFY_JSON\n{ ... }\nEND_VERIFY_JSON\n\nverify.json 字段：task_name, workdir, verify_status, fail_kind, fail_summary, commands:[{cmd,exit_code,stdout_tail,stderr_tail}]，artifacts:{verify_json,verify_report}。`
})
```

### Step 4 — 自动修复（最多 1 次，fail_kind=test_fail 时才触发）
若 Verify 失败且 `fail_kind=test_fail`：

#### 4.1 生成最小修复 prompt（planner-agent，仅输出 fix_codex_prompt）
```js
sessions_spawn({
  agentId: "planner-agent",
  label: "devwf-fixprompt",
  mode: "run",
  cleanup: "keep",
  timeoutSeconds: 180,
  thinking: "high",
  task: `你是 Fix-Prompt agent。\n\n输入：\n- 原 Plan Bundle JSON：{PLAN_BUNDLE_JSON}\n- latest.json：{LATEST_JSON}\n- verify.json：{VERIFY_JSON}\n\n目标：只输出一个 fix_codex_prompt，用于让 Codex 做“最小补丁修复”。\n强约束：\n- patch only：只修复失败原因，不做重构、不大规模改文件结构、不做无关优化。\n- 必须围绕 verify.json 的失败证据（失败命令/错误摘要）给出修复指令。\n\n输出格式：\nBEGIN_FIX_CODEX_PROMPT\n...\nEND_FIX_CODEX_PROMPT`
})
```

#### 4.2 复用 Runner 再跑一次（把 Plan Bundle 的 codex_prompt 替换为 fix_codex_prompt）
- 主 agent 构造新的 Plan Bundle（字段不变，仅 `codex_prompt=fix_codex_prompt`），再跑一次 Step 2（Runner）
- 然后再跑一次 Step 3（Verify）

若第二次 Verify 仍失败：停止自动化，提示人工介入并回传 verify.json 摘要与复现命令。

### Step 5 — 汇总回传（主 agent）
- 默认回传到触发入口的同一会话/渠道。

## 5) Output contract
- Plan Bundle：文本中包含 JSON 块（BEGIN/END 标记）
- Runner artifacts（都在 `<workdir>/.openclaw-runs/<run_id>/` 下）：
  - latest.json：`<workdir>/.openclaw-runs/<run_id>/latest.json`
  - task-output.txt：`<workdir>/.openclaw-runs/<run_id>/task-output.txt`
  - codex-events.jsonl：`<workdir>/.openclaw-runs/<run_id>/codex-events.jsonl`
  - codex-last-message.json：`<workdir>/.openclaw-runs/<run_id>/codex-last-message.json`
  - codex-output.schema.json：`<workdir>/.openclaw-runs/<run_id>/codex-output.schema.json`
- Verifier artifacts（同目录）：
  - verify.json：`<workdir>/.openclaw-runs/<run_id>/verify.json`
  - verify-report.txt：`<workdir>/.openclaw-runs/<run_id>/verify-report.txt`

## 6) Hard constraints
- Plan 必须产出可解析 Plan Bundle JSON（BEGIN/END）。
- Run 必须通过 OpenClaw `exec` + `pty:true` 调用 Codex CLI，并落盘执行层 artifacts：
  - `codex exec --json` → codex-events.jsonl
  - `codex exec --output-last-message` → codex-last-message.json
  - `codex exec --output-schema` → codex-output.schema.json
- Verify 必须实际执行 run_commands 并产出 verify.json（BEGIN/END）。
- 自动修复最多 1 次；且仅在 fail_kind=test_fail 时触发。
- 未经用户明确确认：不得对外发布/上传/发送到其他群/账号（默认仅回传到入口会话）。

## 7) Failure modes（Top 3）
1) Plan Bundle/verify JSON 无法解析 → 重跑对应子 agent 并强调输出契约。
2) Verify=infra_or_auth_blocked（登录/验证码/权限/网络）→ 直接停下，提示人工处理，不进入自动修复。
3) 进入修复轮后仍失败 → 停止自动化，人工介入。

## 8) Smoke
```bash
mkdir -p /tmp/devwf-smoke && cd /tmp/devwf-smoke && git init
codex exec --full-auto "Create a README.md with a one-line description."
```
