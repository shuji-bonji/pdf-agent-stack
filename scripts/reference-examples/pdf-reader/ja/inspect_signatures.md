::: details 呼び出し例 — 「署名フィールドの構造を見せて」
- 実測: v0.15.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

暗号学的検証はしません。

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "totalFields": 2,
  "signedCount": 2,
  "unsignedCount": 0,
  "fields": [
    {
      "fieldName": "Sig1",
      "isSigned": true,
      "reason": "known-good specimen",
      "signingTime": "D:20260811163237+09'00'",
      "filter": "Adobe.PPKLite",
      "subFilter": "ETSI.CAdES.detached"
    },
    {
      "fieldName": "Timestamp-938ea022-8782-4761-b0a2-a5ba44d069e4",
      "isSigned": true,
      "filter": "Adobe.PPKLite",
      "subFilter": "ETSI.RFC3161"
    }
  ],
  "note": "Cryptographic signature verification is not performed. Only field structure is inspected."
}
```

署名が数学的に有効かは pdf-verify-mcp の `verify_signatures` / `verify_integrity` です。
:::
