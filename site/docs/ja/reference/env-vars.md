---
description: 各 MCP サーバーの環境変数一覧 — PDF_SPEC_DIR / PDF_SPEC_CACHE / PDF_READER_CONCURRENCY / PDF_VERIFY_VERAPDF / PDF_VERIFY_TRUST_ANCHORS / PDF_WRITER_FONT
---

# 環境変数一覧

必須は `PDF_SPEC_DIR` の 1 つだけで、ほかのサーバーは環境変数なしで起動します。

| 変数 | サーバー | 必須 | 用途 |
|---|---|---|---|
| `PDF_SPEC_DIR` | pdf-spec | **必須** | 仕様 PDF コーパスのディレクトリ |
| `PDF_SPEC_CACHE_DIR` | pdf-spec | 任意 | ディスク上の索引キャッシュの置き場所（v0.5.0+）。既定は `${XDG_CACHE_HOME:-~/.cache}/pdf-spec-mcp`、コーパス全体で約 18 MB |
| `PDF_SPEC_CACHE` | pdf-spec | 任意 | `off`（`0` / `false` も可）でキャッシュの読み書きを止める |
| `PDF_READER_CONCURRENCY` | pdf-reader | 任意 | `read_url` のリモート取得の同時実行数の上限。既定 `4` |
| `PDF_READER_RENDER_TIMEOUT_MS` | pdf-reader | 任意 | `render_page` の 1 ページあたりの制限時間。既定 20,000 ms。超えたページはサーバーを落とさず「描画できなかったページ」として申告される |
| `PDF_VERIFY_VERAPDF` | pdf-verify | 任意 | veraPDF 実行パス（無ければ PATH 探索 → 内蔵ルール） |
| `PDF_VERIFY_TRUST_ANCHORS` | pdf-verify | 任意 | 信頼アンカー証明書のディレクトリ |
| `PDF_WRITER_FONT` | pdf-writer | CJK 出力に実質必須 | 既定フォント（単一フェイス .ttf/.otf） |

開発用に `TEST_FONT_PATH` があります（pdf-writer のフォント依存テストを有効にします）。

::: tip どこに書くか
各変数は、その変数を使うサーバー自身の MCP 設定の `env` ブロックに書きます。サーバーごとの設定例は [導入手順](/ja/guide/getting-started) にあります。

`/plugin` で入れた場合、ホストによって展開が違います。Claude Code は `plugin.json` の `${PDF_SPEC_DIR}` を展開します。Grok Build 1.0.30 はプラグイン env では展開せず、`~/.grok/config.toml` の `[mcp_servers.pdf-spec]` に絶対パスを書きます。`PDF_WRITER_FONT` も同じです。詳細は導入手順の「`/plugin` とホストごとの書き場所」を見てください。
:::
