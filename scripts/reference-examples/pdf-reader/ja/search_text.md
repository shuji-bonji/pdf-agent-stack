::: details 呼び出し例 — 「『請求明細』は何ページ？」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `query`: `"請求明細"`
- `response_format`: `"json"`

検索対象は `read_text` と同じテキストです。

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "query": "請求明細",
  "max_results": 3,
  "response_format": "json"
}
```

**返る JSON**

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
