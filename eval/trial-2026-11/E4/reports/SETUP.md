# SETUP — Grok Build 環境インベントリ（2026-11 E4）

- 実施日時: 2026-11-04 02:01–02:10 JST
- 追跡: shuji-bonji/pdf-agent-stack#47 の E4。ここで止め、UC01 には進んでいない
- このセッションの CWD: `/Users/bonji/pdf-agent-stack-eval`
- `grok inspect` の Project Instructions: `/Users/bonji/pdf-agent-stack-eval/Agents.md`（project、約 744 tokens）。キット側 `eval/hosts/grok-build/AGENTS.md` と `diff -q` で同一
- `00-grok-build-setup.md` は CWD に無い。読んだのは `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/eval/hosts/grok-build/00-grok-build-setup.md`
- 2026-09 の `reports/`・`out/`・`fixtures/generated/`（キット側）は読んでいないものを入力にしていない。キット側 `fixtures/generated/smoke.pdf` のタイムスタンプは 2026-09-16 08:36:23 のまま
- 製品コードは変更していない

## 手順 1：起動した版

接続中プロセスは 2026-11-04 02:01:35 JST に pid 85852（`grok`）の子として起動した `npm exec @shuji-bonji/pdf-*-mcp@latest`。serverInfo は、そのプロセスが読む npx キャッシュの `McpServer({ name, version })` と、stderr の起動行。initialize 応答の JSON そのものは取っていない。

期待値（版）は pdf-reader-mcp 0.18.1 / pdf-writer-mcp 0.23.1 / pdf-verify-mcp 0.32.2 / pdf-spec-mcp 0.11.0。版は 4 つとも一致した。serverInfo.name はパッケージ名と一致しないものがある（下表のまま）。

| 接続名 | 登録 | serverInfo.name | serverInfo.version | stderr 起動行 | npx キャッシュの package.json |
| --- | --- | --- | --- | --- | --- |
| pdf-reader-mcp | plugin（`pdf-reader-mcp`） | `pdf-reader-mcp` | 0.18.1 | `pdf-reader-mcp v0.18.1 running via stdio` | `@shuji-bonji/pdf-reader-mcp` 0.18.1 |
| pdf-writer | plugin（`pdf-writer-mcp`） | `@shuji-bonji/pdf-writer-mcp` | 0.23.1 | `[@shuji-bonji/pdf-writer-mcp] v0.23.1 started (stdio)` | `@shuji-bonji/pdf-writer-mcp` 0.23.1 |
| pdf-verify | plugin（`pdf-verify-mcp`） | `pdf-verify-mcp` | 0.32.2 | `pdf-verify-mcp v0.32.2 running via stdio` | `@shuji-bonji/pdf-verify-mcp` 0.32.2 |
| pdf-spec | config（`~/.grok/config.toml` の `[mcp_servers.pdf-spec]`） | `@shuji-bonji/pdf-spec-mcp` | 0.11.0 | `@shuji-bonji/pdf-spec-mcp v0.11.0 started` | `@shuji-bonji/pdf-spec-mcp` 0.11.0 |

`grok inspect` の MCP 出典は上表と同じ。plugin の起動引数はどれも `npx -y @shuji-bonji/<name>@latest`。plugin の `pdf-spec-mcp` も enabled だが、inspect に出る pdf-spec は config 側だけ。実行中プロセスの環境変数 `PDF_SPEC_DIR` は config の絶対パス。

`[mcp_servers.pdf-writer-dev]` は `enabled = false`。inspect の MCP 一覧に無い。このセッションの writer は plugin 側。

### npm view（2026-11-04）

```text
@shuji-bonji/pdf-reader-mcp 0.18.1
@shuji-bonji/pdf-writer-mcp 0.23.1
@shuji-bonji/pdf-verify-mcp 0.32.2
@shuji-bonji/pdf-spec-mcp 0.11.0
```

npx キャッシュ（`~/.npm/_npx/` の、上記プロセスが実行している package.json）も同じ 4 版。npm の最新版と、起動している npx キャッシュの版の差は無かった。

## 手順 2：Skill と Agent

`grok inspect`（Grok 1.0.70）が発見した PDF Agent Stack のもの。期待値の版は 4 つとも一致した。

| 名前 | 種別 | 版 | 発見 | 出典 |
| --- | --- | --- | --- | --- |
| pdf-read | Skill | 0.2.3 | あり | plugin: pdf-read。`grok plugin details` は git `https://github.com/shuji-bonji/pdf-read-skill.git`、commit `90fb857558a47aa822fb8a2913cb5356ac5bbf24`。このセッションに載ったパスは `/Users/bonji/.grok/installed-plugins/pdf-read-skill-f6fce5c8/skills/pdf-read/SKILL.md` |
| pdf-trust | Skill | 0.8.3 | あり | plugin: pdf-trust（`/Users/bonji/.grok/installed-plugins/pdf-trust-skill-0f9b0032`） |
| pdf-publish | Skill | 0.7.1 | あり | plugin: pdf-publish（`/Users/bonji/.grok/installed-plugins/pdf-publish-skill-3bf31451`） |
| pdf-specialist:pdf-specialist | Agent | 0.7.0 | あり | plugin: pdf-specialist（`/Users/bonji/.grok/installed-plugins/pdf-specialist-plugin-e6567d49/agents/pdf-specialist.md`） |

同梱の Skill `pdf`（bundled、`/Users/bonji/.grok/bundled/skills/pdf/SKILL.md`）も発見されている。上の pdf-read とは別項目。

### pdf-read が 2 つ enabled

`~/.grok/config.toml` の `[plugins].enabled` に `pdf-read` と `user/0de2cfe1/pdf-read` の両方がある。

| エントリ | このセッションで使われるか | 版 |
| --- | --- | --- |
| `pdf-read` | 使われる。`grok inspect` の Skills は `pdf-read` が 1 件で、表示は `plugin: pdf-read`（`[claude]` は付かない）。`collidesWith` は無い | 0.2.3 |
| `user/0de2cfe1/pdf-read` | 使われていない。`grok plugin details user/0de2cfe1/pdf-read` は `Plugin "user/0de2cfe1/pdf-read" not found`。`grok plugin list` と `grok inspect` の Skills / Plugins にこの ID は無い | 取れない（インストールが無い） |

Claude の `~/.claude/settings.json` は `pdf-read@shuji-bonji` を enabled にしており、キャッシュ `~/.claude/plugins/cache/shuji-bonji/pdf-read/0.2.3` の plugin.json は 0.2.3、SKILL.md の md5 は Grok 側と同一（`71cc26d726aed385ce679398a7b889c9`）。`grok inspect` はこの Claude 側を別 Skill として出していない。`user/0de2cfe1/pdf-read` とこのキャッシュが同一だとは確認できていない。

## 手順 3：外部の道具と設定

### veraPDF

plugin の pdf-verify プロセスに `PDF_VERIFY_VERAPDF` は無い（環境変数を確認）。`PDF_VERIFY_TRUST_ANCHORS` も無い。プロセスの PATH には `/opt/homebrew/bin` が含まれる。

| 観測 | 値 |
| --- | --- |
| `which verapdf` | `/opt/homebrew/bin/verapdf` |
| 実体 | `/opt/homebrew/Cellar/verapdf/1.30.3/bin/verapdf`（Homebrew の表示は stable 1.30.3、Installed 1.30.3） |
| `verapdf --version` | `veraPDF 1.30.0`、Built: Thu Oct 08 00:17:00 JST 2026 |

`validate_conformance` は engine `auto` で 1 回。入力は読み取り専用の官報検体。

入力:

```json
{
  "file_path": "/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/eval/hosts/grok-build/fixtures/incoming/gazette-or-gov.pdf",
  "engine": "auto",
  "response_format": "json"
}
```

出力（そのまま。`authoritativeValidation` は応答に無かった）:

```json
{
  "error": true,
  "code": "ENCRYPTED_PDF",
  "message": "Document is encrypted; veraPDF cannot validate PDF/A against the file as received",
  "suggestion": "PDF/A forbids encryption (ISO 19005-1, 6.1.3). Record the veraPDF run as not performed. Use engine: \"native\" to run the subset — the no-encryption rule will fail. This is a finding about the file, not INTERNAL_ERROR."
}
```

この官報への 1 回には `authoritativeValidation` が無い。`reason` も無い。

追加確認（2026-11-04、smoke.pdf、1 回）。宣言の無いファイルへの `pdfa-2b` 指定。

入力:

```json
{
  "file_path": "/Users/bonji/pdf-agent-stack-eval/fixtures/generated/2026-11/smoke.pdf",
  "flavour": "pdfa-2b",
  "engine": "auto",
  "response_format": "json"
}
```

応答の `authoritativeValidation`（そのまま）:

```json
{
  "performed": true,
  "validator": "verapdf",
  "path": "/opt/homebrew/bin/verapdf",
  "version": "1.30.0"
}
```

同じ応答の隣にあるフィールド。`authoritativeValidation` の中に `engine` と `reason` は無い。

- 最上位の `engine`: `"verapdf"`
- `reason`: 応答にこのキーは無い
- 版の表示: `authoritativeValidation.version` は `"1.30.0"`。`notes` の 1 件目は `Validated by veraPDF (/opt/homebrew/bin/verapdf, version 1.30.0) — authoritative result.`
- `flavour`: `"PDF/A-2b"`。`compliant`: false。`checkedRules` 144、`passedRules` 141、`failedRules` 3

veraPDF は実行されている（`performed` true、`validator` `verapdf`）。`compliant: false` は、このツールが返した適合フラグである。

### trust anchor

`PDF_VERIFY_TRUST_ANCHORS` は未設定。キットの `trust-anchors/` は空（エントリ 0）。この CWD に `trust-anchors/` は無い。以降は anchor 無しの前提。

### フォント

plugin の pdf-writer プロセスに `PDF_WRITER_FONT` は無い。Claude の `settings.json` には `PDF_WRITER_FONT` があるが、この writer プロセスには載っていない。キットの `fonts/` は空。

1 回目の入力は `text` = `Hello 日本語`、`outputPath` = `/Users/bonji/pdf-agent-stack-eval/fixtures/generated/2026-11/smoke.pdf`、`fontPath` 無し。

出力:

```json
{
  "error": "The text contains non-Latin characters (e.g. Japanese) but no embeddable font was provided.",
  "code": "FONT_REQUIRED",
  "next_actions": [
    {
      "action": "retry_with_fontPath",
      "reason": "非 Latin 文字（日本語等）には埋め込みフォントが必要です。\"fontPath\" に .ttf/.otf を指定するか、環境変数 PDF_WRITER_FONT を設定してください",
      "example": {
        "fontPath": "/path/to/NotoSansJP-Regular.otf"
      }
    }
  ],
  "retryable": true
}
```

2 回目は同じ text と outputPath に、`fontPath` = `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-writer-mcp/NotoSansJP-Regular.otf` を付けた。ファイルはある（4,533,028 バイト、2026-07-16）。

出力: `pageCount` 1、`bytes` 6272、`font` `NotoSansJP-Regular.otf`、`path` は上記 smoke.pdf。

### PDF_SPEC_DIR

config の値は `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/mcp/pdf-spec-mcp/pdf-spec`。実行中の pdf-spec プロセスに `PDF_SPEC_DIR` が載っている。

`list_specs` の入力は `{}`。`totalSpecs` は 17。返った id の順:

1. `iso32000-2`
2. `iso32000-2-2020`
3. `pdf17`
4. `pdf17old`
5. `ts32001`
6. `ts32002`
7. `ts32003`
8. `ts32004`
9. `ts32005`
10. `pdfua1`
11. `pdfua2`
12. `tagged-bpg`
13. `wtpdf`
14. `declarations`
15. `an001`
16. `an002`
17. `an003`

`coverage.gaps` は 2 件。PDF/A（ISO 19005-1、ISO 19005-2、ISO 19005-3、ISO 19005-4）と、PAdES（ETSI EN 319 142-1、ETSI EN 319 142-2）。

### 検体

CWD に `fixtures/incoming/` は無い。11 本はキットの読み取り専用ディレクトリ `/Users/bonji/workspace/shuji-bonji/pdf-agent-stack/eval/hosts/grok-build/fixtures/incoming/` を `md5 -r` と `stat -f %z` で測った。`gazette-or-gov.pdf` の md5 は期待値 `3fa16c47132a88dbdea774b445c881d7` と一致した（139,503 バイト）。`batch-gov.pdf` も同じバイト数と同じ md5。

| 名前 | バイト数 | md5 |
| --- | --- | --- |
| batch-gov.pdf | 139503 | 3fa16c47132a88dbdea774b445c881d7 |
| batch-plain-invoice.pdf | 26521 | abbb91ba46e53ffe328c80da92f7d322 |
| batch-tampered.pdf | 52710 | c6650fabb961b81c736c688c31230a4e |
| batch-ua-report.pdf | 26456 | fa0a71cbf7465dd4c33f9e0b4fc77128 |
| batch-unsigned-contract.pdf | 29027 | 0a6763ec7284ba23fd173f90a0adb1b2 |
| contract-like-signed.pdf | 52710 | 3076f0d9052acd1e6940721cbab1fbe1 |
| contract-unsigned.pdf | 29027 | 0a6763ec7284ba23fd173f90a0adb1b2 |
| gazette-or-gov.pdf | 139503 | 3fa16c47132a88dbdea774b445c881d7 |
| long-report.pdf | 1042075 | 72a7e2bf5827438029e338b4d0ebd78c |
| scan-like.pdf | 14799 | 89980e9d66af63a9f95fe44c2f56a6b7 |
| scan-no-text-layer.pdf | 78447 | 60c6e670f6ade665ac93f12e8e50ec74 |

## 手順 4：スモークテスト

出力先は `fixtures/generated/2026-11/smoke.pdf`。writer を先に呼び、できたファイルを reader と verify に渡した。

| サーバー | 入力 | 出力 | 目安 |
| --- | --- | --- | --- |
| pdf-writer | `create_text_pdf`。text `Hello 日本語`、outputPath は上記、fontPath 無し | `code` `FONT_REQUIRED`、`retryable` true、`next_actions[0].action` `retry_with_fontPath`。エラー文は手順 3 に全文 | 日本語はフォント次第。FONT_REQUIRED が返った |
| pdf-writer | 同上 + fontPath（手順 3 の絶対パス） | `pageCount` 1、`bytes` 6272、`font` `NotoSansJP-Regular.otf`。md5 `ef8270f4ac74e1b7758e662bcc48d149` | ファイルができた |
| pdf-reader | `get_page_count`。`file_path` は上記 smoke.pdf | 数値 `1`（`pageCount` というフィールド名では返っていない） | ページ数 1 |
| pdf-verify | `identify_conformance`。同じ file_path、`response_format` `json` | `hasXmp` false、`pdfA` null、`pdfUa` null、`pdfVersion` `1.7`、`xmpNamespaces` `[]`。notes は宣言の識別のみであることと、カタログに XMP が無いこと。`scope.chainStop.kind` `complete`、`scope.encrypted` false、`scope.reconstructed` false | JSON が返った。宣言は無い |
| pdf-spec | `list_specs` `{}` | `totalSpecs` 17。id は手順 3 | 一覧が返った |

`identify_conformance` は宣言の識別。適合の判定ではない。writer の終了は、ファイルが書けたという観測。

## 00-grok-build-setup.md の項目

### 1. ホスト

| 項目 | 実測 |
| --- | --- |
| OS | macOS 26.7.2 arm64（Build 25G332） |
| Node.js | v24.16.0（`/Users/bonji/.nvm/versions/node/v24.16.0/bin/node`） |
| npx | あり。11.13.0 |
| Grok | 1.0.70 stable（`~/.grok/version.json` と `grok inspect`） |

### 2. npm パッケージの実測版

手順 1 の `npm view` と、起動中 npx キャッシュはどちらも reader 0.18.1 / writer 0.23.1 / verify 0.32.2 / spec 0.11.0。

### 3. veraPDF のパスと版

パスは `/opt/homebrew/bin/verapdf`（Cellar 1.30.3 への symlink）。`verapdf --version` の表示は 1.30.0。`PDF_VERIFY_VERAPDF` は渡していない。`engine: "auto"` の 1 回は `ENCRYPTED_PDF` で、`authoritativeValidation` は返っていない。

### 4. PDF_WRITER_FONT

plugin の writer には無い。フォントファイル名は呼び出しの `fontPath` で渡した `NotoSansJP-Regular.otf`。`fontPath` 無しは `FONT_REQUIRED`、付けた呼び出しで smoke.pdf ができた。

### 5. PDF_SPEC_DIR と list_specs

config に絶対パスがある。`list_specs` は `totalSpecs` 17。id は手順 3。gaps は PDF/A（ISO 19005-1/-2/-3/-4）と PAdES（ETSI EN 319 142-1 / 319 142-2）。

### 6. Skill 3 本

3 本とも発見された。配置は手順 2。Grok の plugin インストールであり、inspect の表示に `[claude]` は付かない。pdf-specialist も発見された。`user/0de2cfe1/pdf-read` は enabled 一覧にあるが、発見された Skill ではない。

### 7. スモーク 4 件

手順 4。writer は FONT_REQUIRED のあと fontPath 付きで成功。reader は `1`。verify の `identify_conformance` は JSON。spec の `list_specs` は 17 件。

### 8. このホストでは測れない、または条件付きの項目

- trust anchor が無い。署名者の身元を anchor で見る検査は、この前提では未実施のままになる
- `validate_conformance` の `authoritativeValidation.engine` / `reason` は、官報検体への 1 回では返らなかった（`ENCRYPTED_PDF`）
- `user/0de2cfe1/pdf-read` の版は不明
- CWD は `eval/hosts/grok-build` ではない。指示書と `fixtures/incoming/` はキット側を読んだ。スモークの出力は CWD の `fixtures/generated/2026-11/smoke.pdf`
- Grok の plugin プロセスは、Claude `settings.json` の `PDF_WRITER_FONT` を載せていない
- ISO 規格 PDF は再配布しない。製品コードは変更していない
