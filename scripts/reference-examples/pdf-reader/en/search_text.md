::: details Worked example — "Which page is 『請求明細』 on?"
- Measured: v0.15.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)
- `query`: `"請求明細"`
- `response_format`: `"json"`

The search runs over the same text `read_text` returns.

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "query": "請求明細",
  "max_results": 3,
  "response_format": "json"
}
```

**Returned JSON**

```jsonc
{
  "scope": {
    "textExtraction": { "status": "read" },
    "extractabilityObservation": { "status": "read" }
  },
  "query": "請求明細",
  "totalMatches": 1,
  "matches": [
    {
      "page": 1,
      "lineIndex": 5,
      "text": "請求明細",
      "contextBefore": "",
      "contextAfter": ""
    }
  ],
  "truncated": false
}
```
:::
