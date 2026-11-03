# 所見一覧

試用（[README.md](README.md)）で見つけた問題を 1 行ずつ書きます。各環境の詳しい結果は `E1/`〜`E6/` にあります。環境の列の「E2・E1」は、両方の環境で同じ結果が出たことを表します。

振り分けは次の 3 つです。

- **OpenSpec**：仕様の変更として、各リポジトリで直す
- **文書**：README・サイト・Skill の記述を直す
- **対応しない**：理由を書いて閉じる

「未定」は、振り分けをまだ決めていないものです。

## 一覧

| ID | 環境 | 対象 | 入力 | 想定 | 実際 | 振り分け | Issue |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | E2・E1 | pdf-reader-mcp 0.18.1 `inspect_tags`・`extract_tables`・`extract_structured_text` | 利用者パスワード付きの暗号化 PDF（鍵を導けない。`enc-aes256-userpw.pdf`・`enc-rc4-128-userpw.pdf`） | `inspect_fonts`・`inspect_signatures`・`inspect_structure` と同じく、「鍵を導けないので読めなかった。タグが無い文書ではない」と返す | `inspect_tags` は `isTagged: false` を返し、markdown では「This PDF is not tagged」と書く。`extract_tables` と `extract_structured_text` も「Document is not tagged」と書く。`extract_structured_text` は `scope.textExtraction.status` が `read` のまま | OpenSpec | [pdf-reader-mcp#39](https://github.com/shuji-bonji/pdf-reader-mcp/issues/39) |
| F-02 | E2・E1 | pdf-verify-mcp 0.32.2 `validate_conformance` | 鍵を導けない暗号化 PDF（`enc-aes256-userpw.pdf`） | 読めなかった範囲の規則は「検査できなかった」と分けて返す | 鍵を導ける検体（`enc-aes256-emptyuser.pdf`）と同じ応答を返す。`checkedRules: 13`・`passedRules: 10`、違反は `no-encryption`・`xmp-declaration`（「XMP に pdfaid が無い」）・`output-intent`（「OutputIntent が無い」）。`scope.authenticated: false` で 1 つもオブジェクトを読んでいないのに、XMP と OutputIntent が「無い」と書き、10 規則を「通過」に数えている。E1（veraPDF あり）では既定の `engine: "auto"` が `ENCRYPTED_PDF` のエラーを返し、`engine: "native"` で同じ一覧になる。veraPDF の有無で応答の種類が入れ替わる | OpenSpec | [pdf-verify-mcp#31](https://github.com/shuji-bonji/pdf-verify-mcp/issues/31) |
| F-03 | E2・E1 | pdf-verify-mcp 0.32.2 `evaluate_policy`・`verify_signatures` | 鍵を導けない暗号化 PDF（`enc-aes256-userpw.pdf`） | 署名を探せなかったことを返す。pdf-reader-mcp の `inspect_signatures` は「This is not a document without signatures」と書いている | `verify_signatures` は `signatures: []` だけを返し、探せなかったことを書かない。`evaluate_policy` は `POL-CAUTION-UNSIGNED`（「No signatures」）を発火する。判定（`use_with_caution`）は同じだが、理由が観測と食い違う。markdown の先頭には「key NOT derived — no object could be read」と書いてある | OpenSpec | [pdf-verify-mcp#31](https://github.com/shuji-bonji/pdf-verify-mcp/issues/31) |
| F-04 | E2・E1 | pdf-verify-mcp 0.32.2 `validate_clauses` | 存在しないパス | ほかの 6 ツールと同じく `FILE_NOT_FOUND` | `PARSE_FAILED`。`suggestion` に「構造上の違反として記録し、検査できなかったとは扱わない」と書いてあり、ファイルが無いことを文書の違反として扱うよう案内している | OpenSpec | [pdf-verify-mcp#32](https://github.com/shuji-bonji/pdf-verify-mcp/issues/32) |
| F-05 | E2・E1 | pdf-reader-mcp 0.18.1 の 8 ツール（`get_page_count`・`get_metadata`・`read_text`・`search_text`・`read_images`・`render_page`・`summarize`・`inspect_annotations`） | 0 バイトのファイル | ほかの 9 ツールと同じく `INVALID_PDF` | `INTERNAL_ERROR`（`detail.cause: InvalidPDFException`、「The PDF file is empty」） | 未定（OpenSpec の候補） | |
| F-06 | E2・E1 | pdf-reader-mcp 0.18.1 `render_page` | PDF でないファイル、途中で切れた PDF | `INVALID_PDF` | `INTERNAL_ERROR`（「File not in PDF format or corrupted」）。F-05 とまとめて直せる可能性がある | 未定（OpenSpec の候補） | |
| F-07 | E2 | pdf-reader-mcp 0.18.1（エラーと注記の文面） | 鍵を導けない暗号化 PDF | 利用者が取れる次の手を案内する | `locate_objects` は「Supply the user password」、`summarize` などの `hint` は「利用者パスワードが必要です」と書くが、reader のツールには `password` 引数が無い（verify の 3 ツールには有る） | 未定（文書か OpenSpec か） | |
| F-08 | E2・E1 | pdf-writer-mcp 0.23.1 の編集系 | 利用者パスワードが空の暗号化 PDF（AES-256・AES-128・RC4。reader と verify は読める） | 編集できないなら、その理由と次の手を案内する | `ENCRYPTED_PDF`。「Its streams are ciphertext and cannot be edited」「Decrypt the PDF first」と書くが、family の中に復号するツールは無い。鍵を導けない文書と同じ文面で、区別していない | 未定（文書か対応しないか） | |
| F-09 | E2 | 4 サーバーのエラーコード | 存在しないパス、PDF でないファイル | 同じ状況には同じコード | reader・writer は `DOC_NOT_FOUND`・`INVALID_PDF`、verify は `FILE_NOT_FOUND`・`PARSE_FAILED`。2026-08 の時点から割れたまま | 未定 | |
| F-10 | E2 | reader・writer のエラーの文面 | 各種のエラー | 1 つの応答の中は 1 つの言語 | `error` と `reason` は英語、`hint` と `next_actions[].reason` は日本語。spec は英語だけ。リポジトリの決まり（英語が基準）とも合わない | 未定（文書か OpenSpec か） | |
| F-11 | E2・E1 | pdf-writer-mcp 0.23.1 `create_markdown_pdf` | `title` と同じ文字列の H1 を持つ Markdown、`tagged: true`、`drawTitle` 指定なし | 構造に H1 が 1 つ | H1 が 2 つ並ぶ（`drawTitle: false` なら 1 つ）。0.23.0 で引数は足したが、既定は二重のまま。pdf-publish Skill が `drawTitle` を渡しているかは E3 で確かめる | 未定 | |
| F-12 | E2 | pdf-writer-mcp 0.23.1（入力検証） | 知らない引数、相対パスの `outputPath` | ほかのエラーと同じく JSON の `code` を持つ | `Input validation error: ...` という文字列だけ。MCP SDK の入力検証が先に返すため。2026-08 から既知 | 未定 | |
| F-13 | E2（E5 に関係） | `eval/e2e`（試用の装置） | — | Windows でも動く | `setup.mjs` は Windows で `npm.cmd` を `execFileSync` で起動する。Node.js 20.12 以降、`.cmd` を `shell` 指定なしで起動するとエラーになるため、Windows では `npm run setup` が止まる見込み。S4 も Windows では飛ばしている。E5 で確かめる | 未定（装置の修正） | |
| F-14 | E2・E1 | pdf-writer-mcp 0.23.1 `create_markdown_pdf`（`tagged: true`） | 箇条書きを含む Markdown | 記号「•」は `Lbl`、本文は `LBody` に入る（ISO 32000-1 Table 336：`LI` の子は `Lbl` か `LBody`、`Lbl` は箇条書きの記号を持つ。どちらも may/should の水準） | `LI` の下に `LBody` だけがあり、`LBody` の本文が「• 項目1」になる。reader の `extract_structured_text` も記号を本文として返す。veraPDF の PDF/UA-1 検査は通る | 未定 | |
| F-15 | E1 | pdf-spec-mcp 0.11.0 `compare_versions` | `section: "7.6"` | 題名が変わっただけの節は「移動」として対応づける | PDF 1.7 の 7.6.3.3「Encryption Key Algorithm」を「削除」、PDF 2.0 の 7.6.4.3「File encryption key algorithm」を「追加」に分けた。ツール説明に「題名で自動照合する」とあるので説明どおりの動作 | 未定（文書か対応しないか） | |

## E2 で見つからなかったもの

- reader と verify は、同じプロセスで順番を変えて 2 周呼んでも、応答が 1 文字も変わらなかった（reader 868 組・verify 392 組）
- 空白と日本語を含むパスは、読み書きとも通った
- writer は、パスワード付きの暗号化 PDF に `ENCRYPTED_PDF` を返した（0.23.0 までの `INVALID_PDF` は直っている）
- pdf-spec-mcp は、`PDF_SPEC_DIR` の「未設定」「存在しないフォルダー」「`${PDF_SPEC_DIR}` のまま渡された」の 3 通りを区別して返した
