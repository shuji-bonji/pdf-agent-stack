# E1 — Mac・手元のビルド

実施日時は 2026-11-03 22:35〜22:50 JST です。計画は [../README.md](../README.md)、所見は [../FINDINGS.md](../FINDINGS.md) にあります。

## 環境

| 項目 | 値 |
| --- | --- |
| OS | macOS（Apple Silicon、arm64） |
| 起動したもの | Claude Desktop に `pdf-*-local` として登録した 4 サーバー。各リポジトリの `mcp/<name>/dist/index.js` を起動する |
| 版（`package.json`） | pdf-reader-mcp 0.18.1 / pdf-verify-mcp 0.32.2 / pdf-writer-mcp 0.23.1 / pdf-spec-mcp 0.11.0（E2 の公開版と同じ） |
| dist と commit | 4 つとも、dist のビルド時刻が最新の commit より後（reader `800fc15`・verify `36999fa`・writer `67155d8`・spec `474ff3b`） |
| veraPDF | 1.30.0（Homebrew、`/opt/homebrew/bin/verapdf`。PATH から見つかった） |
| 日本語フォント | NotoSansJP-Regular.otf（`PDF_WRITER_FONT`） |
| 仕様書（`PDF_SPEC_DIR`） | 17 文書（`list_specs` の `totalSpecs: 17`） |

検体は E2 と同じものを `pdf-agent-stack/_to_delete/trial-specimens/` に置きました。書き出したファイルは `_to_delete/trial-e1/` にあります。どちらも git の管理外です。

E1 では、ツールを 1 回ずつ手で呼びました。E2 のような全ツール × 全検体の一括実行はしていません。E2 で見つかった所見が手元のビルドでも出るかと、E2 で確かめられなかったこと（veraPDF・仕様書の本文）に絞っています。

## E2 の所見が手元のビルドでも出るか

| 所見 | 手元のビルド（E1） |
| --- | --- |
| F-01 reader が「タグが無い」と返す | 同じ。`inspect_tags` は `isTagged: false`、`extract_structured_text` は「This document is not tagged」。`extract_structured_text` のツール説明には「構造木を読めなかったときは `isTagged` と `elements` を `false` と `[]` ではなく `null` にする」と書いてあり、説明とも食い違う |
| F-02 verify の `validate_conformance` | `engine: "native"` では同じ（13 規則中 10 通過、`xmp-declaration`・`output-intent` の違反）。**既定の `engine: "auto"` では veraPDF が見つかるため、`ENCRYPTED_PDF` のエラーになった**。E2（veraPDF 無し）では同じ呼び出しが違反の一覧を返したので、veraPDF の有無で応答の種類が入れ替わる |
| F-03 verify の `evaluate_policy` | 同じ。`POL-CAUTION-UNSIGNED`（「No signatures」）が発火し、`facts.signatureCount: 0`。`password: "secret"` を渡すと `scope.authenticated: true` になり、同じ規則が正しい観測に基づいて発火する |
| F-04 `validate_clauses` が存在しないパスを `PARSE_FAILED` にする | 同じ |
| F-05 0 バイトのファイルで `INTERNAL_ERROR` | 同じ（`get_page_count`） |
| F-06 `render_page` が PDF でないファイルで `INTERNAL_ERROR` | 同じ |
| F-08 writer が空パスワードの暗号化 PDF を拒否する | 同じ |
| F-11 Markdown の H1 が二重になる | 同じ（日本語の Markdown で確認） |

## E2 で確かめられなかったこと

### veraPDF での検査

writer で作ったファイルを、veraPDF 1.30.0 で検査しました。

| 対象 | 作り方 | 結果 |
| --- | --- | --- |
| `smoke-pdfa3b.pdf` | `ensure_pdfa`（既定の pdfa-3b） | PDF/A-3b 適合（146 規則すべて通過） |
| `smoke-pdfa4.pdf` | `ensure_pdfa`（pdfa-4） | PDF/A-4 適合（109 規則すべて通過） |
| `md-ja.pdf` | `create_markdown_pdf`（日本語・`tagged: true`） | PDF/UA-1 適合（106 規則すべて通過） |

`ensure_pdfa` は、どちらの版でも「適合は確かめていない」という警告を返しました。

### pdf-spec-mcp の本文

| 呼び出し | 結果 |
| --- | --- |
| `search_spec`（`pdf17`、「Lbl LBody list item」） | 14.8.4.3.3「List Elements」が 1 件 |
| `search_spec`（`iso32000-2`、同じ語） | 14.8.4.8.2「Standard structure types for lists」が 1 件 |
| `get_tables`（`pdf17`、14.8.4.3.3） | Table 336 を、見出しから見出しまで（`boundary`）返した |
| `get_tables`（`iso32000-2`、14.8.4.8.2） | Table 370 を返した |
| `get_requirements`（`pdf17`、7.6.3.3） | 要求 2 件（shall 1・may 1） |
| `compare_versions`（7.6） | 一致 12・追加 22・削除 1。下記の F-15 |

### 書き出しの経路

- 空白と日本語を含むパスへの読み書きは、macOS でも通った
- writer が作った日本語の Markdown は、箇条書きの記号「•」が `LBody` の中身に入り、`Lbl` が無い（F-14）

## E1 で新たに見つかったもの

- **F-14**：writer の箇条書きが `Lbl` を作らず、記号「•」を `LBody` の本文に入れる
- **F-15**：pdf-spec-mcp の `compare_versions` が、題名の変わった節を「削除」と「追加」に分ける
- **F-02 への追記**：veraPDF の有無で、`validate_conformance` の応答がエラーと違反の一覧のあいだで入れ替わる
