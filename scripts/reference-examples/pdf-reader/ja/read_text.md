::: details 呼び出し例 — 「1 ページ目のテキストを」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `pages`: `"1"`
- `response_format`: `"json"`

この標本はタグ付きなので、順序が要るときは [`extract_structured_text`](#extract-structured-text) が先です。

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "pages": "1",
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
  "pages": [
    {
      "page": 1,
      "text": "請求書（サンプル）— pdf-publish デモ\n請求書（サンプル）\n株式会社サンプル商事 御中\n…",
      "extractability": {
        "page": 1,
        "unmappableFonts": [],
        "state": "extracted"
      }
    }
  ]
}
```

`extractability.state` が `no_text_layer` または `not_extractable` なら、次は [`render_page`](#render-page) です。
:::
