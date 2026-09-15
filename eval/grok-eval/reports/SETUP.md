# SETUP — Grok Build 環境インベントリ

- 実施日時: 2026-09-15 23:05 JST
- ホスト: Grok Build 1.0.30 (04b7ffed98c6) [stable]
- 登録経路: `00-grok-build-setup.md` の npx 手動登録ではなく、Claude 互換プラグイン（marketplace `shuji-bonji`）経由。`pdf-spec` のみ `~/.grok/config.toml` の `[mcp_servers.pdf-spec]` で上書き

## 1. ホスト

| 項目 | 実測 |
| --- | --- |
| OS | macOS 26.6.2 (Build 25G83)、Darwin 25.6.0 arm64 |
| Node.js | v24.16.0（`~/.nvm/versions/node/v24.16.0`） |
| npx | 11.13.0（あり） |
| Grok | `/Users/bonji/.grok/bin/grok` 1.0.30 |

## 2. npm パッケージ実測版

`npm view @shuji-bonji/pdf-*-mcp version` と、接続中サーバの自己申告。

| パッケージ | npm view | 接続中の自己申告 | サイト実測（2026-09-04） |
| --- | --- | --- | --- |
| pdf-reader-mcp | 0.15.1 | 0.15.1 | 0.15.0 |
| pdf-verify-mcp | 0.26.0 | 0.26.0 | 0.26.0 |
| pdf-writer-mcp | 0.21.0 | 0.21.0 | 0.21.0 |
| pdf-spec-mcp | 0.6.0 | 0.6.0 | 0.6.0 |

reader だけサイト実測より 1 パッチ新しい。所見として残す。

## 3. veraPDF

- PATH: `/opt/homebrew/bin/verapdf` → `../Cellar/verapdf/1.30.2/bin/verapdf`
- `verapdf --version`: veraPDF 1.30.0（表示）/ Homebrew 実体 1.30.2
- このセッションの pdf-verify プロセス env: `PDF_VERIFY_VERAPDF` は未設定。PATH 探索に依存。`validate_conformance` の `engine` は各 UC で実測する

## 4. 日本語フォント（PDF_WRITER_FONT）

- シェル: `PDF_WRITER_FONT=/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-writer-mcp/NotoSansJP-Regular.otf`（存在する、.otf）
- Claude Code `~/.claude/settings.json` にも同じ絶対パスがある
- Grok が spawn した pdf-writer（PWD=`pdf-agent-stack-eval`）: **未設定**
- プラグイン `pdf-writer-mcp` 0.21.0 の `plugin.json` に `env` ブロックは無い（継承前提）
- スモークで `fontPath` 無しの `create_text_pdf`（`"Hello 日本語"`）は `FONT_REQUIRED`（`retryable: true`、`next_actions: retry_with_fontPath`）
- `fontPath` を付けて再試行すると生成できた

## 5. PDF_SPEC_DIR と list_specs

- コーパス実体: `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-spec-mcp/pdf-spec`（ISO 32000-2 EC3、PDF 1.7、PDF/UA 等）
- プラグイン `pdf-spec-mcp` 0.6.0 の `plugin.json` は `"PDF_SPEC_DIR": "${PDF_SPEC_DIR}"`。Grok はプラグイン `env` の `${VAR}` を展開しない
- 対策: `~/.grok/config.toml` の `[mcp_servers.pdf-spec]` に絶対パスを書いた。出典は `grok inspect` で `config`
- `list_specs`: `totalSpecs: 17`。`coverage.gaps` は PDF/A（ISO 19005）と PAdES（ETSI EN 319 142）

## 6. Skill 発見

`grok inspect` より（Claude 互換プラグイン）。

| Skill | 発見 | 配置 |
| --- | --- | --- |
| pdf-trust | あり | plugin: pdf-trust [claude] `/Users/bonji/.claude/plugins/cache/shuji-bonji/pdf-trust/0.8.0/skills/pdf-trust/SKILL.md` |
| pdf-publish | あり | plugin: pdf-publish [claude] `.../pdf-publish/0.7.0/skills/pdf-publish/SKILL.md` |
| pdf-read | あり | plugin: pdf-read [claude] `.../pdf-read/0.2.1/skills/pdf-read/SKILL.md` |

サブエージェント `pdf-specialist:pdf-specialist`（plugin: pdf-specialist 0.7.0）も発見済み。

MCP 出典:

| サーバ | inspect の出典 |
| --- | --- |
| pdf-reader-mcp | plugin: pdf-reader-mcp |
| pdf-verify | plugin: pdf-verify-mcp |
| pdf-writer | plugin: pdf-writer-mcp |
| pdf-spec | config（`~/.grok/config.toml`） |

## 7. スモーク 4 件

| サーバー | 入力 | 想定 | 実際 |
| --- | --- | --- | --- |
| pdf-writer | `create_text_pdf` text=`Hello 日本語` outputPath=`fixtures/generated/smoke.pdf`（fontPath 無し） | ファイル、または `FONT_REQUIRED` | `code: FONT_REQUIRED`。`next_actions[0].action=retry_with_fontPath` |
| pdf-writer | 同上 + `fontPath` = NotoSansJP-Regular.otf | ファイルができる | `pageCount: 1`、`bytes: 6809`、`path` あり |
| pdf-reader | `get_page_count` file_path=smoke.pdf | pageCount が 1 | `1` |
| pdf-verify | `identify_conformance` 同じファイル `response_format=json` | JSON が返る | 返った。`scope.chainStop.kind=complete`、`reconstructed=false`、`hasXmp=false`、`pdfA=null`、`pdfUa=null`、`pdfVersion=1.7` |
| pdf-spec | `list_specs` | 一覧またはエラー文 | `totalSpecs: 17`。gaps: PDF/A・PAdES |

## 8. このホストでは測れない／条件付きの項目

- Grok のプラグイン MCP は Claude `settings.json` の `env` を継承しない。`PDF_WRITER_FONT` / `PDF_VERIFY_TRUST_ANCHORS` / `PDF_VERIFY_VERAPDF` はプロセスに乗っていない
- `PDF_SPEC_DIR` は config.toml 上書きが無ければプレースホルダのまま `REGISTRY_ERROR`
- trust-anchors PEM は未配置（`trust-anchors/` は空）。署名者身元は `not_evaluated` に留まる想定
- ISO 規格 PDF は再配布しない（コーパスは利用者手元の `PDF_SPEC_DIR` のみ）
- 製品コードは変更しない
