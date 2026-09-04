::: danger This writes a declaration, not proof of conformance
It writes pdfuaid into XMP. Applied to a non-conforming document it produces a PDF claiming conformance it does not have. After writing, always measure with pdf-verify-mcp `validate_conformance` (`flavour: "pdfua-1"`). If you cannot measure it, do not write the declaration.
:::

::: warning Machines cannot infer meaning
The new tree is a scaffold (each page = one P element). Headings, tables, lists, reading order and figure alt text are not created. If you can build with `tagged: true` from the start, do that.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Put an existing PDF onto the PDF/UA-1 vessel"
- Measured: v0.21.0
- Specimen: `docs/specimens/selfmade-base.pdf` (pass an absolute path; already tagged)
- `title`: `"Selfmade base"`
- `lang`: `"en"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/selfmade-base.pdf",
  "title": "Selfmade base",
  "lang": "en",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON**

```jsonc
{
  "pageCount": 1,
  "bytes": 18406,
  "path": "/absolute/path/to/output.pdf",
  "wasTagged": true,
  "createdStructure": false,
  "wrappedPages": 0,
  "addedRequirements": [
    "Lang",
    "ViewerPreferences/DisplayDocTitle",
    "XMP(pdfuaid:part, dc:title)"
  ]
}
```

Already tagged, so the structure tree was left untouched and only missing document-level requirements were supplied. After writing the declaration, measure with `validate_conformance` (`flavour: "pdfua-1"`).
:::
