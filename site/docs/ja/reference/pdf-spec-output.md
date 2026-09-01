---
description: pdf-spec-mcp の出力 3 種類（仕様条文・要件・定義）の JSON の形と、読み違えやすい箇所
---

# pdf-spec の出力の読み方

[pdf-spec-mcp](/ja/mcp/pdf-spec) の出力は大きく **仕様条文**・**要件**・**定義** の 3 種類に分かれます。このページは、その 3 つの JSON がどういう形で返り、どこを読み違えやすいかを説明します。引数と型の一覧は[ツールリファレンス](/ja/reference/mcp/pdf-spec)（自動生成）へ。

どれも「規格が何と書いているか」の構造化であり、あなたのファイルについて何かを言うものではありません。

::: tip 前提知識: ISO 規格の文書規約
NOTE は規範ではない・shall だけが適合の必要条件・定義は日常語を上書きする — といった ISO 共通の読み方を知らないと出力を誤読しやすいため、先に [ISO 仕様書の読み方（入門）](/ja/reference/iso-reading-primer) に目を通すことをお勧めします。
:::

## 仕様条文（`get_section` の出力）

節の本文を、原文の見た目ではなく**要素の列**として返します。

```jsonc
{
  "sectionNumber": "14.9.4",
  "title": "Replacement text",
  "pageRange": { "start": 812, "end": 814 },
  "content": [
    { "type": "heading",   "level": 4, "text": "…" },
    { "type": "paragraph", "text": "…" },
    { "type": "list",      "items": ["…"] },
    { "type": "table",     "headers": ["Key", "Type", "Value"], "rows": [["…"]] },
    { "type": "note",      "label": "NOTE 2", "text": "…" },   // NOTE/EXAMPLE は本文と区別される
    { "type": "code",      "text": "…" }
  ]
}
```

読み方のポイント: `content` は文書順です。**NOTE / EXAMPLE は `note` 要素として本文（paragraph）と区別されます** — ISO では NOTE は参考情報であり規範的要求ではないため、根拠として引用する際はこの区別が効きます。表は `table` 要素として構造のまま返るので、値の対応（キー・型・意味）を LLM が読み違えにくくなっています。

## 要件（`get_requirements` の出力）

条文の中から **shall / shall not / should / should not / may** を含む規範文だけを抽出し、1 文 = 1 要件で返します。

```jsonc
{
  "filter": { "section": "14.9.4", "level": "shall" },
  "totalRequirements": 12,
  "statistics": { "shall": 8, "should": 3, "may": 1 },   // レベル別の件数
  "requirements": [
    {
      "id": "iso32000-2-14.9.4-003",       // 引用・追跡用の安定 ID
      "level": "shall",                     // ISO/IEC Directives Part 2 準拠の 5 段階
      "text": "…shall be used only for…",  // 原文そのまま（改変しない — 引用可能）
      "section": "14.9.4",
      "sectionTitle": "Replacement text",
      "source": "table",                    // 表由来の要件のみ付く。無ければ地の文由来
      "table": "Table 182 — Entries in …", // 表由来の場合の文脈（どの表のどのエントリか）
      "key": "Subtype"
    }
  ]
}
```

読み方のポイント: `level` の 5 段階は義務（shall）・禁止（shall not）・推奨（should）・非推奨（should not）・許容（may）で、**shall だけが適合の必要条件**です。`text` は原文のまま返るのでそのまま引用できます。`source: "table"` 付きの要件は表のセルから持ち上げた文で、単独では意味が取れないため `table` / `key`（どの表のどのエントリを縛る要件か）が併記されます — 引用時はこの文脈ごと示してください。

::: warning 要件 ≠ 判定
要件は「規格の要求」であって、特定の PDF がそれを満たすかは別問題です。ファイルの検査は [pdf-verify](/ja/mcp/pdf-verify) へ。また、抽出は ISO 32000-2 等のコーパス内に限られます — PDF/A の要件がここに出ないのは「存在しない」からではありません。
:::

## 定義（`get_definitions` の出力）

規格の第 3 節（Terms and definitions）から用語定義を返します。

```jsonc
{
  "totalDefinitions": 1,
  "searchTerm": "tagged PDF",
  "definitions": [
    {
      "term": "tagged PDF",
      "definition": "…",              // 定義本文（原文）
      "section": "3.66",              // 定義の節番号（引用用）
      "notes": ["Note 1 to entry: …"], // 定義に付随する注記（あれば）
      "source": "ISO 32000-2"          // 出典
    }
  ]
}
```

読み方のポイント: ISO の定義は**その規格の中での用語の意味を確定させる規範的な文**です。日常語と意味がずれる用語（例: conforming reader / interactive form / artifact）ほど、議論の前にここで確定させる価値があります。`notes` は定義への補足（Note to entry）で、定義本文とは区別されます。

## 関連ページ

- [pdf-spec-mcp](/ja/mcp/pdf-spec) — 責務と使いどころ
- [ツールリファレンス](/ja/reference/mcp/pdf-spec) — 全 8 ツールの引数・型・既定値
- [ISO 仕様書の読み方（入門）](/ja/reference/iso-reading-primer)
