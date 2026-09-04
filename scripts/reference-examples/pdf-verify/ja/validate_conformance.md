::: warning T2（PDF/A）— 「veraPDF が COMPLIANT と判定」まで
ISO 19005 はコーパスにありません。PDF/A の結果は veraPDF の判定です。「ISO 19005 に適合する」とは書きません。
:::

::: warning PDF/UA の代替テキストの意味は機械では決められない
代替テキストが「存在するか」は検査できます。「意味があるか」は人のレビューです。
:::

::: details 呼び出し例 — 「veraPDF は PDF/UA-1 をどう判定したか」
- 実測: v0.26.0
- 標本: `docs/specimens/publish-demo.pdf`（呼び出すときは絶対パス）
- `flavour`: `"pdfua-1"`
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/publish-demo.pdf",
  "flavour": "pdfua-1",
  "response_format": "json"
}
```

**返る JSON**

```jsonc
{
  "engine": "verapdf",
  "authoritativeValidation": { "performed": true, "validator": "verapdf", "version": "1.30.0" },
  "flavour": "PDF/UA-1",
  "compliant": true,
  "checkedRules": 106,
  "passedRules": 106,
  "failedRules": 0,
  "violations": [],
  "notes": [
    "Validated by veraPDF … — authoritative result.",
    "Machine validation cannot judge whether alt text and reading order are semantically appropriate; human review remains necessary."
  ]
}
```

同一標本を `flavour: "pdfa-3b"` で測ると、veraPDF 1.30.0 が 146/146、`compliant: true` でした。PDF/A では「veraPDF が COMPLIANT と判定した」と書きます。
:::
