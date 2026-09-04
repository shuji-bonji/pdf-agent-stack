::: details Worked example — "Which clause defines reading order in tagged PDF?" (§14.8.2.5.1)
- Measured: v0.6.0
- Default spec: `iso32000-2`
- `spec`: omitted
- `section`: `"14.8.2.5.1"`
- Hard wraps: folded to spaces

The section number is the top hit from [`search_spec`](#search-spec) for `content order`. Pass the most specific number you have, `14.8.2.5.1`, not the parent `14.8.2.5`.

**Parameters**

```jsonc
{
  "section": "14.8.2.5.1"
}
```

**Returned JSON**

```jsonc
{
  "sectionNumber": "14.8.2.5.1",
  "title": "General",
  "pageRange": { "start": 764, "end": 764 },
  "content": [
    { "type": "heading", "level": 5, "text": "14.8.2.5.1 General" },
    {
      "type": "paragraph",
      "text": "Page content order shall be defined by the sequencing of graphics objects within a page’s content stream."
    },
    {
      "type": "paragraph",
      "text": "Logical content order – the ordering for semantic purposes – shall be defined by a depth-first traversal of the document’s logical structure hierarchy."
    },
    {
      "type": "paragraph",
      "text": "The page content order in a tagged PDF should coincide with the logical content order."
    },
    {
      "type": "note",
      "label": "NOTE 1",
      "text": "Page content order is constrained by the need to render objects in an order that produces the desired visual appearance. …"
    }
  ]
}
```

shall in a `paragraph` is a requirement, should is a recommendation, and `note` is informative. Do not use a `note` element as grounds for a shall violation.
:::
