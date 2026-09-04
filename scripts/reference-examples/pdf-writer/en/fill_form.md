::: tip When you do not know the field names
Pass one nonexistent name — the error lists every field name and type. Branch on `code`; do not parse the message text.
:::

::: warning XFA is unsupported
AcroForm only. `flatten: true` on a tagged PDF breaks PDF/UA conformance and additionally requires `allowBreakingTags: true`.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Fill the form" (specimen with no AcroForm)
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path; no AcroForm)
- `fields`: `{ "dummy": "x" }`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "fields": { "dummy": "x" },
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (error)

```jsonc
{
  "error": "\"/absolute/path/to/docs/specimens/publish-demo.pdf\" has no AcroForm fields to fill.",
  "code": "INVALID_ARGUMENT"
}
```

No fields yields this `code`. A wrong name on a file that does have fields lists every name and type in the error body.
:::
