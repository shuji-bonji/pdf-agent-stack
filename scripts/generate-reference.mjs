#!/usr/bin/env node
/**
 * generate-reference.mjs — Tool reference pages generated from the servers themselves.
 *
 * Spawns each MCP server over stdio, performs the MCP handshake, and renders
 * `tools/list` into Markdown reference pages (en + ja) for the VitePress site.
 * The site cannot lie about the implementation: everything on the page comes
 * from the running server, not from hand-written prose.
 *
 * Usage:
 *   node scripts/generate-reference.mjs             # all servers in REGISTRY
 *   node scripts/generate-reference.mjs pdf-reader  # one server
 *
 * Dependency-free by design (raw JSON-RPC over stdio, no MCP SDK import).
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Server registry: how to start each server, and where its pages go. */
const REGISTRY = {
  'pdf-spec': {
    npm: '@shuji-bonji/pdf-spec-mcp',
    command: 'node',
    args: [join(ROOT, 'mcp/pdf-spec-mcp/dist/index.js')],
    env: {},
    out: 'reference/mcp/pdf-spec.md'
  },
  'pdf-reader': {
    npm: '@shuji-bonji/pdf-reader-mcp',
    command: 'node',
    args: [join(ROOT, 'mcp/pdf-reader-mcp/dist/index.js')],
    env: {},
    out: 'reference/mcp/pdf-reader.md'
  },
  'pdf-verify': {
    npm: '@shuji-bonji/pdf-verify-mcp',
    command: 'node',
    args: [join(ROOT, 'mcp/pdf-verify-mcp/dist/index.js')],
    env: {},
    out: 'reference/mcp/pdf-verify.md'
  },
  'pdf-writer': {
    npm: '@shuji-bonji/pdf-writer-mcp',
    command: 'node',
    args: [join(ROOT, 'mcp/pdf-writer-mcp/dist/index.js')],
    env: {},
    out: 'reference/mcp/pdf-writer.md'
  }
};

const LOCALES = [
  {
    dir: 'site/docs',
    lang: 'en',
    t: {
      title: (name) => `${name} — Tools Reference`,
      generated: (v, n, date) =>
        `Auto-generated from the \`tools/list\` handshake of **v${v}** (${n} tools, ${date}). ` +
        'Do not edit by hand — regenerate with `node scripts/generate-reference.mjs`.',
      toc: 'Tools',
      tool: 'Tool',
      summary: 'Summary',
      params: 'Parameters',
      noParams: 'No parameters.',
      param: 'Parameter',
      type: 'Type',
      required: 'Required',
      default: 'Default',
      desc: 'Description',
      returns: 'Returns',
      deprecated: 'Deprecated',
      yes: 'yes',
      no: 'no',
      frontmatter: (name, v, n) =>
        `Tools reference for ${name} v${v} — parameters, types, defaults and returns of all ${n} tools, generated from the server's tools/list.`
    }
  },
  {
    dir: 'site/docs/ja',
    lang: 'ja',
    t: {
      title: (name) => `${name} — ツールリファレンス`,
      generated: (v, n, date) =>
        `**v${v}** の \`tools/list\` ハンドシェイクから自動生成（${n} ツール・${date}）。` +
        '手で編集しない — 再生成は `node scripts/generate-reference.mjs`。' +
        '日本語訳は翻訳メモリ（scripts/i18n）から適用され、原文が更新された項目は同期されるまで英語で表示される。',
      toc: 'ツール一覧',
      tool: 'ツール',
      summary: '概要',
      params: '引数',
      noParams: '引数なし。',
      param: '引数',
      type: '型',
      required: '必須',
      default: '既定値',
      desc: '説明',
      returns: '戻り値',
      deprecated: '非推奨',
      yes: '必須',
      no: '任意',
      frontmatter: (name, v, n) =>
        `${name} v${v} の全 ${n} ツールの引数・型・既定値・戻り値（tools/list から自動生成）`
    }
  }
];

/* ---------------- translation memory (ja) ----------------
 *
 * The servers speak English; the ja pages are translated through a
 * translation memory at scripts/i18n/<server>.ja.json:
 *
 *   { "<tool>|<field>": { "src": "<md5 of the English source>", "text": "<ja>" } }
 *
 * A translation is used only while the md5 of the English source matches —
 * when upstream wording changes, the entry goes stale and the generator
 * falls back to English, listing the gap in scripts/i18n/pending-<server>.ja.json.
 * Translate the pending entries (DeepL — see deepl-glossary-translation),
 * merge them into the memory, regenerate. Nothing is written by hand.
 */

const md5 = (s) => createHash('md5').update(s).digest('hex');

function loadMemory(server) {
  const p = join(ROOT, 'scripts/i18n', `${server}.ja.json`);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : {};
}

/** Returns a translate function for the locale + a pending collector. */
function makeTr(lang, memory, pending) {
  if (lang !== 'ja') return (tool, field, en) => en;
  const seen = new Set();
  return (tool, field, en) => {
    if (!en) return en;
    const key = `${tool}|${field}`;
    const hit = memory[key];
    if (hit && hit.src === md5(en)) return hit.text;
    if (!seen.has(key)) {
      seen.add(key);
      pending.push({ key, src: md5(en), en, stale: Boolean(hit) });
    }
    return en; // fall back to the English source, never to a stale translation
  };
}

/* ---------------- MCP handshake (raw JSON-RPC over stdio) ---------------- */

function handshake(cfg) {
  return new Promise((resolveHS, rejectHS) => {
    const p = spawn(cfg.command, cfg.args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...cfg.env }
    });
    let stderrTail = '';
    p.stderr.on('data', (d) => {
      stderrTail = (stderrTail + d).slice(-2000);
    });
    const timer = setTimeout(() => {
      p.kill();
      rejectHS(
        new Error(`handshake timeout (20s)${stderrTail ? `\n--- server stderr (tail) ---\n${stderrTail}` : ''}`)
      );
    }, 20_000);

    let buf = '';
    const pending = new Map();
    // Tolerate non-JSON lines: native-binding warnings may leak onto stdout.
    p.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id != null && pending.has(msg.id)) pending.get(msg.id)(msg);
      }
    });
    p.on('error', rejectHS);

    const send = (m) => p.stdin.write(JSON.stringify(m) + '\n');
    const rpc = (id, method, params) =>
      new Promise((res) => {
        pending.set(id, res);
        send({ jsonrpc: '2.0', id, method, params });
      });

    (async () => {
      const init = await rpc(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'generate-reference', version: '0.0.1' }
      });
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      const tools = await rpc(2, 'tools/list', {});
      clearTimeout(timer);
      p.kill();
      resolveHS({
        serverInfo: init.result.serverInfo,
        tools: tools.result.tools
      });
    })().catch((e) => {
      clearTimeout(timer);
      p.kill();
      rejectHS(e);
    });
  });
}

/* ---------------- Markdown rendering ---------------- */

/** Escape text destined for prose: bare HTML-ish tags break VitePress (Vue). */
function proseSafe(s) {
  // Leave tags alone when they are already inside backticks.
  return s.replace(/(?<!`)<(\/?[A-Za-z][\w-]*)>(?!`)/g, '`<$1>`');
}

/** Escape text destined for a table cell. */
function cellSafe(s) {
  return proseSafe(s).replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

/** Human-readable type for a JSON Schema property. */
function typeOf(schema) {
  if (schema.enum) return schema.enum.map((v) => `\`${JSON.stringify(v)}\``).join(' \\| ');
  if (schema.type === 'array') {
    const item = schema.items ? typeOf(schema.items) : 'any';
    return `${item}[]`;
  }
  let t = Array.isArray(schema.type) ? schema.type.join(' \\| ') : (schema.type ?? 'any');
  const bounds = [];
  if (schema.minimum != null && schema.maximum != null) bounds.push(`${schema.minimum}–${schema.maximum}`);
  else if (schema.minimum != null) bounds.push(`≥ ${schema.minimum}`);
  else if (schema.maximum != null) bounds.push(`≤ ${schema.maximum}`);
  if (schema.minLength != null) bounds.push(`minLength ${schema.minLength}`);
  if (bounds.length) t += ` (${bounds.join(', ')})`;
  return t;
}

/** Flatten (possibly nested) properties into table rows. */
function paramRows(schema, prefix = '', requiredList = schema.required ?? []) {
  const rows = [];
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    const path = prefix ? `${prefix}.${name}` : name;
    rows.push({
      name: path,
      type: typeOf(prop),
      required: requiredList.includes(name),
      def: prop.default !== undefined ? `\`${JSON.stringify(prop.default)}\`` : '',
      desc: prop.description ?? ''
    });
    if (prop.type === 'object' && prop.properties)
      rows.push(...paramRows(prop, path, prop.required ?? []));
    if (prop.type === 'array' && prop.items?.type === 'object' && prop.items.properties)
      rows.push(...paramRows(prop.items, `${path}[]`, prop.items.required ?? []));
  }
  return rows;
}

/**
 * Split a server description into prose / returns.
 * Family convention: "...prose...\n\nArgs:\n  - ...\n\nReturns:\n  ..." —
 * the Args block duplicates the schema table, so it is dropped.
 */
function splitDescription(desc) {
  const argsAt = desc.search(/\n\s*Args:\s*\n/);
  const returnsAt = desc.search(/\n\s*Returns:\s*\n/);
  const proseEnd = argsAt >= 0 ? argsAt : returnsAt >= 0 ? returnsAt : desc.length;
  const prose = desc.slice(0, proseEnd).trim();
  let returns = '';
  if (returnsAt >= 0) {
    returns = desc
      .slice(returnsAt)
      .replace(/^\n\s*Returns:\s*\n/, '')
      .replace(/\n {2}/g, '\n')
      .trim();
  }
  return { prose, returns };
}

function firstSentence(prose) {
  // First paragraph, joined to one line, then first sentence.
  // 。 ends a sentence with no following space (Japanese); '.' needs one.
  const para = prose.split(/\n\s*\n/)[0].replace(/\n/g, ' ');
  const m = para.match(/^(.+?(?:。|\.(?=\s|$)))/);
  return (m ? m[1] : para).trim();
}

function renderPage(server, info, tools, t, lang, tr) {
  const date = new Date().toISOString().slice(0, 10);
  // Scoped server names ("@shuji-bonji/pdf-spec-mcp") break YAML frontmatter
  // (a value starting with "@" is a reserved indicator) and read inconsistently
  // next to unscoped ones — display without the scope, and always quote.
  const displayName = info.name.replace(/^@[^/]+\//, '');
  const L = [];
  L.push('---');
  L.push(`description: ${JSON.stringify(t.frontmatter(displayName, info.version, tools.length))}`);
  L.push('---');
  L.push('');
  L.push(`# ${t.title(displayName)}`);
  L.push('');
  L.push('<!-- GENERATED FILE — do not edit. Source of truth: the server itself. -->');
  L.push('');
  L.push('::: info');
  L.push(t.generated(info.version, tools.length, date));
  L.push(':::');
  L.push('');
  L.push(`## ${t.toc}`);
  L.push('');
  L.push(`| ${t.tool} | ${t.summary} |`);
  L.push('|---|---|');
  for (const tool of tools) {
    const { prose } = splitDescription(tool.description ?? '');
    L.push(
      `| [\`${tool.name}\`](#${tool.name.replace(/_/g, '-')}) | ${cellSafe(firstSentence(tr(tool.name, 'prose', prose)))} |`
    );
  }
  L.push('');

  for (const tool of tools) {
    let { prose, returns } = splitDescription(tool.description ?? '');
    prose = tr(tool.name, 'prose', prose);
    returns = tr(tool.name, 'returns', returns);
    const deprecated = /deprecat/i.test(tool.description ?? '');
    L.push(`## ${tool.name}`);
    L.push('');
    if (tool.title) L.push(`**${tool.title}**`);
    L.push('');
    if (deprecated) {
      L.push(`::: warning ${t.deprecated}`);
      L.push(':::');
      L.push('');
    }
    L.push(proseSafe(prose));
    L.push('');
    L.push(`### ${t.params}`);
    L.push('');
    const rows = paramRows(tool.inputSchema ?? {});
    if (rows.length === 0) {
      L.push(t.noParams);
    } else {
      L.push(`| ${t.param} | ${t.type} | ${t.required} | ${t.default} | ${t.desc} |`);
      L.push('|---|---|---|---|---|');
      for (const r of rows) {
        L.push(
          `| \`${r.name}\` | ${r.type} | ${r.required ? `**${t.yes}**` : t.no} | ${r.def} | ${cellSafe(tr(tool.name, `param:${r.name}`, r.desc))} |`
        );
      }
    }
    L.push('');
    if (returns) {
      L.push(`### ${t.returns}`);
      L.push('');
      L.push(proseSafe(returns));
      L.push('');
    }
  }
  return L.join('\n');
}

/* ---------------- version sync (hand-written pages) ----------------
 *
 * The hand-written MCP pages state each server's current version in two places:
 * the overview table (mcp/index.md) and the page header ("current v0.11.1").
 * Both are updated here from the same handshake the reference is generated from,
 * so a released server never leaves a stale number behind on the site.
 * Only the numbers move — the prose around them is left alone.
 */

function syncVersions(server, info, toolCount) {
  const npmName = REGISTRY[server].npm;
  const edits = [];

  for (const locale of LOCALES) {
    // 1) page header: "- npm: `@scope/name` / current v0.0.0"
    const pagePath = join(ROOT, locale.dir, `mcp/${server}.md`);
    if (existsSync(pagePath)) {
      const before = readFileSync(pagePath, 'utf8');
      const after = before.replace(
        new RegExp(`(\`${npmName.replace(/[/@]/g, '\\$&')}\`\\s*/\\s*(?:現行|current)\\s+v)[0-9][^\\s]*`),
        `$1${info.version}`
      );
      if (after !== before) {
        writeFileSync(pagePath, after);
        edits.push(`${locale.lang} mcp/${server}.md`);
      }
    }

    // 2) overview table row: "| [name](link) | layer | 0.0.0 | 18 | … |"
    const indexPath = join(ROOT, locale.dir, 'mcp/index.md');
    if (existsSync(indexPath)) {
      const before = readFileSync(indexPath, 'utf8');
      const after = before.replace(
        new RegExp(`(^\\|\\s*\\[${server}-mcp\\]\\([^)]*\\)\\s*\\|[^|]*\\|\\s*)[0-9][^|\\s]*(\\s*\\|\\s*)\\d+(\\s*\\|)`, 'm'),
        `$1${info.version}$2${toolCount}$3`
      );
      if (after !== before) {
        writeFileSync(indexPath, after);
        edits.push(`${locale.lang} mcp/index.md`);
      }
    }
  }
  return edits;
}

/* ---------------- pdf-constraints (library, not a server) ----------------
 *
 * pdf-constraints ships as a library, so there is no handshake to read a version
 * from. Its two facts that go stale — the released version and how many constraints
 * each bundled table holds — are taken from measurements instead:
 *   version : stack.json (generated from `npm view`, and committed, so CI has it)
 *   counts  : lib/pdf-constraints/tables/*.json (gitignored working tree; skipped
 *             on CI, exactly like mcp/)
 * A table that ships without a row on the page is reported loudly: coverage that
 * was built but never written down is coverage nobody can see.
 */

const CONSTRAINTS_NPM = '@shuji-bonji/pdf-constraints';
const CONSTRAINTS_PAGE = 'reference/pdf-constraints.md';

function syncConstraints() {
  const edits = [];

  let version = null;
  const stackPath = join(ROOT, 'stack.json');
  if (existsSync(stackPath)) {
    const stack = JSON.parse(readFileSync(stackPath, 'utf8'));
    version = stack.repos?.find((r) => r.npm === CONSTRAINTS_NPM)?.published ?? null;
  }

  /** domain -> constraint count, from the tables themselves */
  const counts = new Map();
  const tablesDir = join(ROOT, 'lib/pdf-constraints/tables');
  if (existsSync(tablesDir)) {
    for (const file of readdirSync(tablesDir)) {
      if (!file.endsWith('.json') || file === 'schema.json') continue;
      const table = JSON.parse(readFileSync(join(tablesDir, file), 'utf8'));
      counts.set(file.replace(/\.json$/, ''), (table.constraints ?? []).length);
    }
  }

  for (const locale of LOCALES) {
    const pagePath = join(ROOT, locale.dir, CONSTRAINTS_PAGE);
    if (!existsSync(pagePath)) continue;
    const before = readFileSync(pagePath, 'utf8');
    let after = before;

    if (version) {
      after = after.replace(
        new RegExp(`(\`${CONSTRAINTS_NPM.replace(/[/@]/g, '\\$&')}\`\\s*/\\s*(?:現行|current)\\s+v)[0-9][^\\s]*`),
        `$1${version}`
      );
    }

    if (counts.size) {
      const seen = new Set();
      after = after.replace(
        /(<!-- constraints:tables -->)([\s\S]*?)(<!-- \/constraints:tables -->)/,
        (_all, open, body, close) => {
          const rows = body.split('\n').map((line) => {
            const cells = line.split('|');
            // | `domain` | clauses | count | what it looks at |
            if (cells.length < 6) return line;
            const domain = cells[1].trim().replace(/^`|`$/g, '');
            if (!counts.has(domain)) return line;
            seen.add(domain);
            cells[3] = ` ${counts.get(domain)} `;
            return cells.join('|');
          });
          return open + rows.join('\n') + close;
        }
      );
      for (const domain of counts.keys()) {
        if (!seen.has(domain)) {
          console.warn(
            `  ⚠ ${locale.lang}: table "${domain}" ships but has no row in ${CONSTRAINTS_PAGE}`
          );
        }
      }
    }

    if (after !== before) {
      writeFileSync(pagePath, after);
      edits.push(`${locale.lang} ${CONSTRAINTS_PAGE}`);
    }
  }
  return edits;
}

/* ---------------- main ---------------- */

const targets = process.argv.slice(2);
const names = targets.length ? targets : Object.keys(REGISTRY);

for (const name of names) {
  const cfg = REGISTRY[name];
  if (!cfg) {
    console.error(`unknown server: ${name} (known: ${Object.keys(REGISTRY).join(', ')})`);
    process.exit(1);
  }
  // mcp/ is a local-only working tree (gitignored) — on CI and fresh clones the
  // server dists do not exist. Skip and build from the committed pages there;
  // a present-but-broken server still fails the build (stale pages must not ship
  // silently when regeneration was possible).
  if (!existsSync(cfg.args[0])) {
    console.warn(`⚠ skip ${name}: server dist not found (${cfg.args[0]}) — using committed pages`);
    continue;
  }
  const { serverInfo, tools } = await handshake(cfg);
  console.log(`${serverInfo.name} v${serverInfo.version} — ${tools.length} tools`);
  const memory = loadMemory(name);
  const pending = [];
  for (const locale of LOCALES) {
    const tr = makeTr(locale.lang, memory, pending);
    const outPath = join(ROOT, locale.dir, cfg.out);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, renderPage(name, serverInfo, tools, locale.t, locale.lang, tr));
    console.log(`  wrote ${outPath.replace(ROOT + '/', '')}`);
  }
  for (const edited of syncVersions(name, serverInfo, tools.length)) {
    console.log(`  synced version in ${edited}`);
  }
  const pendingPath = join(ROOT, 'scripts/i18n', `pending-${name}.ja.json`);
  if (pending.length) {
    mkdirSync(dirname(pendingPath), { recursive: true });
    writeFileSync(pendingPath, JSON.stringify(pending, null, 2));
    const stale = pending.filter((p) => p.stale).length;
    console.warn(
      `  ⚠ ja: ${pending.length} untranslated strings (${stale} stale) — English shown as fallback.` +
        ` Translate ${pendingPath.replace(ROOT + '/', '')} into scripts/i18n/${name}.ja.json and regenerate.`
    );
  } else {
    try {
      rmSync(pendingPath, { force: true });
    } catch {
      // Some sandboxed filesystems forbid unlink; an empty pending list is
      // equivalent to no pending file.
      if (existsSync(pendingPath)) writeFileSync(pendingPath, '[]\n');
    }
    console.log('  ja: translation memory complete');
  }
}

// The library page is not tied to any one server, so it is synced once at the end
// (and also when a single server was regenerated — the numbers are cheap to check).
for (const edited of syncConstraints()) {
  console.log(`synced pdf-constraints numbers in ${edited}`);
}
