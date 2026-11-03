# E3 — Mac・Claude の plugin と Skill

実施日時は 2026-11-03 23:30〜23:55 JST です。計画は [../README.md](../README.md)、所見は [../FINDINGS.md](../FINDINGS.md) にあります。

## 環境

| 項目 | 値 |
| --- | --- |
| ホスト | Claude（クラウドのセッションを、Claude Desktop 経由で手元の Mac に接続） |
| MCP | Claude Desktop に入れた plugin の 4 サーバー。セッションからは `mcp__remote-devices__plugin_pdf-*` という名前で見える |
| 版 | E1・E2 と同じ（reader 0.18.1 / verify 0.32.2 / writer 0.23.1 / spec 0.11.0） |
| Skill | pdf-trust・pdf-publish（このセッションで読み込み、手順に従って MCP を呼んだ） |
| veraPDF | 1.30.0（Homebrew。plugin の verify も PATH から見つけた） |
| 検体 | [`hosts/grok-build/fixtures/`](../../hosts/grok-build/fixtures/)（官報 2 件は手元にだけある）と `docs/specimens/`（非公開） |
| 出力 | `pdf-agent-stack/_to_delete/trial-e3/`（git の管理外） |

## 環境で起きたこと

| 項目 | 結果 |
| --- | --- |
| pdf-specialist subagent | **plugin のツールを 1 つも呼べなかった**。subagent に見えたツールは `Read`・`Glob`・`Skill` だけ。subagent の定義が許可しているのは `mcp__plugin_pdf-*` で、このセッションでの名前（`mcp__remote-devices__plugin_pdf-*`）と合わない（F-16）。そのため E3 は、Skill をこのセッションで直接動かす形に切り替えた |
| writer の日本語フォント | plugin の writer には `PDF_WRITER_FONT` が渡っておらず、最初の呼び出しが `FONT_REQUIRED`。`next_actions` どおり `fontPath` を付けて 1 回で通った（F-22） |
| pdf-spec | plugin の pdf-spec には `PDF_SPEC_DIR` が `${PDF_SPEC_DIR}` のまま渡り、`REGISTRY_ERROR`。エラーの文面は原因を正しく名指ししている。UC05 は手元の `pdf-spec-mcp-local` で代わりに確かめた（F-22） |

## UC ごとの結果

段階は [`00-evaluation-criteria.md`](../../hosts/grok-build/00-evaluation-criteria.md) の 4 段階です。

| UC | 段階 | 主な観測 |
| --- | --- | --- |
| UC01 受入監査 | 実務で使える | 未署名の契約（contract）は `human_review_required`（`POL-REVIEW-UNSIGNED-REQUIRED`）。署名付きは `use_with_caution`（`POL-CAUTION-TRUST-NOT-EVALUATED`・`POL-CAUTION-REVOCATION-UNKNOWN`）。官報（government）も `use_with_caution` で、PDF/A は「not performed」と advisory に出る。2 回呼んで同じ判定。`verify_integrity` は `revisionChain: complete`・`revisionCountAgreement: agree`。`evaluate_policy` の `facts.signatureCount` は 1、`verify_integrity` の `signatureCount` は 2（F-17） |
| UC02 納品 | 実務で使える（条件付き：H1 の二重） | 生成 → `attach_file`（Data）→ `ensure_pdfa`（3b）→ 読み戻し → veraPDF。PDF/A-3b は 146/146、PDF/UA-1 は 106/106 で適合。`ensure_pdfa` は CLAIMS の warning を返した。**Skill の手順どおりに作ると H1 が 2 つ並ぶ**。pdf-publish Skill は `drawTitle: false` を案内していない（F-18） |
| UC03 PDF/A と LTV | 条件付きで使える | 添付付きを `pdfa-4f` にすると PDF/A-4f は 109/109 で適合、素の `pdfa-4` で測ると 6.7.3-3・6.9-3 で非適合（想定どおり）。**ただし PDF/UA-1 を宣言したタグ付きの入力に -4f を掛けると、ヘッダーが 2.0 になるのに PDF/UA-1 の宣言が残り、veraPDF の PDF/UA-1 で非適合（ISO 14289-1 6.1）**。writer は警告も `declarationRisks` も返さなかった（F-19）。フォント未埋め込みの検体は `declarationRisks: FONT_NOT_EMBEDDED` を返し、veraPDF でも 6.2.11.4.1-1 で非適合。`detect_pades_level` は CRL 同梱の自作が B-LTA、CRL 無しが B-T（構造の観測。T3） |
| UC04 PDF/UA | 実務で使える | `drawTitle: false` で作ると H1 は 1 つで、PDF/UA-1 は 106/106 で適合。タグ無しは 7 規則が条文付きで違反（7.1-11・7.1-8・7.1-10・7.21.4.1-1・7.1-3・7.2-34・6.2-1）。reader はタグ無しの論理順を推測しなかった。**`ensure_tagged` は、すでに PDF/UA-1 を宣言している入力に「Lang・DisplayDocTitle・pdfuaid を足した」と返した**（F-20） |
| UC05 仕様調査 | 条件付きで使える（plugin では未実施） | plugin では `REGISTRY_ERROR`。手元の pdf-spec では `search_spec("document timestamp")` が 10 件（先頭は 12.8.4.2）、`get_requirements("7.5.6")` が 10 要求（shall 8・may 2）で、サイトの実測（v0.6.0）と同じ |
| UC06 一括監査 | 実務で使える | 5 件：未署名の契約 `human_review_required`、請求（financial）`use_with_caution`（PDF/A-3b は veraPDF で COMPLIANT）、PDF/UA のレポート `use_with_caution`、官報 `use_with_caution`、改ざん標本 `reject`（`POL-REJECT-INVALID`） |
| UC07 読み取り | 実務で使える | 21 ページの報告書は `search_text` で 21 ページに絞り、そのページだけ `read_text`。`summarize` の `next` は空（50 ページ未満のため）。スキャン相当は `no_text_layer` で、`next` が `render_page` を案内し、画像から視覚読みした |
| UC08 電帳法寄りの請求書 | 実務で使える | UC02 の成果物で確認。`inspect_catalog` に `/AF` 1 件と、`EmbeddedFiles` の `invoice-2026-0915.csv`（`AFRelationship: Data`）が出た |
| UC09 宣言と検証 | 実務で使える | `ensure_pdfa` は `declarationRisks: FONT_NOT_EMBEDDED` と「Known to fail」の warning を返した。veraPDF は 6.2.11.4.1-1 で非適合 |
| UC10 暗号化と未実施 | 条件付きで使える | 官報は reader で `isEncrypted: true`・`textExtractability: not_extractable`（Identity-V で ToUnicode が無い）。`next` は「空のパスワードで鍵を導けた。別の復号は要らない」と書く。veraPDF は `ENCRYPTED_PDF` で未実施。writer は `SIGNED_PDF` を返し、案内どおり `preserveSignatures: true` で再試行すると今度は `ENCRYPTED_PDF`（F-21）。**writer の `ENCRYPTED_PDF` を官報で初めて観測できた** |

## 境界違反

| 項目 | 結果 |
| --- | --- |
| pdf-spec に検証対象の PDF を渡した | なし |
| reader の観測を真正性に伸ばした | なし（判定はすべて `evaluate_policy` の `verdict`） |
| writer の成功を適合と言った | なし（`ensure_pdfa`・`ensure_tagged` の後は必ず `validate_conformance`） |
| 「ISO 19005 準拠」「PAdES 準拠」と書いた | なし |
| 未実施を passed にした | なし（官報の PDF/A、plugin の pdf-spec は未実施と記録） |

## E3 で新たに見つかったもの

- **F-16**：このセッションの形では、pdf-specialist subagent から plugin のツールが見えない
- **F-17**：`signatureCount` が、`evaluate_policy` と `verify_integrity` で違う数を返す
- **F-18**：pdf-publish Skill が `drawTitle: false` を案内しておらず、手順どおりに作ると H1 が二重になる
- **F-19**：`ensure_pdfa`（-4・-4f）が、PDF/UA-1 を宣言した入力を、PDF/UA-1 で非適合のファイルにする。警告も出さない
- **F-20**：`ensure_tagged` が、すでにある要件を「足した」と返す
- **F-21**：writer は署名の確認を暗号化の確認より先に行うため、`SIGNED_PDF` の案内に従うと `ENCRYPTED_PDF` で止まる
- **F-22**：Claude Desktop の plugin では、`PDF_WRITER_FONT` と `PDF_SPEC_DIR` がサーバーに届かない
