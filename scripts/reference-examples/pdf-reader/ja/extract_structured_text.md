::: details 呼び出し例 — 「見出しと段落を論理読み順で、位置付きで」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `pages`: `"1"`
- `include_bbox`: `true`
- `response_format`: `"json"`

`elements` は先頭 2 件だけ残しています。

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
  "include_bbox": true,
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "scope": {
    "textExtraction": { "status": "read" },
    "extractabilityObservation": { "status": "read" }
  },
  "isTagged": true,
  "lang": "ja",
  "elements": [
    {
      "role": "H1",
      "depth": 1,
      "text": "請求書（サンプル）— pdf-publish デモ",
      "pages": [1],
      "boxes": [
        {
          "page": 1,
          "rect": { "x1": 56, "y1": 766.306, "x2": 375.194, "y2": 792.37 },
          "basis": "text-extent"
        }
      ]
    },
    {
      "role": "P",
      "depth": 1,
      "text": "株式会社サンプル商事 御中",
      "pages": [1],
      "boxes": [
        {
          "page": 1,
          "rect": { "x1": 56, "y1": 699.322, "x2": 190.464, "y2": 715.25 },
          "basis": "text-extent"
        }
      ]
    }
    // … H2「請求明細」、Table、備考 が続く
  ]
}
```

`rect` は PDF 座標系（左下原点・pt）です。pdf-writer-mcp の `add_annotation` にそのまま渡せます。`basis` が `text-extent` なので、テキストからの実測です。
:::
