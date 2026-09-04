::: warning 失敗無し ≠ 適合
bundled の制約だけを見ます。失敗が無いことは適合の証明ではありません。
:::

::: details 呼び出し例 — 「ISO 32000 のメタデータ条文で示せる誤りはあるか」
- 実測: v0.26.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `domains`: `["document-metadata"]`
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "domains": ["document-metadata"],
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "constraintsVersion": "0.6.1",
  "tables": [{ "name": "document-metadata", "version": "1" }],
  "results": [
    { "constraintId": "CT-META-1", "target": "(document)", "status": "pass" },
    { "constraintId": "CT-META-6", "target": "(document)", "status": "not_applicable" }
  ],
  "violations": 0,
  "notDecided": 0,
  "notes": [
    "Checked against the constraints bundled in @shuji-bonji/pdf-constraints — nothing else. The absence of failures is not proof of conformance."
  ]
}
```
:::
