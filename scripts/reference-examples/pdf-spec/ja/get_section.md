::: details 呼び出し例 — 「タグ付き PDF の読み順はどの条文？」（§14.8.2.5.1）
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `section`: `"14.8.2.5.1"`
- 折返し: PDF 由来は空白に畳む

節番号は [`search_spec`](#search-spec) の `content order` の先頭ヒットです。親の `14.8.2.5` ではなく、分かった最も具体的な `14.8.2.5.1` を渡します。

**パラメータ**

```jsonc
{
  "section": "14.8.2.5.1"
}
```

**返る JSON**

```jsonc
{
  "sectionNumber": "14.8.2.5.1",
  "title": "General",
  "pageRange": { "start": 764, "end": 764 },
  "content": [
    { "type": "heading", "level": 5, "text": "14.8.2.5.1 General" },
    {
      "type": "paragraph",
      "text": "Page content order shall be defined by the sequencing of graphics objects within a page’s content stream."
    },
    {
      "type": "paragraph",
      "text": "Logical content order – the ordering for semantic purposes – shall be defined by a depth-first traversal of the document’s logical structure hierarchy."
    },
    {
      "type": "paragraph",
      "text": "The page content order in a tagged PDF should coincide with the logical content order."
    },
    {
      "type": "note",
      "label": "NOTE 1",
      "text": "Page content order is constrained by the need to render objects in an order that produces the desired visual appearance. …"
    }
  ]
}
```

`paragraph` の shall が要求、should は推奨、`note` は参考情報です。`note` 要素の文を、shall 違反の根拠にはしません。
:::
