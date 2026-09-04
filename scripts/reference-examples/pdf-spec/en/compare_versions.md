::: details Worked example — "How did the incremental-update clause change between PDF 1.7 and 2.0?"
- Measured: v0.6.0
- `section`: `"7.5.6"`
- Requires: both PDF 1.7 and PDF 2.0 in `PDF_SPEC_DIR`

**Parameters**

```jsonc
{
  "section": "7.5.6"
}
```

**Returned JSON**

```jsonc
{
  "totalMatched": 1,
  "totalAdded": 0,
  "totalRemoved": 0,
  "matched": [
    {
      "section17": "7.5.6",
      "section20": "7.5.6",
      "title": "Incremental updates",
      "status": "same"
    }
  ],
  "added": [],
  "removed": []
}
```

Section number and title are the same in 1.7 and 2.0. The tool does not return a body diff. To see the requirements themselves, call [`get_requirements`](#get-requirements) on that section for both specs (`spec: "pdf17"` and the default `iso32000-2`).
:::
