::: details Worked example — "Which fonts are embedded?"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "fonts": [
    {
      "name": "OAFEEB+NotoSansJP-Regular",
      "type": "Type0",
      "encoding": "Identity-H",
      "isEmbedded": true,
      "isSubset": true,
      "pagesUsed": [1]
    }
  ],
  "totalFontCount": 1,
  "embeddedCount": 1,
  "subsetCount": 1,
  "pagesScanned": 1
}
```
:::
