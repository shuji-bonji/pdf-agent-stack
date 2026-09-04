::: details 呼び出し例 — 「タグ構造を観測して」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

木の全体は省略し、集計だけ示します。

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "isTagged": true,
  "maxDepth": 5,
  "totalElements": 29,
  "roleCounts": {
    "Document": 1,
    "H1": 2,
    "P": 3,
    "H2": 2,
    "Table": 1,
    "TR": 4,
    "TH": 4,
    "TD": 12
  }
}
```

合否は返しません。PDF/UA の判定は pdf-verify-mcp の `validate_conformance` です。
:::
