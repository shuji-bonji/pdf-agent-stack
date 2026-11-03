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
| F-16 | E3 | pdf-specialist-plugin 0.7.0 の subagent（`agents/pdf-specialist`） | クラウドのセッションを Claude Desktop 経由で Mac に接続し、subagent に `get_page_count` を依頼 | subagent が plugin の MCP を呼ぶ | subagent に見えたツールは `Read`・`Glob`・`Skill` だけ。定義が許可する `mcp__plugin_pdf-*` に対し、このセッションでの名前は `mcp__remote-devices__plugin_pdf-*` で、合うツールが無い。手元の Claude Code で直接起動した場合に呼べるかは未確認 | 未定 | |
| F-17 | E3 | pdf-verify-mcp 0.32.2 `evaluate_policy`・`verify_integrity` | 署名 1 本と文書タイムスタンプ 1 本を持つ PDF（`contract-like-signed.pdf`） | 同じ名前の項目は同じものを数える | `evaluate_policy` の `facts.signatureCount` は 1（`facts.signatures[]` は 2 件）、`verify_integrity` の `signatureCount` は 2。前者は文書タイムスタンプを数えず、後者は数える | 未定 | |
| F-18 | E3 | pdf-publish Skill 0.7.1 | 本文が `# 題名` で始まる Markdown を、Skill の手順どおり `title` 付き・`tagged: true` で生成 | Skill が `drawTitle: false` を案内し、H1 は 1 つ | Skill は `drawTitle` に触れておらず（前提の版も writer 0.21.1）、H1 が 2 つ並ぶ。Skill は読み戻しで H1 の二重を確かめるよう書いているが、防ぎ方は書いていない。veraPDF の PDF/UA-1 は通る | 未定（文書） | |
| F-19 | E3 | pdf-writer-mcp 0.23.1 `ensure_pdfa`（`pdfa-4`・`pdfa-4f`） | PDF/UA-1 を宣言したタグ付きの PDF（`create_markdown_pdf` の `tagged: true` → `attach_file`） | 作成系が `tagged` と PDF 2.0 の組み合わせを拒否するのと同じく、拒否するか、`declarationRisks` で知らせる | ヘッダーを 2.0 にし、XMP の `pdfuaid:part=1` は残す。`identify_conformance` は PDF/A-4f と PDF/UA-1 の両方の宣言を返し、veraPDF は PDF/A-4f で適合、PDF/UA-1 で非適合（ISO 14289-1 6.1：ヘッダーは `%PDF-1.n`）。warning は PDF/A の CLAIMS だけで、`declarationRisks` は無い | OpenSpec | [pdf-writer-mcp#9](https://github.com/shuji-bonji/pdf-writer-mcp/issues/9) |
| F-20 | E3 | pdf-writer-mcp 0.23.1 `ensure_tagged` | `tagged: true` で作った PDF（すでに Lang・DisplayDocTitle・pdfuaid がある） | 足したものだけを `addedRequirements` に返す | `addedRequirements: ["Lang", "ViewerPreferences/DisplayDocTitle", "XMP(pdfuaid:part, dc:title)"]` を返す。入力の `identify_conformance` はすでに PDF/UA-1 を宣言していた。ファイルの中身は書き換わっている（md5 が違う） | 未定 | |
| F-21 | E3 | pdf-writer-mcp 0.23.1 の編集系 | 署名付きで、空パスワードで暗号化された官報 PDF に `set_metadata` | 編集できない理由を 1 回で返す | 1 回目は `SIGNED_PDF` で、`next_actions` が「`preserveSignatures: true` で再試行」と案内する。案内どおりに再試行すると `ENCRYPTED_PDF`。署名の確認が暗号化の確認より先にある | 未定 | |
| F-22 | E3 | Claude Desktop の plugin（pdf-writer・pdf-spec） | plugin から起動した writer と spec | 環境変数がサーバーに届く | writer には `PDF_WRITER_FONT` が届かず `FONT_REQUIRED`（`fontPath` で回避できる）。spec には `PDF_SPEC_DIR` が `${PDF_SPEC_DIR}` のまま届き `REGISTRY_ERROR`。2026-10-21 時点の記録と同じで、Grok Build（#37）と同じ形 | 未定（文書） | |
| F-23 | E5 の準備（Linux・公開版） | pdf-writer-mcp 0.23.1 `set_metadata` | `/Resources` の無いページを持つ PDF（`eval/e2e` の `minimalPdf`）を `inputPath`、別のファイルを `outputPath` | 書き出しを拒否し、どのファイルの何が条件を満たさないかを返す | 拒否は ISO 32000-2 §7.7.3.3（Table 31：`Resources` は Required; inheritable）のとおり。ただしエラー文は `Failed to write "<inputPath>"` で、書いていない入力側のパスを「書けなかった」ファイルとして名指す。出力先のパスはどこにも出ない | 未定 | |

## E3 で見つからなかったもの

- UC01〜UC10 で境界違反は 0 件（spec に検証対象を渡す、reader の観測を真正性に伸ばす、writer の成功を適合と言う、「準拠」と書く、未実施を passed にする、のいずれも無し）
- writer の `ENCRYPTED_PDF` を、署名付きの官報で初めて観測できた（ただし F-21 の 2 回目）

## E2 で見つからなかったもの

- reader と verify は、同じプロセスで順番を変えて 2 周呼んでも、応答が 1 文字も変わらなかった（reader 868 組・verify 392 組）
- 空白と日本語を含むパスは、読み書きとも通った
- writer は、パスワード付きの暗号化 PDF に `ENCRYPTED_PDF` を返した（0.23.0 までの `INVALID_PDF` は直っている）
- pdf-spec-mcp は、`PDF_SPEC_DIR` の「未設定」「存在しないフォルダー」「`${PDF_SPEC_DIR}` のまま渡された」の 3 通りを区別して返した
