::: details 呼び出し例 — 「PDF/A の適合要件を条文で示して」
- 実測: v0.6.0
- 既定: `iso32000-2`
- `spec`: 省略
- 配列: 先頭だけ残す

ISO 19005 はコーパスに無いので、条文検索の前に `coverage.gaps` を見ます。パラメータは空オブジェクトです。

**パラメータ**

```jsonc
{}
```

**返る JSON**（`specs` 17 件は省略、`coverage.gaps` が本題）:

```jsonc
{
  "totalSpecs": 17,
  "coverage": {
    "note": "These normative areas are outside this corpus. A search returning no hits for them means \"cannot answer\", not \"no such requirement\".",
    "gaps": [
      {
        "area": "PDF/A — archival conformance",
        "standards": ["ISO 19005-1", "ISO 19005-2", "ISO 19005-3", "ISO 19005-4"],
        "consequence": "Requirements specific to PDF/A cannot be quoted or verified here. … A search returning nothing is not evidence that no requirement exists."
      },
      {
        "area": "PAdES — signature profiles",
        "standards": ["ETSI EN 319 142-1", "ETSI EN 319 142-2"],
        "consequence": "Baseline signature levels (B-B / B-T / B-LT / B-LTA) are defined by ETSI, not by ISO 32000-2. … ISO 32000-2 §12.8 covers signatures in general and is available."
      }
    ]
  }
}
```

PDF/A の判定は pdf-verify-mcp の `validate_conformance`（`flavour` は `"pdfa-*"`）に渡します。このサーバーで `search_spec` に `"PDF/A"` を渡しても、ヒット 0 件は「要求が無い」ではありません。
:::
