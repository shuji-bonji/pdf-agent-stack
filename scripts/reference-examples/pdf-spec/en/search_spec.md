::: details Worked example — "What does PDF 2.0 require of incremental updates?"
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `query`: `"incremental update"`
- `max_results`: `5`
- Arrays: trimmed; PDF hard wraps folded to spaces

Search with an English phrase. Pass the hitting section to [`get_requirements`](#get-requirements).

**Parameters**

```jsonc
{
  "query": "incremental update",
  "max_results": 5
}
```

**Returned JSON**

```jsonc
{
  "query": "incremental update",
  "totalResults": 5,
  "results": [
    {
      "section": "7.5.6",
      "title": "Incremental updates",
      "page": 75,
      "score": 12,
      "snippet": "7.5.6 Incremental updates The contents of a PDF file can be updated incrementally without rewriting…"
    },
    {
      "section": "12.7.8.3.1",
      "title": "General",
      "page": 576,
      "score": 12,
      "snippet": "…A stream containing all the bytes in all incremental updates made to the underlying PDF document…"
    }
    // … 3 more (7.5.4 / 12.8.1 / 7.5.1)
  ]
}
```

The top hit is §7.5.6. When you want requirements only, pass that section to [`get_requirements`](#get-requirements).
:::

::: details Worked example — "Which clause defines reading order in tagged PDF?"
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `query`: `"content order"`
- `max_results`: `5`

Everyday English `reading order` surfaces other clauses first (how streams are read, vertex order in shadings, and so on). The specification's terms are **logical content order** / **page content order**.

**Parameters**

```jsonc
{
  "query": "content order",
  "max_results": 5
}
```

**Returned JSON**

```jsonc
{
  "query": "content order",
  "totalResults": 5,
  "results": [
    {
      "section": "14.8.2.5.1",
      "title": "General",
      "page": 764,
      "score": 39,
      "snippet": "14.8.2.5.1 General Page content order shall be defined by the sequencing of graphics objects within …"
    }
    // … 4 more
  ]
}
```

When you want the body, call [`get_section`](#get-section) with the most specific section number you now have. That is `14.8.2.5.1`, not the parent `14.8.2.5`.
:::
