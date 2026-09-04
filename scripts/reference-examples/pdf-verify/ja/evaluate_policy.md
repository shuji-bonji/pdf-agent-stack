::: warning 判定は `evaluate_policy` が返す。LLM は説明文だけを書く
`firedRules` / `advisories` は結果の説明に使います。判定の上書きには使いません。advisory を失敗と読まないでください。advisory が無いことを合格と読まないでください。
:::

::: warning 信頼アンカー無しは `use_with_caution` 止まり
`trust_anchors` を渡さないと署名者の本人性は `not_evaluated` のままです。`trust_and_use` にはなりません。
:::

::: details 呼び出し例 — 「業務に載せてよいか（general、アンカー無し）」
- 実測: v0.26.0
- 標本: `docs/specimens/selfmade-pades-lta.pdf`（呼び出すときは絶対パス）
- `profile`: `"general"`
- `response_format`: `"json"`

**パラメータ**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "profile": "general",
  "response_format": "json"
}
```

**返る JSON**（`facts` は省略）

```jsonc
{
  "profile": "general",
  "verdict": "use_with_caution",
  "firedRules": [
    {
      "ruleId": "POL-CAUTION-TRUST-NOT-EVALUATED",
      "verdict": "use_with_caution",
      "reason": "Cryptographic integrity confirmed but signer identity NOT evaluated (no trust anchors): Sig1"
    },
    {
      "ruleId": "POL-CAUTION-REVOCATION-UNKNOWN",
      "verdict": "use_with_caution",
      "reason": "Revocation status could not be confirmed …"
    }
  ],
  "advisories": [
    "Content was added after signing (incremental update): … — incremental updates are permitted in PDF …"
  ]
}
```

同じ事実と同じ `profile` からは常に同じ判定です。
:::
