import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
const key = process.argv[2]; const fmt = process.argv[3] ?? 'json';
const d = JSON.parse(readFileSync(`/home/claude/e2/out/${key}.json`, 'utf8'));
const pick = ['smoke.pdf','contract-like-signed.pdf','scan-no-text-layer.pdf','pdf20-objstm.pdf','linearized.pdf','enc-aes256-emptyuser.pdf','enc-aes128-emptyuser.pdf','enc-rc4-128-emptyuser.pdf','enc-aes256-userpw.pdf','enc-rc4-128-userpw.pdf','broken-truncated.pdf','empty.pdf','not-a-pdf.pdf','does-not-exist.pdf','スモーク 1.pdf'];
const abbr = (s) => s.replace('.pdf','').replace('enc-','e:').slice(0,14);
function outcome(r) {
  if (r.thrown) return 'THROW';
  let j; try { j = JSON.parse(r.text); } catch {}
  if (r.isError) { const code = j?.code ?? j?.error?.code ?? (r.text.match(/\b[A-Z][A-Z_]{4,}\b/)||[])[0]; return 'E:' + (code ?? '?'); }
  if (j) { for (const k of ['verdict','status','extractability','textExtractable','conformance','level']) if (typeof j[k] === 'string') return k[0]+':'+j[k]; return 'ok'; }
  return r.kinds?.includes('image') ? 'img' : 'ok';
}
const rows = {};
for (const r of d.results) {
  const f = basename(r.args.file_path ?? r.args.file_path_2);
  if (!pick.includes(f)) continue;
  if ((r.args.response_format ?? 'json') !== fmt && r.args.response_format) continue;
  (rows[r.tool] ??= {})[f] = outcome(r.A);
}
console.log(['tool', ...pick.map(abbr)].join('\t'));
for (const [t, m] of Object.entries(rows)) console.log([t.slice(0,18), ...pick.map((f) => m[f] ?? '-')].join('\t'));
