# Tool-reference worked examples

Hand-written call examples appended to the generated tools reference
(`site/docs/reference/mcp/*.md` and `site/docs/ja/reference/mcp/*.md`).

`node scripts/generate-reference.mjs` reads these files. The generated
page itself is not edited by hand.

## Path

```
scripts/reference-examples/<server>/<lang>/<tool>.md
```

- `<server>`: `pdf-spec` / `pdf-reader` / `pdf-verify` / `pdf-writer`
- `<lang>`: `en` or `ja`
- `<tool>`: the tool name (`list_specs`, `search_spec`, …)

If the file is missing, that tool gets no sidecar. pdf-spec, pdf-reader,
pdf-verify and pdf-writer have files. A tool without a measured JSON may
still have VitePress containers only (cautions, no `::: details`).

Agent-facing `description` text (scope preamble, Examples, dense enums)
is reshaped for humans in `scripts/reference-humanize.mjs` after
translation — do not duplicate those tables in the sidecar.

## File shape

The file is Markdown appended as-is after that tool's parameters (and
returns, if any). Wrap measured JSON in VitePress `::: details` so it
stays closed until opened. Operational cautions go in `::: warning` /
`::: danger` / `::: tip` / `::: info` above the details block (or alone,
when there is no measured JSON).

````markdown
::: warning Always pass `outputPath`
Omitting it returns the whole PDF as base64.
:::

::: details Worked example — "the prompt"
- Measured: v0.21.0
- Specimen: `docs/specimens/publish-demo.pdf` (pass an absolute path)

**Parameters**

```jsonc
{ "inputPath": "/absolute/path/to/docs/specimens/publish-demo.pdf" }
```

**Returned JSON**

```jsonc
{ "pageCount": 1 }
```
:::
````

A file may contain more than one `::: details` block (two prompts for
the same tool). Extra notes after the preamble list stay as a sentence
after the JSON, or as extra bullets.
