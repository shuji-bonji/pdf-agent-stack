::: details 呼び出し例 — 「どんなフォントが埋め込まれている？」
- 実測: v0.15.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

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
