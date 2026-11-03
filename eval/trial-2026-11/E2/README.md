# E2 — Linux・npm の公開版（基準）

実施日時は 2026-11-03 21:07〜21:20 JST です。計画は [../README.md](../README.md)、所見は [../FINDINGS.md](../FINDINGS.md) にあります。

## 環境

| 項目 | 値 |
| --- | --- |
| OS | Linux（クラウドのコンテナ、x64） |
| Node.js | v22.23.4 |
| 起動した版 | pdf-reader-mcp 0.18.1 / pdf-verify-mcp 0.32.2 / pdf-writer-mcp 0.23.1 / pdf-spec-mcp 0.11.0（`eval/e2e` の `npm run setup` が `stack.json` の公開版を入れたもの） |
| クライアント | `@modelcontextprotocol/sdk` 1.30.0 の stdio クライアント（`eval/e2e/lib.mjs` の `start`） |
| qpdf | 11.9.0（検体を作るためだけに使用） |
| 日本語フォント | IPA ゴシック（`/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf`）を `PDF_WRITER_FONT` に指定 |
| veraPDF | **無し**（下の「実施しなかったこと」を参照）。verify は `PDF_VERIFY_VERAPDF=/nonexistent/verapdf` で起動し、組み込みの規則で検査した |
| 仕様書（`PDF_SPEC_DIR`） | **無し**。pdf-spec-mcp は設定の誤りの経路だけを試した |

## 検体

[`hosts/grok-build/fixtures/`](../../hosts/grok-build/fixtures/) の PDF 16 本に、次の 12 本を足しました（計 28 本）。

| 検体 | 作り方 |
| --- | --- |
| `enc-aes256-emptyuser.pdf` | qpdf。AES-256（R6）、利用者パスワードは空 |
| `enc-aes128-emptyuser.pdf` | qpdf。AES-128（R4）、利用者パスワードは空 |
| `enc-rc4-128-emptyuser.pdf` | qpdf（`--allow-weak-crypto`）。RC4 128 bit（R3）、利用者パスワードは空 |
| `enc-aes256-userpw.pdf` | qpdf。AES-256（R6）、利用者パスワードは `secret`（鍵を導けない） |
| `enc-rc4-128-userpw.pdf` | qpdf。RC4 128 bit（R3）、利用者パスワードは `secret`（鍵を導けない） |
| `pdf20-objstm.pdf` | qpdf。版を 2.0 にし、オブジェクトストリームを使う |
| `linearized.pdf` | qpdf。線形化 |
| `broken-truncated.pdf` | `long-report.pdf` の先頭 3,000 バイト |
| `empty.pdf` | 0 バイト |
| `not-a-pdf.pdf` | 17 バイトの文字列 |
| `does-not-exist.pdf` | 存在しないパス |
| `空白 と 日本語/スモーク 1.pdf` | `smoke.pdf` の複製。空白と日本語を含むパス |

暗号化の検体はすべて `smoke.pdf`（1 ページ）から作りました。

## 回したもの

| 対象 | 呼び出し | 結果 |
| --- | --- | --- |
| `eval/e2e`（S1〜S5・selfcheck） | 8 件 | 8 件とも通過。S3（描画の部品）と S4（veraPDF）も飛ばされずに通った |
| reader 18 ツールのうち 17 ツール（`read_url` を除く） | 28 検体 × 形式（json・markdown。形式の引数が無いツールは 1 通り）× 2 周 = 1,736 回 | 1 周 868 回のうちエラー 172 件（下表）。1 周目と 2 周目で応答の違い 0 件 |
| verify 全 7 ツール | 28 検体 × json・markdown × 2 周 = 784 回 | 1 周 392 回のうちエラー 42 件（下表）。1 周目と 2 周目で応答の違い 0 件 |
| writer 20 ツールのうち 14 ツール | 書き込み 48 回、読み戻し（reader・verify）35 回 | 下記 |
| spec 4 ツール | `PDF_SPEC_DIR` の 3 通りの誤り × 4 ツール | 3 通りとも `REGISTRY_ERROR` で、原因を区別して返した |

2 周目は、1 周目と逆の順番で、同じプロセスのまま呼びました。2 周とも応答が 1 文字も変わらなかったので、呼び出しの順番や回数で結果が変わる不具合（pdf-spec-mcp 0.4.0 で起きた形）は、reader と verify では見つかりませんでした。

### reader：検体の種類ごとの結果（json）

`ok` は成功、`img` は画像を返した、`E:` はエラーコードです。

| ツール | 通常 | 暗号化・空パスワード（3 種） | 暗号化・パスワード付き（2 種） | 途中で切れた | 0 バイト | PDF でない | 無いパス |
| --- | --- | --- | --- | --- | --- | --- | --- |
| get_page_count / get_metadata / read_images / summarize / inspect_annotations | ok | ok | ENCRYPTED_PDF | INVALID_PDF または ok | **INTERNAL_ERROR** | INVALID_PDF | DOC_NOT_FOUND |
| read_text / search_text | ok | ok | ENCRYPTED_PDF | INVALID_PDF または ok | **INTERNAL_ERROR** | INVALID_PDF | DOC_NOT_FOUND |
| render_page | img | img | ENCRYPTED_PDF | **INTERNAL_ERROR** | **INTERNAL_ERROR** | **INTERNAL_ERROR** | DOC_NOT_FOUND |
| inspect_structure / inspect_catalog / inspect_fonts / inspect_signatures / locate_objects | ok | ok | ok（「鍵を導けないので読めなかった」と書く） | ok | INVALID_PDF | INVALID_PDF | DOC_NOT_FOUND |
| inspect_tags / extract_tables / extract_structured_text | ok | ok | **ok（「タグが無い」と書く）** | ok | INVALID_PDF | INVALID_PDF | DOC_NOT_FOUND |
| compare_structure | ok | ok | ENCRYPTED_PDF | INVALID_PDF | INVALID_PDF | INVALID_PDF | DOC_NOT_FOUND |

`read_text` は `pages: "1-2"` で呼んだため、1 ページの検体では `INVALID_ARGUMENT`（範囲外）になりました。これは指定どおりの動作です。

### verify：検体の種類ごとの結果（json）

| ツール | 通常・暗号化（5 種すべて）・途中で切れた | 0 バイト | PDF でない | 無いパス |
| --- | --- | --- | --- | --- |
| verify_signatures / verify_integrity / detect_pades_level / identify_conformance / validate_conformance | ok | PARSE_FAILED | PARSE_FAILED | FILE_NOT_FOUND |
| validate_clauses | ok | PARSE_FAILED | PARSE_FAILED | **PARSE_FAILED** |
| evaluate_policy | `use_with_caution` | PARSE_FAILED | PARSE_FAILED | FILE_NOT_FOUND |

### writer：主な結果

| 試したこと | 結果 |
| --- | --- |
| 日本語の本文をフォント無しで | `FONT_REQUIRED`。`next_actions` に `fontPath` と `PDF_WRITER_FONT` の案内がある |
| 日本語の本文・Markdown・表を `PDF_WRITER_FONT` で | 成功。表は `tagged: true` と `title` 無しで `INVALID_ARGUMENT`（PDF/UA の題名の要求）。題名を付ければ通る |
| `tagged: true` と `pdfVersion: "2.0"` | `INVALID_ARGUMENT`。PDF/UA-2 は未実装と説明がある |
| 編集系（`set_metadata`・`rotate_pages`）を暗号化 5 種に | 5 種とも `ENCRYPTED_PDF`。パスワード付きも `INVALID_PDF` にならない（0.23.1 の修正を確認） |
| 編集系を署名付きに | `SIGNED_PDF` |
| 編集系を壊れた・0 バイト・PDF でない・無いパスに | `INVALID_PDF` / `INVALID_PDF` / `INVALID_PDF` / `DOC_NOT_FOUND` |
| 版 2.0・オブジェクトストリーム・線形化の検体を編集 | 成功 |
| 空白と日本語を含むパスの読み書き | 成功 |
| 存在しないフォルダーへの出力 | フォルダーを作って成功 |
| 入力と同じパスへの出力 | 成功。reader で読み直せた |
| 相対パスの `outputPath`、知らない引数 | `Input validation error: ...` という文字列で拒否（JSON の `code` は無い） |
| `create_markdown_pdf`（`title` と H1 が同じ、`tagged: true`） | `drawTitle` を指定しないと、構造に H1 が 2 つ並ぶ。`drawTitle: false` なら 1 つ |
| `ensure_pdfa`（3b・4）→ verify の組み込み規則 | 違反 0 件（`compliant: null`。組み込みの規則では適合を認定しない） |
| `create_text_pdf`（`tagged: true`）→ verify の PDF/UA-1 組み込み規則 | 違反 0 件 |

## 実施しなかったこと

| 項目 | 理由 | どこで確かめるか |
| --- | --- | --- |
| veraPDF での検査 | veraPDF のインストーラー（ダウンロードした jar）を実行する操作が、この環境の自動判定で止められた | E1（手元の Mac に Homebrew の veraPDF がある）、E5（Actions で入れる） |
| pdf-spec-mcp の本文の検索・引用 | 仕様書の PDF はこのリポジトリで配布できず、コンテナに置いていない | E1（手元の `pdf-spec-mcp-local` は 17 文書を読める） |
| 署名の信頼性の判定（trust anchor あり） | trust anchor の PEM が公開の検体に無い | E3（UC01・UC06） |
| `read_url` | ネットワーク越しの取得はこの試用の範囲外 | — |
| AES-GCM（AESV4）の暗号化 | qpdf が書けない。normativepdf の `encryptPdf` で作れるが、今回は作っていない | E1 で検体を足す |

## 再現の手順

`scripts/` の 4 本を、`eval/e2e` で `npm ci && npm run setup` を済ませた環境で動かします。スクリプトの中のパスは、このときの作業フォルダー（`/home/claude/e2/`）のままなので、動かす前に書き換えてください。

| スクリプト | 内容 |
| --- | --- |
| `sweep.mjs <reader\|verify>` | 全ツール × 全検体 × json・markdown を 2 周呼び、応答を保存する |
| `matrix.mjs <reader\|verify> [json\|markdown]` | 検体の種類ごとの結果を表にする |
| `writer.mjs` | writer で書き、reader と verify で読み戻す |
| `spec.mjs` | `PDF_SPEC_DIR` の誤り 3 通りで pdf-spec-mcp を呼ぶ |
