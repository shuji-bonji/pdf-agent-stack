::: details 呼び出し例 — 「PDF 2.0 で増分更新は何を要求している？」（§7.5.6）
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `section`: `"7.5.6"`
- 配列: 先頭だけ残す。PDF 由来の折返しは空白に畳む

節番号は [`search_spec`](#search-spec) の先頭ヒット（§7.5.6）です。`level` を省略すると shall / may などが混在して返ります。

**パラメータ**

```jsonc
{
  "section": "7.5.6"
}
```

**返る JSON**

```jsonc
{
  "filter": { "section": "7.5.6", "level": "all" },
  "totalRequirements": 10,
  "statistics": { "shall": 8, "may": 2 },
  "requirements": [
    {
      "id": "R-7.5.6-1",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "When updating a PDF file incrementally, changes shall be appended to the end of the file, leaving its original contents intact."
    },
    {
      "id": "R-7.5.6-2",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "A cross-reference section for an incremental update shall contain entries only for objects that have been changed, replaced, or deleted."
    }
    // … 残り 8 件。適合の必要条件は shall だけ
  ]
}
```

`text` は原文のままなので、引用に使えます。これは規格の要求です。検証対象の PDF がそれを満たすかは、pdf-verify-mcp の `validate_conformance` / `evaluate_policy` の答えです。
:::
