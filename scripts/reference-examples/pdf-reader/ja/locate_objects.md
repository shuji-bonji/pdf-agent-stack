::: details 呼び出し例 — 「オブジェクト 7 と 9 と 4 はどこか」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `object_numbers`: `[7, 9, 4]`
- `response_format`: `"json"`

pdf-verify-mcp の `verify_integrity` が返した番号を渡す想定です。

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "object_numbers": [7, 9, 4],
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "objects": [
    {
      "objectNumber": 7,
      "found": true,
      "type": "Page",
      "locations": [
        {
          "page": 1,
          "rect": { "x1": 0, "y1": 0, "x2": 595.28, "y2": 841.89 },
          "basis": "page-box"
        }
      ]
    },
    {
      "objectNumber": 9,
      "found": true,
      "type": null,
      "locations": [
        {
          "page": 1,
          "rect": { "x1": 0, "y1": 0, "x2": 595.28, "y2": 841.89 },
          "basis": "page-content-stream"
        }
      ],
      "reason": "This is the page's content stream, so the rectangle is the whole page. …"
    },
    {
      "objectNumber": 4,
      "found": true,
      "type": "Font",
      "subtype": "Type0",
      "locations": [{ "page": 1, "rect": null, "basis": "page-resource" }],
      "reason": "A resource is used by the page but has no rectangle of its own; …"
    }
  ],
  "isEncrypted": false
}
```

`page-content-stream` の矩形はページ全体です。段落を指すなら [`extract_structured_text`](#extract-structured-text) の `include_bbox` です。
:::
