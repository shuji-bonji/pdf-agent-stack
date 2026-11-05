# TLS の検体

S6（`tests/s6-error-contract.test.mjs`）が 127.0.0.1 に HTTPS サーバーを立て、`read_url` の TLS の失敗を起こすための証明書です。テストのためだけのもので、鍵はどこでも使っていません。pdf-reader-mcp の `tests/e2e/tls-specimens/self-signed.*` と同じもの（2026-11-05 に OpenSSL 3.0 で作成。自己署名、SAN は IP 127.0.0.1、2126 年まで有効）です。
