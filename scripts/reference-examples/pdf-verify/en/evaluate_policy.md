::: warning The verdict is what `evaluate_policy` returns. The LLM writes the explanation only
Use `firedRules` / `advisories` to explain the outcome, never to override it. Do not read an advisory as a failure. Do not read the absence of advisories as a pass.
:::

::: warning Without trust anchors the verdict stops at `use_with_caution`
Without `trust_anchors`, signer identity stays `not_evaluated`. The verdict cannot be `trust_and_use`.
:::

::: details Worked example — "May it be used in the business process? (general, no anchors)"
- Measured: v0.26.0
- Specimen: `docs/specimens/selfmade-pades-lta.pdf` (pass an absolute path)
- `profile`: `"general"`
- `response_format`: `"json"`

**Parameters**

```jsonc
{
  "file_path": "/absolute/path/to/docs/specimens/selfmade-pades-lta.pdf",
  "profile": "general",
  "response_format": "json"
}
```

**Returned JSON** (`facts` omitted)

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

The same facts and the same `profile` always yield the same verdict.
:::
