# 横断サマリ（2026-11）

- 実施日時: 2026-11-04。各報告書の実施日時は 02:01 JST（`SETUP.md`）から 17:21 JST（`SUBAGENT.md`）
- ホスト: Grok Build 1.0.70（`reports/2026-11/SETUP.md` の `grok inspect`。この SUMMARY では再計測していない）
- パッケージ: pdf-reader-mcp 0.18.1、pdf-verify-mcp 0.32.2、pdf-writer-mcp 0.23.1、pdf-spec-mcp 0.11.0、veraPDF 1.30.0（いずれも SETUP。この SUMMARY では再計測していない）
- Skill: pdf-read 0.2.3、pdf-trust 0.8.3、pdf-publish 0.7.1。Agent pdf-specialist 0.7.0（SETUP）
- 比較した 2026-09: キット側 `eval/hosts/grok-build/reports/SUMMARY.md`。そちらのホストは Grok Build 1.0.30。verify は 0.26.1（UC10 / UC04 再走）、writer は 0.21.1、spec は 0.6.0、reader は 0.15.1
- この SUMMARY は各報告書の段階・verdict・compliant・改善提案を並べたものである。段階の語は書き換えていない

`SUPPLEMENT.md` と `SUBAGENT.md` に 4 段階の欄は無い。

## 1. ユースケース評価

2026-09 の `SUMMARY.md` に、UC ごとの境界違反の件数は無い。あるのは横断の 5 行で、どれも「なし」である。2026-11 の件数は、各 UC の境界違反 6 項目のうち「あり」の数である。6 項目とも「なし」なので 0 である。

| ID | 名称（2026-09 の表） | 2026-09 の段階 | 2026-09 の境界 | 2026-11 の段階 | 2026-11 の境界違反 |
| --- | --- | --- | --- | --- | --- |
| UC01 | 受入監査 | 実務で使える | 横断表はなし。UC ごとの件数は無い | 条件付きで使える | 0 |
| UC02 | 納品パイプライン | 実務で使える | 同上 | 実務で使える | 0 |
| UC03 | 長期保存 PDF/A | 実務で使える | 同上 | 実務で使える | 0 |
| UC04 | アクセシビリティ | 実務で使える | 同上 | 実務で使える | 0 |
| UC05 | 仕様調査 | 実務で使える | 同上 | 実務で使える | 0 |
| UC06 | 一括監査 | 実務で使える | 同上 | 条件付きで使える | 0 |
| UC07 | 読み取り | 実務で使える | 同上 | 実務で使える | 0 |
| UC08 | 電帳法寄り請求書 | 実務で使える | 同上 | 実務で使える | 0 |
| UC09 | 宣言と検証 | 実務で使える | 同上 | 実務で使える | 0 |
| UC10 | 暗号化と未実施 | 条件付きで使える | 同上 | 実務で使える | 0 |

段階が変わったのは UC01、UC06、UC10 である。

### UC01

判定は変わっていない。段階の差は評価の付け方である。

両方の報告書にある `evaluate_policy` の値は次のとおり。

| ファイル | profile | verdict | firedRules |
| --- | --- | --- | --- |
| contract-unsigned.pdf | contract | `human_review_required` | `POL-REVIEW-UNSIGNED-REQUIRED` |
| contract-like-signed.pdf | contract | `use_with_caution` | `POL-CAUTION-TRUST-NOT-EVALUATED`、`POL-CAUTION-REVOCATION-UNKNOWN` |
| gazette-or-gov.pdf | government | `use_with_caution` | 上と同じ 2 件 |

2026-09 は 3 検体を番号付き手順で扱い、段階は実務で使える。理由は、未署名必須・身元未評価・失効不明・PDF/A 未実施を取り違えず報告でき、`trust_and_use` に届かないのはアンカー未配置という入力条件であり、ホストが判定を壊したのではない、と書いている。

2026-11 の番号付き手順は未署名契約と官報の 2 検体である。`contract-like-signed.pdf` は末尾の補足で、上の表と同じ `verdict` と ruleId・reason である。段階は条件付きで使える。理由は、アンカーが無く Signature1 の `trust` が `not_evaluated` のまま `use_with_caution` で止まっていること、官報の PDF/A が `ENCRYPTED_PDF` で `compliant` が無いこと、を欠ける条件として書いている。PDF/UA の `compliant` false は、2026-11 の UC01 が書いた結果である。2026-09 の UC01 の実行ログに、その `pdfua-1` の `compliant` は無い。

### UC06

重なる 5 件の `verdict` と ruleId は変わっていない。段階の差は評価の付け方である。

| ファイル | 2026-09 の profile | 2026-11 の profile | verdict | firedRules |
| --- | --- | --- | --- | --- |
| batch-unsigned-contract.pdf | contract | contract | `human_review_required` | `POL-REVIEW-UNSIGNED-REQUIRED` |
| batch-plain-invoice.pdf | financial | financial | `use_with_caution` | `POL-CAUTION-UNSIGNED` |
| batch-ua-report.pdf | general | general | `use_with_caution` | `POL-CAUTION-UNSIGNED` |
| batch-gov.pdf | government | government | `use_with_caution` | `POL-CAUTION-TRUST-NOT-EVALUATED`、`POL-CAUTION-REVOCATION-UNKNOWN` |
| batch-tampered.pdf | contract | general（2026-11 はモデルの判断と書いている） | `reject` | `POL-REJECT-INVALID` |

2026-09 は invoice を「PDF/A-3b COMPLIANT でも `POL-CAUTION-UNSIGNED`」と書いている。2026-11 は同じファイルの `facts.conformance` を `flavour` `PDF/A-3b`、`engine` `verapdf`、`compliant` true と書いている。`compliant` の真偽は、両方の書き方で true 側である。

2026-09 の段階は実務で使える。理由は、5 件の 4 値が分かれ、人が見るのは 2 個票で足りる、と書いている。2026-11 はフォルダ 11 件を扱い、段階は条件付きで使える。理由は、`trust_anchors` が無く署名のある caution が `POL-CAUTION-TRUST-NOT-EVALUATED` で止まっていること、`batch-gov.pdf` の PDF/A は advisory が未完了で個別採点は未実施であること、法令根拠は未取得であること、を欠ける条件として書いている。

### UC10

同じ呼び出しの `verdict` とエラーコードは変わっていない。段階の差は評価の付け方である。

官報、profile `government` の `evaluate_policy` は、両方とも `verdict` `use_with_caution`、ruleId は `POL-CAUTION-TRUST-NOT-EVALUATED` と `POL-CAUTION-REVOCATION-UNKNOWN`。`validate_conformance`（`pdfa-3b`、engine auto）は、両方とも `code` `ENCRYPTED_PDF` で、`compliant` は応答に無い。`set_metadata` は、両方とも `code` `SIGNED_PDF`。

2026-09 は続けて engine `native` を呼び、`compliant` false、`failedRules` 3 と書いている。2026-11 の手順は、この native を未実施と書いている。`compliant` が false から別の値に変わった、という記録は無い。

2026-09 の段階は条件付きで使える。理由は、PDF/A の未実施が `ENCRYPTED_PDF` として切れる一方、writer の `ENCRYPTED_PDF` が署名付き検体では観測できないこと、と書いている。2026-11 の段階は実務で使える。理由は、`ENCRYPTED_PDF` に `compliant` が無く、`evaluate_policy` が `use_with_caution` と 2 つの ruleId を返し、writer が `SIGNED_PDF` と `next_actions` を返したので、失敗のコードが残り、測れた範囲と測れなかった範囲を分けて次の判断ができる、と書いている。

### 段階が同じ UC で、報告書が両方に書いた compliant

段階の理由は書いていない。数だけを並べる。

| 対象 | 2026-09 | 2026-11 |
| --- | --- | --- |
| UC02 `pdfa-3b` | `compliant` true、146/146 | `compliant` true、146/146 |
| UC02 `pdfua-1` | `compliant` true、106/106 | `compliant` true、106/106 |
| UC03 `pdfa-4f` | `compliant` true、109/109 | `compliant` true、109/109 |
| UC03 未埋め込みの `pdfa-3b` | `compliant` false、145/146。ruleId `ISO 19005-3:2012 6.2.11.4.1-1` | 同じ `compliant` false、145/146、同じ ruleId |
| UC04 タグ付き `pdfua-1` | `compliant` true、106/106 | `compliant` true、106/106 |
| UC04 タグ無し `pdfua-1` | `compliant` false、99/106。ruleId に `7.21.4.1-1` がある | `compliant` false、`passedRules` 100、`failedRules` 6。ruleId は 7.1-10、7.1-11、7.1-8、7.1-3、6.2-1、7.2-34。`7.21.4.1-1` は 2026-11 の一覧に無い |
| UC08 `pdfa-3b` | `compliant` true、146/146 | `compliant` true、146/146 |
| UC09 `pdfa-3b` | `compliant` false、145/146。同じフォントの ruleId | `compliant` false、`failedRules` 1。ruleId は UC09 の実行ログが `ISO 19005-3:2012 6.2.11.4.1-1` と書いている |

UC03 の `pdfa-4f` ファイルに対する `pdfua-1` は、2026-11 が `compliant` false、105/106、ruleId `ISO 14289-1:2014 6.1-1` と書いている。2026-09 の UC03 の実行ログに、この `pdfua-1` の行は無い。

## 2. 発火した Skill と subagent

「発火」は各報告書の第 9 節（UC01 も第 9 節）の書き方に従う。版は報告書が書いたものである。

| 報告書 | pdf-read | pdf-trust | pdf-publish | 同梱の pdf / docx | pdf-specialist |
| --- | --- | --- | --- | --- | --- |
| UC01 | 使っていない | 0.8.3。受入監査 | 使っていない | 使っていない | 委譲していない |
| UC02 | 使っていない | 使っていない | 0.7.1 | 使っていない | 委譲していない |
| UC03 | 使っていない | 0.8.3。T3 の段で `detect_pades_level`。受入監査一式は呼んでいない | 0.7.1 | 使っていない | 委譲していない |
| UC04 | 使っていない | 使っていない | 0.7.1 | 使っていない | 委譲していない |
| UC05 | 発火していない | 発火していない | 発火していない | 読んでいない | 委譲していない。呼び出しは pdf-spec の MCP |
| UC06 | 使っていない | 0.8.3 | 使っていない | 使っていない | 委譲していない |
| UC07 | 0.2.3 | 使っていない | 使っていない | 使っていない | 委譲していない |
| UC08 | 使っていない | 使っていない | 0.7.1 | 使っていない | 委譲していない |
| UC09 | 使っていない | 使っていない | 0.7.1 | 使っていない | 委譲していない |
| UC10 | 0.2.3。reader の手順 | 使っていない。`evaluate_policy` などは MCP を直接 | 使っていない | 使っていない | 委譲していない |
| SUPPLEMENT | Skill 名は書いていない。呼んだのは `summarize` と `detect_pades_level` | 同左 | 同左 | 書いていない | 委譲していない |
| SUBAGENT | subagent は `SKILL.md` を読んだ。抽出手順は未実施 | subagent が Phase 0〜5 を実行した。frontmatter に版は無い、と SUBAGENT が書いている | `SKILL.md` を読んだ。生成手順は未実施 | 書いていない | 親が `spawn_subagent`、`subagent_type` `pdf-specialist:pdf-specialist` で 1 回委譲した |

## 3. 新しく見つけた問題

2026-09 の同じ UC の実行ログか改善提案に、同じ観察が既にあるものは入れていない。`ensure_pdfa` の応答 `flavour` が `3b` であること、抽出で「株式会社」と「請求先」が詰まること、官報の auto が `ENCRYPTED_PDF` であること、官報の `set_metadata` が `SIGNED_PDF` であることは、2026-09 に書いてある。

想定の欄が報告書に無い行は「想定の欄は無い」と書いた。

| 出典 | 入力 | 想定 | 実際 |
| --- | --- | --- | --- |
| UC01 改善提案 | 官報の `evaluate_policy` と `verify_integrity` | 想定の欄は無い | `facts.signatureCount` 1、`facts.signatures` 2 件、`verify_integrity.signatureCount` 2。文書タイムスタンプは `isDocumentTimestamp` true。`signaturesTruncated` は null |
| UC01 改善提案 | 官報のオブジェクト 65 | 想定の欄は無い | verify は type null / changeClass unknown。`locate_objects` は type `DocTimeStamp` |
| UC01 改善提案 | 官報の `validate_conformance`。flavour 無しの PDF/A と、`flavour` `pdfua-1` | 想定の欄は無い | PDF/A は `ENCRYPTED_PDF` で veraPDF を起動しない。`pdfua-1` は同じ暗号化ファイルで、復号した書き換えに対して veraPDF を起動する。notes がその区別を書いている、と UC01 が書いている |
| UC01、UC06 | `search_tool`。クエリ `pdf-verify evaluate_policy` | 1 件目がそのサーバのツール | 先頭は `pdf-spec__get_requirements`。そのツールは呼んでいない |
| UC02 | `search_tool`。クエリ `extract_structured_text` | ツール名そのものが 1 件目 | 上位は `summarize` と `extract_tables`。スキーマは pdf-reader-mcp のソースで確認してから呼んだ |
| UC07 | `search_tool`。クエリ `pdf-reader read_text pages scope` | ツール名 `read_text` が 1 件目 | 1 件目は `read_url`。2 回目で `read_text`。1 回目は呼んでいない |
| UC01 改善提案 | pdf-trust の contract。署名 0 | 想定の欄は無い | `detect_pades_level` を呼ぶかが必須ではなく推奨の行にある。この実行では呼んでいない |
| UC02 改善提案 | 指示書の手順 1 と、手順 2・想定表 | 手順 1 はフォント指定を先に試す。手順 2 はフォント無しなら `FONT_REQUIRED` | 2026-11 はフォント無しの 1 回目が `code` `FONT_REQUIRED`。`next_actions` の `fontPath` で 1 回復帰した |
| UC03 実行ログと改善提案 | `ensure_pdfa` `pdfa-4f` のあと、同じファイルの `validate_conformance` `pdfua-1` | 実行ログの想定は flavour ごとに `engine` と `compliant`。`declarationRisks` があり得る | `pdfa-4f` は `compliant` true、109/109。`pdfUa.part` は `1` のまま。`pdfua-1` は `compliant` false、105/106、ruleId `ISO 14289-1:2014 6.1-1`。`declarationRisks` フィールドは無い |
| UC03 | 3b 出力を入力にした `ensure_pdfa` `pdfa-4f` | `wasDeclared` があり得る | `wasDeclared` true。前の宣言は part 3 conformance B。応答は part を分けない、と UC03 が書いている |
| UC03 | 4f ファイルの `get_metadata` | 実行ログの想定は `pdfVersion` | `pdfVersion` `2.0`。`title` は null。改善提案は producer と日付も null、と書いている。`addedRequirements` は Info 辞書の削除 |
| UC04 改善提案 | `ensure_tagged`。呼ぶ前の identify は `pdfUa.part` `1` | 想定の欄は無い | `addedRequirements` は Lang、DisplayDocTitle、XMP。`wasTagged` true、`createdStructure` false。`bytes` は 26196 のまま、md5 は `cdb5423d450539735040fd15b9f657e4` から `552072443c236a25047a9a31e246d4aa` |
| UC04 改善提案 | 不合格側の検体 | 指示書は「UC01 の未署名契約書、または `ua-untagged.pdf`」 | 選んだのは `ua-untagged.pdf`。未署名契約書は未使用 |
| UC05 改善提案 | `search_spec`。`query` `document timestamp`、`max_results` 10 | 実行ログの想定は 10 件 | `totalResults` 10。打ち切りフィールドは無い |
| UC05 改善提案 | `search_spec` / `get_requirements` / `get_section`。`spec` は省略 | 想定の欄は無い | 使った spec id が応答に無い |
| UC05 改善提案 | `get_section` `12.8.5` | 手順は本文の長文転記を禁じている | 見出しと要求のほか、例のオブジェクト記法まで返す |
| UC05 改善提案 | 指示書のサイト実測版 | サイト実測は pdf-spec-mcp v0.6.0 | このホストは 0.11.0。件数は 10 と shall 8 / may 2 |
| UC06 改善提案 | `evaluate_policy` を複数。`general` 4 件は同時 | 想定の欄は無い | 応答に `file_path` が無い。`scope.objects` 以外ではどのパスか分からなかった |
| UC06 実行ログの手順 20 | 対応付けのため `scan-like.pdf` に profile `legal`、`scan-no-text-layer.pdf` に `medical`、`long-report.pdf` に `contract` | この `verdict` は採用しない | `legal` は `use_with_caution` / `POL-CAUTION-UNSIGNED`。`medical` と `contract` は `human_review_required` / `POL-REVIEW-UNSIGNED-REQUIRED`。サマリの判定は `general` の `use_with_caution` / `POL-CAUTION-UNSIGNED` のまま |
| UC06 改善提案 | `batch-gov.pdf` の `evaluate_policy` | 想定の欄は無い | PDF/A 未完了は英文の advisory だけで、`code` が無い。UC01 の同じバイト列の `validate_conformance` は `ENCRYPTED_PDF`。この UC ではそのコードを再取得していない |
| UC06 改善提案 | pdf-trust の一括と、financial / government の参照 | 想定の欄は無い | 一括は深掘りを問題ファイルに限る。参照は PDF/A と PAdES の個別呼び出しを必須にしている。この実行は一括側に従い、個別呼び出しは未実施 |
| UC07 改善提案 | `get_page_count` | 実行ログはページ数 | 戻りは数値 `126` だけ。`scope` が無い |
| UC07 改善提案 | `render_page` の成功 | 視覚読み | 成功応答のテキストに `scope` が無い |
| UC07 改善提案 | データ準備の `scan-like.pdf` | 番号付き手順には名前が無い | 本編の reader は未実施。SUPPLEMENT がキット側の同じ名前を `summarize` し、`textExtractability` `extracted` と書いている |
| UC08 改善提案 | `inspect_structure` | catalog の AF / Names | `Names` `Dict{1 entries}`、`AF` `Array[1]`、EmbeddedFile 1 まで。埋め込み名と AFRelationship は展開されない。`relationship` `Data` は writer の応答にしか無い |
| UC08 改善提案 | pdf-writer の `ensure_pdfa` / `attach_file` の説明文 | 本 UC の手順は flavour `pdfa-3b` | 説明に「電子帳簿保存法」と、添付があるときの `pdfa-4f` が同じ話題として出る。検証は手順の flavour のまま |
| UC09 改善提案 | `create_text_pdf`。日本語、`fontPath` 無し | `next_actions` はフォント指定での再試行。データ準備は英語本文への切替 | `FONT_REQUIRED` のあと、`fontPath` ではなく英語本文で同じパスへ書き直した。2 回目はエラーコード無し |
| UC09 改善提案 | pdf-publish と、指示書の前半 | Skill は `ensure_pdfa` と `validate_conformance` を不可分と書く。指示書は前半で採点を省く | 前半の `validate_conformance` は未実施。後半は `engine` `verapdf`、`compliant` false、`failedRules` 1 |
| UC10 補足 | `enc-aes256-userpw.pdf` と `enc-rc4-128-userpw.pdf` の `inspect_tags` と `extract_tables` | 想定の欄は無い | `isTagged` false。暗号化で読めなかった、という文は無い。`inspect_signatures` の note は、カタログを読めず、署名が無い文書ではない、と書く |
| UC10 補足 | 同じ 2 ファイルの `evaluate_policy`。profile `general` | 想定の欄は無い | `verdict` `use_with_caution`。`firedRules` の reason は `No signatures`。`scope.authenticated` は false。advisory は、相互参照表の 11 オブジェクトを読めず件数は下限、と書く |
| UC10 補足 | `validate_clauses`。`file_path` `/Users/bonji/pdf-agent-stack-eval/no-such-file.pdf` | 想定の欄は無い | `code` `PARSE_FAILED`。message は ENOENT。suggestion は、message が名指しする構造条文の違反として記録せよ、と言う。message に条番号は無い |
| UC10 補足 | `set_metadata`。`inputPath` は `enc-aes256-userpw.pdf`。`outputPath` は `out/2026-11/enc-meta.pdf` | 想定の欄は無い。2026-09 の UC10 は、署名無しの暗号化なら writer の `ENCRYPTED_PDF` が測れる、と書いている | `code` `ENCRYPTED_PDF`。hint は Decrypt the PDF first。`path` は無い。再試行はしていない |

`SUBAGENT.md` は、Trust Report の `verdict` `use_with_caution` と上の 2 つの ruleId・reason が、UC01 の補足と一致した、と書いている。境界違反 6 項目はなし。問題としての改善提案の行は無い。

## 4. 改善提案（2026-11 の各報告書）

同じ観察は 1 行にまとめた。提案の文は各 UC のままである。

| 種別 | 対象 | 出た UC | 観察 | 提案 |
| --- | --- | --- | --- | --- |
| MCP の応答 | pdf-verify-mcp `evaluate_policy` | UC01 | 官報で `facts.signatureCount` 1、`signatures` 2、`verify_integrity.signatureCount` 2 | 署名数のフィールドを 1 つに決めるか、文書タイムスタンプを除くならその旨を示す |
| MCP の応答 | pdf-verify-mcp と pdf-reader-mcp | UC01 | オブジェクト 65 は verify が type null、reader が `DocTimeStamp` | verify 側でも DocTimeStamp として返す |
| MCP の応答 | pdf-verify-mcp `validate_conformance` | UC01 | 暗号化官報で PDF/A は `ENCRYPTED_PDF`、`pdfua-1` は復号した書き換えを採点する | どちらが受領ファイルを採点しないかを、エラーと notes の対で維持する |
| MCP の応答 | pdf-verify-mcp `evaluate_policy` | UC06 | 応答に `file_path` が無い | 応答に入力パスを返す |
| MCP の応答 | pdf-verify-mcp `evaluate_policy` | UC06 | government の PDF/A 未完了は advisory だけで `code` が無い | advisory にエラーコードを載せる |
| MCP の応答 | pdf-verify-mcp `validate_conformance` | UC10 | 官報は `ENCRYPTED_PDF`。`compliant` も `engine` も返らない | この形のまま。`compliant: true` を足さない |
| MCP の応答 | pdf-verify-mcp `evaluate_policy` | UC10 | 利用者パスワード付きで `authenticated` false なのに reason は `No signatures` | reason を、鍵が導けていないときの文言と分ける |
| MCP の応答 | pdf-verify-mcp `validate_clauses` | UC10 | 存在しないパスは `PARSE_FAILED` / ENOENT。suggestion は構造違反として記録せよと言う | ENOENT の suggestion を、ファイルが無い、に変える |
| MCP の応答 | pdf-writer-mcp `ensure_pdfa` | UC02、UC03、UC08、UC09 | 入力 `pdfa-3b` / `pdfa-4f` に対し応答は `3b` / `4f` | 入力と同じ文字列を返す |
| MCP の応答 | pdf-writer-mcp `ensure_pdfa` | UC03 | 4f のあと `pdfUa.part` は 1。`pdfua-1` は `compliant` false（6.1-1）。`declarationRisks` フィールドが無い | ヘッダが 2.0 になり PDF/UA-1 の採点が落ちることを `declarationRisks` に出す |
| MCP の応答 | pdf-writer-mcp `ensure_pdfa` | UC03 | 3b から 4f で `wasDeclared` true。前は part 3 conformance B | 「何かの pdfaid があった」と「要求した flavour と同じ宣言があった」を分ける |
| MCP の応答 | pdf-writer-mcp `ensure_tagged` | UC04 | 既に `pdfUa.part` 1。`addedRequirements` が返り、bytes は同じで md5 が変わった | `addedRequirements` を「新しく書いた」と「既にあった」に分ける |
| MCP の応答 | pdf-writer-mcp `set_metadata` | UC10 | 暗号化かつ署名のある官報で、先に `SIGNED_PDF` | どちらの code が先かを応答に併記する |
| MCP の応答 | pdf-reader-mcp `extract_structured_text` | UC02 | 同じ P の複数行が 1 文字列になり、`株式会社` と `請求先` の区切りが無い | 行境界を空白 1 つにするか、失ったことを `scope` に出す |
| MCP の応答 | pdf-reader-mcp `get_metadata` | UC03 | 4f のあと `title` などが null。`addedRequirements` は Info 辞書の削除 | Info が無いとき、題名が XMP にあるならその値を返す |
| MCP の応答 | pdf-reader-mcp `get_page_count` | UC07 | 戻りは数値 `126` だけ。`scope` が無い | `scope` を付けるか、数値が仕様だと案内に書く |
| MCP の応答 | pdf-reader-mcp `render_page` | UC07 | 成功応答のテキストに `scope` が無い | 失敗した読みが無いときも `scope` を返す |
| MCP の応答 | pdf-reader-mcp `inspect_structure` | UC08 | 添付の名前と AFRelationship が展開されない | 名前と関係値を reader のフィールドとして返す |
| MCP の応答 | pdf-reader-mcp `inspect_tags` / `extract_tables` | UC10 | 利用者パスワード付きで `isTagged` false。読めなかった、という文が無い | 鍵が導けないときは `isTagged` を null にし、note を `inspect_signatures` と同じ区別にする |
| MCP の応答 | pdf-spec-mcp `search_spec` | UC05 | `totalResults` が `max_results` と同じ 10。打ち切りフィールドが無い | ヒット総数と、返した件数を分ける |
| MCP の応答 | pdf-spec-mcp `search_spec` / `get_requirements` / `get_section` | UC05 | 使った spec id が応答に無い | 既定でも `spec` を返す |
| MCP の応答 | pdf-spec-mcp `get_section` | UC05 | 12.8.5 が例のオブジェクト記法まで返す | 見出しと子節番号だけのモード |
| Skill の編成 | pdf-trust contract | UC01 | 署名 0 のとき `detect_pades_level` が推奨の行にある | 署名 0 なら呼ばない、と references に一行書く |
| Skill の編成 | pdf-trust | UC06 | 一括の深掘り制限と、financial / government の個別呼び出し必須が並ぶ | 一括のとき `facts.conformance` と advisory で足りる検査を参照側で名指しする |
| Skill の編成 | pdf-publish | UC09 | Skill は `ensure_pdfa` と `validate_conformance` を不可分と書く。UC09 は前半で採点を省く | 省略した段を「スキップ」と書き、納品文は採点のあとだけにする |
| ホスト適合 | Grok Build `search_tool` | UC01、UC02、UC06、UC07 | ツール名を含むクエリの 1 件目が、別のツールだった。呼んではいない | サーバ名またはツール名の 1 件目が、そのツールになる |
| 文書 | UC02 指示書 | UC02 | フォントを先に試す手順と、フォント無しなら `FONT_REQUIRED` が並ぶ | 1 回目は `fontPath` を渡さない、と手順 1 に書く |
| 文書 | UC04 指示書 | UC04 | 不合格側が未署名契約書または `ua-untagged.pdf` | どちらを既定にするかを手順 6 に一行書く |
| 文書 | UC05 指示書 | UC05 | サイト実測の版は v0.6.0。このホストは 0.11.0 | 実測版を、期待値の版と分けて書く |
| 文書 | UC07 指示書 | UC07 | `scan-like.pdf` はデータ準備の表だけにある | 対照を `summarize` するかどうかを手順に一行書く |
| 文書 | pdf-writer の説明文 | UC08 | 「電子帳簿保存法」と `pdfa-4f` が同じ話題に出る。手順は `pdfa-3b` | `-4` を選んだときに非 PDF の添付があれば `pdfa-4f`、と書く範囲に限る |
| 検体 | UC09 のデータ準備 | UC09 | `FONT_REQUIRED` の `next_actions` はフォント再試行。データ準備は英語への切替 | どちらに従うかを手順 1 に書く |
