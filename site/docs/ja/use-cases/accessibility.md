---
description: アクセシビリティ (PDF/UA) — タグ付き生成から veraPDF 採点まで。UA-1 106/106 通過の実走と、タグなし実文書が 10 規則で落ちる実測の両面
---

# アクセシビリティ (PDF/UA)

## シナリオ

スクリーンリーダーで読める PDF を**作る**（タグ付き生成 → 採点）、あるいは受け取った PDF が
読める構造か**測る**、という 2 つの場面です。PDF/UA-1（ISO 14289-1）は仕様コーパスに原文があるため、
違反は**条文を引いて**言い切れます（T1 — PDF/A との大きな違い）。

以下は **2026-09-04 の実測**です（pdf-verify-mcp v0.26.0 / veraPDF 1.30.0。タグ付き請求書デモ = 通過側 / インターネット官報 = 不合格側）。

## 登場 MCP / Skill

| 役者 | 役割 |
|---|---|
| [pdf-writer](/ja/mcp/pdf-writer) | `tagged: true` での生成・`tag_form_fields`・`ensure_tagged`（宣言のみ） |
| [pdf-verify](/ja/mcp/pdf-verify) | `validate_conformance(pdfua-1)` — veraPDF 委譲・条文 ID 付き違反 |
| [pdf-reader](/ja/mcp/pdf-reader) | `inspect_tags`（構造木）・`extract_structured_text`（論理順の本文） |
| [pdf-publish Skill](/ja/skills/pdf-publish) | 生成側の編成（`tagged` 指定時はゲート `pdfua-1` が既定） |

## シーケンス図

```mermaid
sequenceDiagram
  participant W as pdf-writer
  participant R as pdf-reader
  participant V as pdf-verify (veraPDF)

  W->>W: create_markdown_pdf(tagged: true, lang, title, 埋め込みフォント)
  W->>R: inspect_tags / extract_structured_text
  Note over R: 構造木と論理順を観測（合否は言わない）
  R->>V: validate_conformance(flavour: pdfua-1)
  V-->>W: COMPLIANT 106/106（不合格なら条文 ID 付き違反 → 修正ループ）
```

## プロンプト例

- 「このレポートをアクセシブルな PDF にして。検証まで」
- 「この PDF、スクリーンリーダーで読める？何が足りない？」
- 「このフォーム PDF を PDF/UA 準拠にして」（→ `tag_form_fields`）

## 実測例 — 両面

**作る側**（`publish-demo-invoice.pdf`）: `inspect_tags` はタグ付き、H1 が 1、TH 5 / TD 15 / TR 4。**veraPDF 1.30.0 が PDF/UA-1 COMPLIANT（106/106）と判定**しました。同じファイルの PDF/A-3b も 146/146 です。

**測る側**（官報 2026-08-10 号）: **NOT COMPLIANT** — 106 検査中 10 規則が失敗（96 通過）。暗号化文書なので、veraPDF は復号した書き換えに対して採点しています。主要な違反は次のとおりです。

| 条文（ISO 14289-1） | 違反 |
|---|---|
| 7.1-3 | タグ付けも Artifact 化もされていない実コンテンツ **236 件** |
| 7.1-11 | StructTreeRoot がない |
| 6.2-1 | MarkInfo/Marked がない |
| 7.21.7-1 | ToUnicode を欠くフォント 9 件 |
| 7.2-34 | ページ本文の自然言語が決まっていない（186 件） |

::: details 呼び出し — validate_conformance（pdfua-1）
- 実測: pdf-verify-mcp v0.26.0、veraPDF 1.30.0

通過側:

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo-invoice.pdf",
  "flavour": "pdfua-1",
  "response_format": "json"
}
```

```jsonc
{
  "engine": "verapdf",
  "flavour": "PDF/UA-1",
  "compliant": true,
  "checkedRules": 106,
  "passedRules": 106,
  "failedRules": 0
}
```

不合格側は同じ引数で `file_path` を官報にし、`compliant: false`、`failedRules: 10` です。
:::

## 結果の読み方

- **PDF/UA-1 は T1** — 違反は「ISO 14289-1 7.1-3 が要求する」と条文を引いて断定できます
  （PDF/A の「veraPDF がこう判定した」より一段強い言い方が許されます）
- native エンジンの違反には severity が付き、**error のみが非準拠を証明**します（warning は人手レビュー）
- `tagged: true` なら日本語が無くても**埋め込みフォントと title が必須**です（標準 14 フォントは 7.21.4.1 で必ず違反）
- 機械検証が判定できるのは構造までです。**alt テキストの意味的な適切さ・読み順の自然さは人手レビュー**が残ります
- `ensure_tagged` はラベルを書くだけです — 掛けたら必ず `pdfua-1` で測ってください
