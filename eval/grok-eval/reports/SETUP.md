# SETUP — Grok Build 環境インベントリ

- 実施日時: 2026-09-16 08:35 JST
- ホスト: Grok Build 1.0.30 (04b7ffed98c6) [stable]
- 前提: サイト導入手順「`/plugin` とホストごとの書き場所」（`site/docs/ja/guide/getting-started.md`）を読んだうえで取り直した
- 登録経路: Claude 互換プラグイン（marketplace `shuji-bonji`）。`pdf-spec` だけ `~/.grok/config.toml` の `[mcp_servers.pdf-spec]` で上書き
- **手順はサイトにあり、このホストでは config.toml が正典**

## 1. ホスト

| 項目 | 実測 |
| --- | --- |
| OS | macOS 26.6.2 arm64 |
| Node.js | v24.16.0 |
| npx | あり |
| Grok | 1.0.30 |

## 2. npm パッケージ実測版

接続中サーバの自己申告（サイト実測 2026-09-04 との差は reader の 1 パッチのみ）。

| パッケージ | 接続中の自己申告 | サイト実測（2026-09-04） |
| --- | --- | --- |
| pdf-reader-mcp | 0.15.1 | 0.15.0 |
| pdf-verify-mcp | 0.26.0 | 0.26.0 |
| pdf-writer-mcp | 0.21.0 | 0.21.0 |
| pdf-spec-mcp | 0.6.0 | 0.6.0 |

## 3. veraPDF

- PATH 上にあり。`verapdf --version` 表示は 1.30.0（Homebrew 実体 1.30.2）
- このセッションの pdf-verify に `PDF_VERIFY_VERAPDF` は載せていない。PATH 探索に依存

## 4. 日本語フォント（PDF_WRITER_FONT）と FONT_REQUIRED

サイト手順: Grok Build では Claude の `settings.json` の値は writer プロセスに乗らない。`[mcp_servers.pdf-writer]` の `env` に絶対パスを書くか、呼び出しの `fontPath` を付ける。未設定の日本語生成は `FONT_REQUIRED`。

このホストの回避は **呼び出しの `fontPath`** である（writer の出典は plugin のまま。config.toml に writer の env は書いていない）。

| 入力 | 想定 | 実際 |
| --- | --- | --- |
| `create_text_pdf` text=`Hello 日本語`、`outputPath` 指定、`fontPath` 無し | `FONT_REQUIRED` | **あり。** `code: FONT_REQUIRED`、`retryable: true`、`next_actions[0].action=retry_with_fontPath` |
| 同上 + `fontPath`（単一フェイス .otf。パスは書かない） | ファイルができる | `pageCount: 1`、`bytes: 6272`、`font` はファイル名のみ返った |

## 5. PDF_SPEC_DIR と list_specs

サイト手順: プラグイン `plugin.json` は `"PDF_SPEC_DIR": "${PDF_SPEC_DIR}"`。Grok Build 1.0.30 はプラグイン env では展開しない。リテラルのまま渡すと起動失敗（`REGISTRY_ERROR`）。書く場所は `~/.grok/config.toml` の `[mcp_servers.pdf-spec]`（絶対パス。値は書かない）。

このホストの回避は **config.toml の絶対パス** である。`grok inspect` の出典は下記。

- `list_specs`: `totalSpecs: 17`
- `coverage.gaps`: PDF/A（ISO 19005-1 / -2 / -3 / -4）と PAdES（ETSI EN 319 142-1 / 319 142-2）

## 6. Skill 発見と MCP 出典

`grok inspect`（Claude 互換プラグイン）。配置パスは書かない。

| Skill | 発見 | 出典 |
| --- | --- | --- |
| pdf-trust | あり | plugin: pdf-trust [claude] |
| pdf-publish | あり | plugin: pdf-publish [claude] |
| pdf-read | あり | plugin: pdf-read [claude] |

サブエージェント `pdf-specialist:pdf-specialist`（plugin: pdf-specialist）も発見済み。

| サーバ | inspect の出典 |
| --- | --- |
| pdf-reader-mcp | plugin |
| pdf-verify | plugin |
| pdf-writer | plugin |
| pdf-spec | **config** |

`pdf-spec` が plugin ではなく config であることは、サイトが「Grok では config.toml が正典」と書いたことと一致する。

## 7. サイト手順との一致

| 項目 | サイト | このホスト |
| --- | --- | --- |
| `/plugin` 後の `PDF_SPEC_DIR` | ホスト設定に絶対パス。Grok は `config.toml` の `[mcp_servers.pdf-spec]` | 出典 `config`。`list_specs` 17 件が返る |
| プラグイン env の `${VAR}` | Grok では展開しない | 本セッションは config 上書き済みなので、プレースホルダのままでの `REGISTRY_ERROR` は再発火していない |
| 日本語フォント | Grok は `config.toml` の writer env、または呼び出しの `fontPath` | writer は plugin。`fontPath` 無しは `FONT_REQUIRED`、付きで復帰 |

一致している。手順はサイトにあり、このホストでは config.toml が正典である。

## 8. このホストでは測れない／条件付きの項目

- Grok のプラグイン MCP は Claude `settings.json` の `env` を継承しない
- trust-anchors は未配置。署名者身元は `not_evaluated` に留まる想定
- ISO 規格 PDF は再配布しない
- 製品コードは変更しない
