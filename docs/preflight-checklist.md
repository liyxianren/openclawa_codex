# Operation Preflight Checklist（操作前预检）

目标：降低误操作、外发泄露、破坏性命令等风险。

> 建议把这份 checklist 放在你的 OpenClaw workspace 根目录（例如 `~/.openclaw/workspace/CHECKLIST.md`），并要求所有有副作用的操作在执行前过一遍。

## 何时必须跑
- 写文件/改文件
- 执行命令（尤其是安装依赖、启动服务、数据库迁移）
- 自动化浏览器提交/上传
- 对外发送/发布（邮件、社媒、消息）

## 预检清单（8 项）
1) **Objective**：目标是什么？Done 的标准是什么？
2) **Scope/Target**：改哪些 repo/path/模块？
3) **Identity/Account**：当前账号/环境是谁？会不会发错号？
4) **Reversibility**：能回滚吗？（git commit / patch / 备份 / dry-run）
5) **Blast radius**：影响范围多大？能否先小步试跑？
6) **External side effects**：是否会外发？如是必须人工确认。
7) **Rate-limit / anti-bot risk**：自动化站点是否风控？是否需要人机兜底？
8) **Secrets & privacy**：不要把 token/密钥写入日志或 commit。

## Gate
- 任一项不清楚：停下问清楚再做。
- 外发/破坏性：必须明确确认（yes/no）。
