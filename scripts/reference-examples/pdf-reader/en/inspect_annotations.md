::: details Worked example — "Are there any annotations?"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `response_format`: `"json"`

Zero means "read and found none", not "could not read".

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
  "totalAnnotations": 0,
  "bySubtype": {},
  "byPage": { "1": 0 },
  "annotations": [],
  "hasLinks": false,
  "hasForms": false,
  "hasMarkup": false
}
```
:::
