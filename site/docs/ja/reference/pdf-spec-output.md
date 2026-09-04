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
// get_section({ section: "14.9.4" }) — 実測 pdf-spec-mcp v0.6.0
{
  "sectionNumber": "14.9.4",
  "title": "Replacement text",
  "pageRange": { "start": 815, "end": 816 },
  "content": [
    { "type": "heading",   "level": 3, "text": "14.9.4 Replacement text" },
    { "type": "paragraph", "text": "Replacement text may be specified for the following items:" },
    { "type": "list",      "items": ["• A structure element …", "• (PDF 1.5) A marked-content sequence …"] },
    { "type": "note",      "label": "NOTE 1",  "text": "Just as alternate descriptions can be provided …" },
    { "type": "paragraph", "text": "The ActualText value shall be used as a replacement, not a description, …" },
    { "type": "note",      "label": "NOTE 2",  "text": "The treatment of ActualText as a character replacement …" },
    { "type": "note",      "label": "EXAMPLE", "text": "This example shows the use of replacement text …" }
    // `table` / `code` 要素は、それを持つ節で現れる
  ]
}
```

`heading.level` は規格自身の節番号の深さ（`14.9.4` なら 3）で、Markdown の見出しレベルではありません。

読み方のポイント: `content` は文書順です。**NOTE / EXAMPLE は `note` 要素として本文（paragraph）と区別されます。** ISO では NOTE は参考情報であって規範的要求ではないため、根拠として引用するときはこの区別が必要になります。表は `table` 要素として構造のまま返るので、値の対応（キー・型・意味）を LLM が読み違えにくくなっています。

## 要件（`get_requirements` の出力）

条文の中から **shall / shall not / should / should not / may** を含む規範文だけを抽出し、1 文 = 1 要件で返します。

```jsonc
// get_requirements({ section: "12.5.6.10" }) — 実測 pdf-spec-mcp v0.6.0
{
  "filter": { "section": "12.5.6.10", "level": "all" },
  "totalRequirements": 6,
  "statistics": { "shall": 6 },            // レベル別の件数。0 件のレベルはキー自体が出ない
  "requirements": [
    {
      "id": "R-12.5.6.10-1",                // R-<節番号>-<連番>。引用・追跡用の安定 ID
      "level": "shall",                     // ISO/IEC Directives Part 2 準拠の 5 段階
      "text": "Text markup annotations shall appear as highlights, underlines, …",  // 原文そのまま（引用可能）
      "section": "12.5.6.10",
      "sectionTitle": "Text markup annotations"
    },
    {
      "id": "R-12.5.6.10-3",
      "level": "shall",
      "text": "(Required) The type of annotation that this dictionary describes;\nshall be Highlight, Underline, Squiggly, or StrikeOut …",
      "section": "12.5.6.10",
      "sectionTitle": "Text markup annotations",
      "source": "table",                    // 表由来の要件のみ付く。無ければ地の文由来
      "table": "Table 182 — Additional entries specific to text markup annotations",
      "key": "Subtype"                      // その表のどのエントリを縛る文か
    }
  ]
}
```

読み方のポイント: `level` の 5 段階は義務（shall）・禁止（shall not）・推奨（should）・非推奨（should not）・許容（may）で、**shall だけが適合の必要条件**です。`text` は原文のまま返るのでそのまま引用できます（改行は規格の組版由来です）。`source: "table"` 付きの要件は表のセルから持ち上げた文で、単独では意味が取れないため `table` / `key`（どの表のどのエントリを縛る要件か）が併記されます — 引用時はこの文脈ごと示してください。`statistics` は出現したレベルだけを数えるので、キーが無いのは 0 件であってエラーではありません。

::: warning 要件 ≠ 判定
要件は「規格の要求」であって、特定の PDF がそれを満たすかは別問題です。ファイルの検査は [pdf-verify](/ja/mcp/pdf-verify) へ。また、抽出は ISO 32000-2 等のコーパス内に限られます — PDF/A の要件がここに出ないのは「存在しない」からではありません。
:::

## 定義（`get_definitions` の出力）

規格の第 3 節（Terms and definitions）から用語定義を返します。

```jsonc
// get_definitions({ term: "glyph" }) — 実測 pdf-spec-mcp v0.6.0
{
  "totalDefinitions": 1,
  "searchTerm": "glyph",
  "definitions": [
    {
      "term": "glyph",
      "definition": "recognizable abstract graphic symbol that is independent of any specific design …",
      "section": "3.29",                      // 定義の節番号（引用用）
      "source": "ISO/IEC 9541-1:2012, 3.12"   // 規格自身が示す SOURCE 引用（ある項目のみ）
      // "notes": ["Note 1: to entry: …"]     // 定義に付随する注記（ある項目のみ）
    }
  ]
}
```

`term` を省くと Clause 3 が丸ごと返ります — **ISO 32000-2 では 71 件（3.1〜3.71）**です。

読み方のポイント: ISO の定義は**その規格の中での用語の意味を確定させる規範的な文**です。規格上の意味が日常語と違う用語（PDF processor 3.49・running text 3.59・object 3.44・deprecated 3.15 など）は、議論の前にここで確定させてください。`source` は他規格から借りた定義に規格自身が付けている SOURCE 引用で、**答えが返ってきたコーパス文書のことではありません**。`notes` は定義への補足（Note to entry）で、定義本文とは区別されます。

::: warning 0 件は「Clause 3 に無い」という意味
PDF の語彙には Clause 3 ではなく本文側で定義されているものが少なくありません。*artifact*（§14.8.2.2）や *annotation*（§12.5）がそれで、`get_definitions` では 0 件になります。その場合は `search_spec` / `get_section` から入ってください。定義 0 件を「規格が定義していない」と読まないこと。
:::

## 関連ページ

- [pdf-spec-mcp](/ja/mcp/pdf-spec) — 責務と使いどころ
- [ツールリファレンス](/ja/reference/mcp/pdf-spec) — 全 8 ツールの引数・型・既定値
- [ISO 仕様書の読み方（入門）](/ja/reference/iso-reading-primer)
