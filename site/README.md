# pdf-agent-stack

Documentation site for the PDF Family — 4 MCP servers (pdf-spec / pdf-reader / pdf-verify / pdf-writer) and 2 skills (pdf-trust / pdf-publish).

Built with VitePress. See `DESIGN.md` for the site design (ja).

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # build to docs/.vitepress/dist
```

Deployed to GitHub Pages via `.github/workflows/deploy.yml` on push to main.
