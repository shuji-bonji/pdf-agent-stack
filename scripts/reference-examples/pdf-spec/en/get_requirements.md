::: details Worked example — "What does PDF 2.0 require of incremental updates?" (§7.5.6)
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `section`: `"7.5.6"`
- Arrays: trimmed; PDF hard wraps folded to spaces

The section number is the top hit from [`search_spec`](#search-spec) (§7.5.6). Omitting `level` returns shall / may mixed together.

**Parameters**

```jsonc
{
  "section": "7.5.6"
}
```

**Returned JSON**

```jsonc
{
  "filter": { "section": "7.5.6", "level": "all" },
  "totalRequirements": 10,
  "statistics": { "shall": 8, "may": 2 },
  "requirements": [
    {
      "id": "R-7.5.6-1",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "When updating a PDF file incrementally, changes shall be appended to the end of the file, leaving its original contents intact."
    },
    {
      "id": "R-7.5.6-2",
      "level": "shall",
      "section": "7.5.6",
      "sectionTitle": "Incremental updates",
      "text": "A cross-reference section for an incremental update shall contain entries only for objects that have been changed, replaced, or deleted."
    }
    // … 8 more. Only shall is a condition of conformance
  ]
}
```

`text` is verbatim, so it can be quoted. This is a requirement of the standard. Whether the PDF under examination satisfies it is pdf-verify-mcp's `validate_conformance` / `evaluate_policy`.
:::
