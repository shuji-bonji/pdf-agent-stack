// E2 試用: reader / verify の全ツールを全検体で json・markdown の両方で呼ぶ。
// 同じプロセスで「順方向」と「逆順」の 2 周を回し、同じ呼び出しの応答が変わらないかも見る。
import { start, serverVersion } from '/home/claude/pdf-agent-stack/eval/e2e/lib.mjs';
import { readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const SP = '/home/claude/e2/specimens';
const files = [];
for (const n of readdirSync(SP)) { const p = join(SP, n); if (statSync(p).isDirectory()) for (const m of readdirSync(p)) files.push(join(p, m)); else files.push(p); }
files.push(join(SP, 'does-not-exist.pdf'));
const key = process.argv[2];
const env = key === 'verify' ? { PDF_VERIFY_VERAPDF: '/nonexistent/verapdf' } : {};
const fmts = ['json', 'markdown'];
const plan = [];
const ARGS = {
  reader: {
    get_page_count: (f) => [{ file_path: f }],
    get_metadata: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    read_text: (f) => fmts.map((r) => ({ file_path: f, response_format: r, pages: '1-2' })),
    search_text: (f) => fmts.map((r) => ({ file_path: f, query: 'PDF', response_format: r })),
    read_images: (f) => [{ file_path: f, pages: '1', max_width: 200 }],
    render_page: (f) => [{ file_path: f, pages: '1', dpi: 36 }],
    summarize: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    inspect_structure: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    inspect_catalog: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    inspect_tags: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    inspect_fonts: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    inspect_annotations: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    inspect_signatures: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    extract_tables: (f) => fmts.map((r) => ({ file_path: f, response_format: r, pages: '1' })),
    extract_structured_text: (f) => fmts.map((r) => ({ file_path: f, response_format: r, pages: '1' })),
    locate_objects: (f) => fmts.map((r) => ({ file_path: f, response_format: r, object_numbers: [1, 2] })),
    compare_structure: (f) => fmts.map((r) => ({ file_path_1: join(SP, 'smoke.pdf'), file_path_2: f, response_format: r })),
  },
  verify: {
    verify_signatures: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    verify_integrity: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    detect_pades_level: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    identify_conformance: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    validate_conformance: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    validate_clauses: (f) => fmts.map((r) => ({ file_path: f, response_format: r })),
    evaluate_policy: (f) => fmts.map((r) => ({ file_path: f, response_format: r, profile: 'general' })),
  },
}[key];
for (const [tool, mk] of Object.entries(ARGS)) for (const f of files) for (const a of mk(f)) plan.push({ tool, args: a });
const s = await start(key, env);
const res = {};
const t0 = Date.now();
for (const [pass, order] of [['A', plan], ['B', [...plan].reverse()]]) {
  for (const p of order) {
    const id = `${p.tool}|${JSON.stringify(p.args)}`;
    const t = Date.now();
    let r;
    try { r = await s.call(p.tool, p.args); r = { isError: r.isError, kinds: r.kinds, text: r.text }; }
    catch (e) { r = { thrown: String(e?.message ?? e) }; }
    r.ms = Date.now() - t;
    (res[id] ??= { tool: p.tool, args: p.args })[pass] = r;
  }
}
await s.close();
mkdirSync('/home/claude/e2/out', { recursive: true });
writeFileSync(`/home/claude/e2/out/${key}.json`, JSON.stringify({ version: serverVersion(key), env, ms: Date.now() - t0, results: Object.values(res) }, null, 1));
const vals = Object.values(res);
console.log(key, serverVersion(key), 'calls', plan.length * 2, 'sec', (Date.now() - t0) / 1000);
console.log('isError', vals.filter((v) => v.A.isError).length, 'thrown', vals.filter((v) => v.A.thrown).length, 'A!=B', vals.filter((v) => v.A.text !== v.B.text || v.A.thrown !== v.B.thrown).length);
