# Security

- 不要提交任何密钥、token、cookie、auth*.json。
- 不要把 `~/.openclaw/credentials/`、`~/.openclaw/**/auth*.json` 之类敏感路径纳入自动化 workdir。
- 对外发送/发布/上传类操作必须人工确认。

如果你发现潜在的安全问题，请提交 issue 并尽量提供最小复现（脱敏）。
