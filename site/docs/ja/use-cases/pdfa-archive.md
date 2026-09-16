---
description: 長期保存 (PDF/A) — 作る側は attach_file → ensure_pdfa → veraPDF 採点、受け取る側は PAdES 構造と LTV データの実在確認。電帳法文脈の実測ログ付き
---

# 長期保存 (PDF/A)

## シナリオ

10 年後にも「開ける・読める・検証できる」PDF を残します。電帳法（機械可読データの同梱）や
公文書の保存文脈で、**作る側**は PDF/A の器に載せて veraPDF で採点し、**受け取る側**は
その文書が長期保存に耐える構造か（LTV データの実在）を確認します。

以下は **2026-09-04 の実測**です（pdf-verify-mcp v0.26.0 / veraPDF 1.30.0。請求書デモ・インターネット官報・自作検体）。

## 登場 MCP / Skill

| 役者 | 役割 |
|---|---|
| [pdf-writer](/ja/mcp/pdf-writer) | `attach_file`（機械可読データ同梱）→ `ensure_pdfa`（器付け・**ラベルを書くだけ**） |
| [pdf-verify](/ja/mcp/pdf-verify) | `validate_conformance`（veraPDF 委譲）・`detect_pades_level`（LTV 構造の観測） |
| [pdf-trust](/ja/skills/pdf-trust) / [pdf-publish](/ja/skills/pdf-publish) | 受入側 / 送り出し側の編成 |

## シーケンス図

```mermaid
sequenceDiagram
  participant W as pdf-writer
  participant V as pdf-verify (veraPDF)

  Note over W,V: 作る側（電帳法パターン）
  W->>W: attach_file(CSV, relationship: Data)
  W->>W: ensure_pdfa(pdfa-3b) — 添付の後・必ず最後
  W->>V: validate_conformance(pdfa-3b)
  V-->>W: veraPDF COMPLIANT 146/146

  Note over W,V: 受け取る側（保存に耐えるか）
  V->>V: detect_pades_level
  V-->>V: 構造 = B-B / B-T / B-LT / B-LTA + LTV データの実在
```

## プロンプト例

- 「この請求書、CSV ごと電帳法対応の保存形式にして」（→ attach_file + ensure_pdfa(pdfa-3b)）
- 「この契約書、10 年保存に耐える？署名は失効後も検証できる形？」（→ detect_pades_level + DSS 確認）
- 「PDF/A-4 で」（→ 添付があるなら **`pdfa-4f`**。素の `pdfa-4` は添付自身が PDF/A であることを要求する）

## 実測例

**作る側**（`publish-demo-invoice.pdf`）: catalog に Names / AF / OutputIntents あり。**veraPDF 1.30.0 が PDF/A-3b COMPLIANT（146/146）と判定**しました。同じファイルの PDF/UA-1 も 106/106 です。

**受け取る側**（`detect_pades_level`、3 検体）:

| 検体 | 構造の観測 | 根拠 |
|---|---|---|
| 官報 2026-08-10 号 | **B-B** | 署名 TS なし・DSS なし・DocTS あり |
| `selfmade-pades-lta.pdf`（CRL なし） | **B-T** | DSS はあるが `revocationDataCoversSigner: false`（dssCrlCount 0） |
| `selfmade-pades-crl.pdf`（CRL を DSS に同梱） | **B-LTA** | `revocationDataCoversSigner: true`（dssCrlCount 1） |

`detect_pades_level` は DSS の失効データが**署名者証明書を実際に覆っているか**まで見ます。覆っていなければ B-T 止まりです。これは T3 の観測であって、「PAdES に準拠」ではありません。

::: details 呼び出し — validate_conformance と detect_pades_level
- 実測: pdf-verify-mcp v0.26.0、veraPDF 1.30.0

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo-invoice.pdf",
  "flavour": "pdfa-3b",
  "response_format": "json"
}
```

```jsonc
{
  "engine": "verapdf",
  "flavour": "PDF/A-3b",
  "compliant": true,
  "checkedRules": 146,
  "passedRules": 146,
  "failedRules": 0
}
```

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-crl.pdf",
  "response_format": "json"
}
```

```jsonc
{
  "levels": [
    {
      "fieldName": "Sig1",
      "level": "B-LTA",
      "normativeBasis": "T3",
      "evidence": { "hasSignatureTimestamp": true, "hasDss": true, "hasDocumentTimestamp": true },
      "ltv": { "dssCrlCount": 1, "revocationDataCoversSigner": true }
    }
  ]
}
```
:::

## 実測例 — ラベルと採点が食い違うファイル（2026-09-15、別ホスト）

`ensure_pdfa` が書いたラベルを適合と読み違えないことを、意図的に非適合のファイルで確かめました
（pdf-writer-mcp v0.21.0 / pdf-verify-mcp v0.26.0 / veraPDF 1.30.0。ホストは Grok Build 1.0.30）。

| ステップ | ツール | 実測 |
|---|---|---|
| 1 | `create_text_pdf`（英語、fontPath なし） | フォントは Helvetica（未埋め込み） |
| 2 | `ensure_pdfa`（pdfa-3b）だけ | `declarationRisks: FONT_NOT_EMBEDDED (Helvetica)`。warning: **CLAIMS PDF/A-3b … conformance was NOT checked** |
| 3 | `identify_conformance` | 宣言は `pdfA: { part: "3", conformance: "B" }`。notes: identifies declared conformance only |
| 4 | `validate_conformance`（pdfa-3b） | engine `verapdf`、**`compliant: false`**、145/146。違反は `ISO 19005-3:2012 6.2.11.4.1-1`（フォント未埋め込み） |

ステップ 3 の直後の要約は「ファイルは PDF/A-3b を名乗っている。ensure_pdfa は /ID・OutputIntent・XMP pdfaid を足しただけで、適合は見ていない」でした。
「PDF/A になった」とは書いていません。正しい報告文は 3 文です: **名乗っている**（identify）／ **veraPDF の判定は**非 COMPLIANT、145/146、6.2.11.4.1-1（validate）／ **warning は** CLAIMS … NOT checked（ensure_pdfa）。

報告書の全文: [eval/hosts/grok-build/reports/UC09.md](https://github.com/shuji-bonji/pdf-agent-stack/blob/main/eval/hosts/grok-build/reports/UC09.md)

## 結果の読み方

- **PDF/A の判定者は veraPDF**です（T2）。「veraPDF が COMPLIANT と判定（146/146）」と書き、
  「ISO 19005 準拠」とは書きません
- **PAdES レベルは構造の観測**です（T3）。「構造が B-LTA に一致する」と書き、「B-LTA 準拠」とは書きません
- `ensure_pdfa` は**ラベルを書く道具**であって、規格どおりにさせる道具ではありません。フォント未埋め込み・暗号化・
  JavaScript は直りません — 非適合の文書に掛ければ「自分について嘘をつくファイル」ができてしまいます
- 暗号化 PDF は veraPDF が PDF/A を採点できないことがあります（官報で実測）。その検査は「未実施」と
  記録されます — passed ではありません

## 別ホストでの再走（2026-09-15、Grok Build 1.0.30）

「PDF/A-4 で保存して。CSV は付けたまま」という依頼に対して flavour は **`pdfa-4f`** が選ばれ、veraPDF は 109/109 で COMPLIANT でした。`detect_pades_level` の 3 検体（官報 B-B / CRL なし B-T / CRL 同梱 B-LTA）は上の実測と同じ観測です。ラベルと採点が食い違う検体は上の節のとおりです。報告書: [UC03.md](https://github.com/shuji-bonji/pdf-agent-stack/blob/main/eval/hosts/grok-build/reports/UC03.md)
