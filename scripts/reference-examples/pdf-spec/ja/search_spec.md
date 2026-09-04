::: details 呼び出し例 — 「PDF 2.0 で増分更新は何を要求している？」
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `query`: `"incremental update"`
- `max_results`: `5`
- 配列: 先頭だけ残す。PDF 由来の折返しは空白に畳む

英語のフレーズで探します。当たった節の要求は [`get_requirements`](#get-requirements) へ渡します。

**パラメータ**

```jsonc
{
  "query": "incremental update",
  "max_results": 5
}
```

**返る JSON**

```jsonc
{
  "query": "incremental update",
  "totalResults": 5,
  "results": [
    {
      "section": "7.5.6",
      "title": "Incremental updates",
      "page": 75,
      "score": 12,
      "snippet": "7.5.6 Incremental updates The contents of a PDF file can be updated incrementally without rewriting…"
    },
    {
      "section": "12.7.8.3.1",
      "title": "General",
      "page": 576,
      "score": 12,
      "snippet": "…A stream containing all the bytes in all incremental updates made to the underlying PDF document…"
    }
    // … ほか 3 件（7.5.4 / 12.8.1 / 7.5.1）
  ]
}
```

先頭ヒットは §7.5.6 です。要求だけが欲しいときはその節を [`get_requirements`](#get-requirements) に渡します。
:::

::: details 呼び出し例 — 「タグ付き PDF の読み順はどの条文？」
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- `query`: `"content order"`
- `max_results`: `5`

日常語の `reading order` では、ストリームの読み方やシェーディングの頂点順など、別の節が先に出ます。規格の語は **logical content order** / **page content order** です。

**パラメータ**

```jsonc
{
  "query": "content order",
  "max_results": 5
}
```

**返る JSON**

```jsonc
{
  "query": "content order",
  "totalResults": 5,
  "results": [
    {
      "section": "14.8.2.5.1",
      "title": "General",
      "page": 764,
      "score": 39,
      "snippet": "14.8.2.5.1 General Page content order shall be defined by the sequencing of graphics objects within …"
    }
    // … ほか 4 件
  ]
}
```

本文が欲しいときは、分かった最も具体的な節番号で [`get_section`](#get-section) します。親の `14.8.2.5` ではなく `14.8.2.5.1` です。
:::
