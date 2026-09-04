::: details Worked example — "Quote the PDF/A conformance requirements from the clauses"
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- Arrays: trimmed to the first items

ISO 19005 is not in the corpus, so read `coverage.gaps` before searching clauses. An empty object is enough.

**Parameters**

```jsonc
{}
```

**Returned JSON** (`specs` — 17 entries — omitted; `coverage.gaps` is the point):

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

From here the job belongs to pdf-verify-mcp's `validate_conformance` (`flavour` `"pdfa-*"`). Calling `search_spec` with `"PDF/A"` on this server and getting zero hits does not mean "no such requirement".
:::
