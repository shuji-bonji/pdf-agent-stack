// Usage: MCPS_ROOT=/path/to/mcps node scripts/extract-tools.mjs > tooldump.md
// 各 MCP リポジトリのビルド済み dist からツール定義（名前・説明・引数スキーマ）を抽出する。
// サイトのツール表・マニュアルの正はこの出力（＝実装）。手書きで乖離させないこと。
import { createRequire } from "module";

const ROOT = process.env.MCPS_ROOT;
if (!ROOT) { console.error("MCPS_ROOT is required"); process.exit(1); }

const fmt = (props, req) => Object.entries(props ?? {}).map(([k, v]) => {
  const type = v.type ?? (v.anyOf ? v.anyOf.map(a => a.type ?? "obj").join("|") : "object");
  const en = v.enum ? ` [${v.enum.join(" / ")}]` : "";
  const it = v.items?.type ? `<${v.items.type}>` : "";
  const dflt = v.default !== undefined ? ` (default: ${JSON.stringify(v.default)})` : "";
  return `| \`${k}\`${(req ?? []).includes(k) ? " **必須**" : ""} | ${type}${it}${en}${dflt} | ${(v.description ?? "").replace(/\n/g, " ")} |`;
}).join("\n");

const toJson = (repo, schema) => {
  const req = createRequire(`${ROOT}/${repo}/`);
  const z = req("zod");
  try {
    if (!schema) return {};
    if (schema._def) return req("zod-to-json-schema").zodToJsonSchema(schema);
    const shape = Object.fromEntries(Object.entries(schema).filter(([, v]) => v && (v._def || v.def)));
    return req("zod/package.json").version.startsWith("4")
      ? z.toJSONSchema(z.object(shape))
      : req("zod-to-json-schema").zodToJsonSchema(z.object(shape));
  } catch (e) { console.error(`schema fail ${repo}: ${e.message}`); return {}; }
};

const emit = (repo, t, schema) => {
  const js = toJson(repo, schema);
  console.log(`\n### ${repo} :: ${t.name}\n${t.description}\n${fmt(js.properties, js.required)}`);
};

// definitions.ts 型（spec / writer）
for (const repo of ["pdf-spec-mcp", "pdf-writer-mcp"]) {
  const m = await import(`${ROOT}/${repo}/dist/tools/definitions.js`);
  for (const t of Object.values(m).find(Array.isArray)) emit(repo, t, t.shape ?? t.inputSchema);
}

// registerAllTools 型（verify）
{
  const out = [];
  const fake = { registerTool: (name, cfg) => out.push({ name, ...cfg }) };
  const m = await import(`${ROOT}/pdf-verify-mcp/dist/tools/index.js`);
  await m.registerAllTools(fake, {});
  for (const t of out) emit("pdf-verify-mcp", t, t.inputSchema);
}

// tier ディレクトリ + register* 型（reader）
{
  const fs = await import("node:fs");
  const out = [];
  const fake = { registerTool: (name, cfg) => out.push({ name, ...cfg }) };
  for (const tier of ["tier1", "tier2", "tier3"]) {
    const dir = `${ROOT}/pdf-reader-mcp/dist/tools/${tier}`;
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith(".js") && !f.endsWith(".map"))) {
      const m = await import(`${dir}/${f}`);
      for (const [k, fn] of Object.entries(m))
        if (k.startsWith("register") && typeof fn === "function") await fn(fake, {});
    }
  }
  for (const t of out) emit("pdf-reader-mcp", t, t.inputSchema);
}
