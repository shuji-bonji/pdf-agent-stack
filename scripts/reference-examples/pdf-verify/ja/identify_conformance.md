::: warning 宣言は証拠ではない
このツールは XMP の pdfaid / pdfuaid を**読むだけ**です。「私は PDF/A です」と書いてあることと、規格どおりであることは別です。ルール検査は [`validate_conformance`](#validate-conformance) です。
:::

::: details 呼び出し例 — 「PDF/A や PDF/UA を名乗っているか」
- 実測: v0.26.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "hasXmp": true,
  "pdfA": { "part": "3", "conformance": "B" },
  "pdfUa": { "part": "1" },
  "pdfVersion": "1.7",
  "notes": [
    "This tool identifies declared conformance only; it does not validate actual conformance.",
    "Document declares PDF/A-3b.",
    "Document declares PDF/UA-1."
  ]
}
```
:::
