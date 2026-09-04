::: warning PDF/A-3 では `relationship` に意味のある値が必須
`Source` / `Data` / `Alternative` / `Supplement` を渡してください。省略すると警告が返り、値は `Unspecified` です（ISO 19005-3 §6.8）。
:::

::: warning 添付があるなら PDF/A-4 は `"pdfa-4f"`
素の `"pdfa-4"` は添付ファイル自身が PDF/A であることを要求します。CSV や JSON を同梱するなら `ensure_pdfa` の flavour は `"pdfa-4f"` です。電帳法の文脈では添付の**後**に `ensure_pdfa` を掛けます。
:::

::: warning `outputPath` は必ず渡す
省略すると PDF 全体が base64 で返り、会話が破綻しやすいです。保存先は絶対パスで渡してください。
:::

::: details 呼び出し例 — 「CSV を Data として埋め込んで」
- 実測: v0.21.0
- 標本: `docs/specimens/selfmade-base.pdf`（呼び出すときは絶対パス）
- 添付: `docs/specimens/publish-demo-data.csv`
- `name`: `"invoice-data.csv"`（既存名と重複すると `INVALID_ARGUMENT`）
- `relationship`: `"Data"`

**パラメータ**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/selfmade-base.pdf",
  "attachmentPath": "/absolute/path/to/docs/specimens/publish-demo-data.csv",
  "name": "invoice-data.csv",
  "description": "Machine-readable invoice data",
  "relationship": "Data",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**返る JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 19070,
  "path": "/absolute/path/to/output.pdf",
  "attachment": {
    "name": "invoice-data.csv",
    "bytes": 114,
    "mimeType": "text/csv",
    "relationship": "Data"
  },
  "attachments": ["invoice-data.csv"]
}
```

同じ名前の添付が既にあるファイル（例: `publish-demo.pdf` の `publish-demo-data.csv`）では `INVALID_ARGUMENT` になります。
:::
