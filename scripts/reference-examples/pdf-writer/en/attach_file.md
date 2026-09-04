::: warning PDF/A-3 requires a meaningful `relationship`
Pass `Source` / `Data` / `Alternative` / `Supplement`. Omitting it warns and the value is `Unspecified` (ISO 19005-3 §6.8).
:::

::: warning With attachments, PDF/A-4 must be `"pdfa-4f"`
Plain `"pdfa-4"` requires every attachment to be PDF/A itself. Bundling CSV or JSON means `ensure_pdfa` flavour `"pdfa-4f"`. In the e-bookkeeping-law pattern, apply `ensure_pdfa` **after** the attachment.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Embed a CSV as Data"
- Measured: v0.21.0
- Specimen: `docs/specimens/selfmade-base.pdf` (pass an absolute path)
- Attachment: `docs/specimens/publish-demo-data.csv`
- `name`: `"invoice-data.csv"` (a duplicate name is `INVALID_ARGUMENT`)
- `relationship`: `"Data"`

**Parameters**

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

**Returned JSON**

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

A file that already has that name (e.g. `publish-demo.pdf` with `publish-demo-data.csv`) returns `INVALID_ARGUMENT`.
:::
