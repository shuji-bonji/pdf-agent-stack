::: danger This writes a declaration, not proof of conformance
It writes pdfaid into XMP. Unembedded fonts, encryption and JavaScript are not repaired. Applied to a non-conforming document it produces a PDF claiming conformance it does not have. After writing, always measure with pdf-verify-mcp `validate_conformance`, passing the same flavour string. If you cannot measure it, do not write the declaration. A PDF/A result stops at "veraPDF judged it COMPLIANT".
:::

::: warning With attachments, use `"pdfa-4f"`
Plain `"pdfa-4"` requires every attachment to be PDF/A itself (`6.9-3`). Bundling CSV or JSON means `"pdfa-4f"`. The PDF/A-4 flavours set the header to PDF 2.0 and delete the Info dictionary. Combining with `preserveSignatures` is refused unless the input is already PDF 2.0.
:::

::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64 and will overflow the chat. Pass an absolute destination path.
:::

::: details Worked example — "Put it onto the PDF/A-3b vessel"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path; already declares PDF/A-3b)
- `flavour`: `"pdfa-3b"`

**Parameters**

```jsonc
{
  "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfa-3b",
  "outputPath": "/absolute/path/to/output.pdf"
}
```

**Returned JSON** (warnings abbreviated)

```jsonc
{
  "pageCount": 1,
  "bytes": 92945,
  "path": "/absolute/path/to/output.pdf",
  "flavour": "3b",
  "addedRequirements": ["XMP pdfaid (part 3, conformance B)"],
  "wasDeclared": true,
  "warnings": [
    "The document already has a trailer /ID; it was left unchanged.",
    "The document already declares a GTS_PDFA1 output intent; it was left unchanged.",
    "This file now CLAIMS PDF/A-3b (pdfaid:part=3, conformance=B), but conformance was NOT checked here. … Verify before relying on it: pdf-verify-mcp validate_conformance(flavour: \"pdfa-3b\") …"
  ]
}
```

That warning is by design, not an anomaly — do not discard it. The verdict is veraPDF's `validate_conformance`.
:::
