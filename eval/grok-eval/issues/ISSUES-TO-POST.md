# GitHub に貼る Issue 一覧

対象: `https://github.com/shuji-bonji/pdf-agent-stack`  
ラベル案: `documentation` `enhancement`（`evaluation` ラベルは権限があれば追加）

コネクタに Issue 作成権限が無いため、ここから手動で開く。親を先に作り、子の本文先頭に親番号を書く。

---

## 親 — Grok Build 実機評価

**タイトル:** `[evaluation] Grok Build 実機評価 — 親トラッキング`

`issues/000-parent.md` を本文にする。完了条件のチェックリストを Issue の task list にする。

https://github.com/shuji-bonji/pdf-agent-stack/issues/26

---

## UC01

https://github.com/shuji-bonji/pdf-agent-stack/issues/27

**タイトル:** `[evaluation] UC01 受入監査を Grok Build で再走する`

本文:

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC01-incoming-audit.md`
サイト: https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/incoming-audit

## やること

fixtures/incoming の契約ダミーと公文書（または代替 2 件）を pdf-trust で監査する。
evaluate_policy の verdict を文章で上書きしない。
同じ入力で 2 回呼び、判定が一致するか見る。

## 入力

- profile `contract`（未署名契約）
- profile `government`（官報等。無ければ理由を書いて省略）
- response_format `json`、ファイルは絶対パス

## 想定

- 未署名 × contract → human_review_required または reject
- 官報 × アンカー無し → use_with_caution になり得る（POL-CAUTION-TRUST-NOT-EVALUATED 等）
- 文書タイムスタンプの末尾追記を改ざんと書かない

## 成果物

reports/UC01.md と Trust Report
```

---

## UC02

https://github.com/shuji-bonji/pdf-agent-stack/issues/28

**タイトル:** `[evaluation] UC02 納品パイプラインを Grok Build で再走する`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC02-publish-pipeline.md`
サイト: https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/publish-pipeline

## やること

日本語請求書 Markdown から tagged PDF を作り、CSV を添付し、ensure_pdfa（最後）→ 読み戻し → validate_conformance。
FONT_REQUIRED は next_actions で復帰し、手数を記録する。

## 想定

- ensure_pdfa 成功時も warning（CLAIMS NOT checked）が残る
- writer 成功を適合と書かない
- veraPDF が無いなら engine と compliant を見て「未実施 / 内蔵」と書く

## 成果物

out/publish-invoice.pdf、reports/UC02.md、Publish Report
```

---

## UC03

https://github.com/shuji-bonji/pdf-agent-stack/issues/29

**タイトル:** `[evaluation] UC03 長期保存 PDF/A と pdfa-4f の取り違え`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC03-pdfa-archive.md`
サイト: https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/pdfa-archive

## やること

添付付き請求を pdfa-3b で採点する。
「PDF/A-4 で。CSV は付けたまま」と依頼し、モデルが pdfa-4f を選ぶか見る。
ensure_pdfa はラベルである。PAdES は T3。

## 成果物

reports/UC03.md
```

---

## UC04

https://github.com/shuji-bonji/pdf-agent-stack/issues/30

**タイトル:** `[evaluation] UC04 PDF/UA を Grok Build で作って測る`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC04-accessibility.md`
サイト: https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/accessibility

## やること

タグ付き日本語レポートを作り inspect_tags → validate_conformance(pdfua-1)。
タグ無し検体も同じゲートに通す。違反は ISO 14289-1 の条文で書いてよい（T1）。
alt の意味は人手レビューと明記する。

## 成果物

out/ua-report.pdf、reports/UC04.md
```

---

## UC05

https://github.com/shuji-bonji/pdf-agent-stack/issues/31

**タイトル:** `[evaluation] UC05 仕様調査で監査結果を条文に落とす`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC05-spec-research.md`
サイト: https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/spec-research

## やること

list_specs → search_spec("document timestamp") → get_requirements(section "7.5.6")。
pdf-spec に検証対象 PDF を渡さない。
コーパスが空ならエラーだけ記録し、記憶で条文を書かない。

## 想定（コーパスがある場合、サイト実測）

- search 約 10 件、§12.8.4.2 付近
- 7.5.6 は shall 8 / may 2
- gaps に ISO 19005 と PAdES

## 成果物

reports/UC05.md（規格本文の長文転記はしない）
```

---

## UC06

https://github.com/shuji-bonji/pdf-agent-stack/issues/32

**タイトル:** `[evaluation] UC06 一括監査でトリアージする`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC06-batch-audit.md`
サイト: https://shuji-bonji.github.io/pdf-agent-stack/ja/use-cases/batch-audit

## やること

4 件以上に evaluate_policy。個票は reject と human_review_required だけ。
profile をファイル種別で分ける（contract / financial / government / general）。

## 成果物

reports/UC06.md のサマリ表
```

---

## UC07

https://github.com/shuji-bonji/pdf-agent-stack/issues/33

**タイトル:** `[evaluation] UC07 pdf-read で大きい PDF と読めないページを扱う`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC07-pdf-read.md`
Skill: https://shuji-bonji.github.io/pdf-agent-stack/ja/skills/pdf-read

## やること

支払条件などの語句で search_text してから読む。全文ダンプしない。
テキスト層が無いページは render_page。OCR しない。
Read Report に経路と「読めなかった箇所」を残す。

## 成果物

reports/UC07.md
```

---

## UC08

https://github.com/shuji-bonji/pdf-agent-stack/issues/34

**タイトル:** `[evaluation] UC08 電帳法寄りの請求書を形式操作として納品する`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC08-denshichoho-invoice.md`

## やること

明細 CSV を添付し pdfa-3b を採点する。
「電帳法に準拠した」と書かない。行った操作と検証器の応答だけ書く。

## 成果物

out/denshi-invoice.pdf、reports/UC08.md
```

---

## UC09

https://github.com/shuji-bonji/pdf-agent-stack/issues/35

**タイトル:** `[evaluation] UC09 宣言と検証を取り違えない`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC09-declaration-vs-conformance.md`

## やること

ensure_pdfa のあとに identify_conformance だけ見た発言を記録する。
続けて validate_conformance し、ラベルと採点の差を書く。

## 成果物

out/claim-only-labeled.pdf、reports/UC09.md
```

---

## UC10

https://github.com/shuji-bonji/pdf-agent-stack/issues/36

**タイトル:** `[evaluation] UC10 暗号化と未実施を passed にしない`

```markdown
親: （親 Issue 番号）
指示書: `instructions/UC10-encrypted-and-unmeasured.md`

## やること

暗号化 PDF（または veraPDF 無し・存在しないパス・SIGNED_PDF）で失敗経路を踏む。
測れない検査を未実施と書く。ENCRYPTED_PDF の next_actions を記録する。

## 成果物

reports/UC10.md
```
