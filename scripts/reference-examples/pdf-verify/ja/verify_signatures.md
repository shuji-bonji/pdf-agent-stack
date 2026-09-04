::: warning `valid` は本人ではない
`verdict`（暗号計算の一致）と `trust`（証明書チェーン）と失効状態は独立です。`trust_anchors`（または `PDF_VERIFY_TRUST_ANCHORS`）を渡さなければ `trust` は `not_evaluated` のままです。そのときの `valid` はダイジェストが一致した、という意味であって、署名者が本人であることの証明ではありません。
:::

::: details 呼び出し例 — 「この署名は暗号学的に有効か。信頼アンカーも渡して」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- 信頼アンカー: `docs/specimens/selfmade-ca.pem`
- `response_format`: `"json"`
- `check_revocation`: `"embedded"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "trust_anchors": ["/absolute/path/to/docs/specimens/selfmade-ca.pem"],
  "check_revocation": "embedded",
  "response_format": "json"
}
```

**返る JSON**（`cms` の詳細と 2 件目の文書タイムスタンプは省略）

```jsonc
{
  "scope": { "chainStop": { "kind": "complete" }, "reconstructed": false, "objects": 38 },
  "signatures": [
    {
      "fieldName": "Sig1",
      "subFilter": "ETSI.CAdES.detached",
      "verdict": "valid",
      "trust": {
        "status": "trusted",
        "certificatePath": [
          "C=JP, O=PDF Agent Stack Test, CN=Test TSA",
          "C=JP, O=PDF Agent Stack Test, CN=Test Root CA"
        ]
      },
      "revocation": {
        "status": "unknown",
        "detail": "No embedded revocation information found …"
      },
      "coversEntireFile": false,
      "bytesAfterSignedRange": 17188
    }
  ]
}
```

`revocation.status` が `unknown` なら、「失効していない」とは言えません。
:::
