::: warning T3 — 準拠とは書かない
ETSI EN 319 142 はコーパスに無く、第三者検証器もありません。結果は「構造が B-T に一致する」であって「PAdES B-T に準拠」ではありません。全件に `normativeBasis: "T3"` が付きます。
:::

::: details 呼び出し例 — 「PAdES のどのレベルに構造が一致するか」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `response_format`: `"json"`

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
  "levels": [
    {
      "fieldName": "Sig1",
      "subFilter": "ETSI.CAdES.detached",
      "isPades": true,
      "level": "B-T",
      "normativeBasis": "T3",
      "evidence": {
        "hasSignatureTimestamp": true,
        "hasDss": true,
        "hasVri": true,
        "hasDocumentTimestamp": true
      },
      "ltv": { "revocationDataCoversSigner": false },
      "notes": [
        "DSS is present but its revocation data does not cover the signer certificate — level capped at B-T."
      ]
    }
  ]
}
```

DSS があっても、失効データが署名者証明書を覆っていなければ B-LT にはなりません。
:::
