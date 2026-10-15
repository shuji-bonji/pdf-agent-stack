/**
 * dist-freshness.mjs — Is a server's dist built from its current src?
 *
 * generate-reference.mjs starts each server from mcp/<server>/dist and writes
 * whatever its tools/list returns. The version on the page comes from the
 * server's own serverInfo, and the servers read that from package.json at
 * start-up — so a dist built before the latest pull still announces the new
 * version. pdf-reader-mcp 0.17.0 was published like this: the page said
 * "v0.17.0 (20 tools)" while 0.17.0 has 18; the dist was three days old.
 *
 * What is checked, per source file under src/ (`.ts` / `.mts`; not `.d.ts`, and not
 * `*.test.ts` / `*.spec.ts`, which the four servers' tsconfig `exclude` keeps out of dist):
 *   - missing: no compiled file at the same path under dist/ → not built
 *   - stale:   the source file is newer than its compiled file → not rebuilt
 * Either one means the dist is not the src, and generation must stop.
 *
 * What is only reported: compiled files with no source (`orphans`). tsc does
 * not delete the output of a source file that was removed, so a correct
 * rebuild still leaves them (pdf-reader-mcp's dist/tools/tier3/validate-*.js
 * after 0.17.0). They are not loaded unless something imports them; a clean
 * build (`rm -rf dist && npm run build`) removes them.
 *
 * File times are the signal. They can be wrong (a checkout that sets old times,
 * a `touch`), but the failure this guards against — pulling, then generating
 * without building — always leaves src newer than dist.
 */

import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

const SOURCE = /\.(m?ts)$/;
const DECL = /\.d\.m?ts$/;
const TEST = /\.(test|spec)\.m?ts$/;

/**
 * @param {string} serverDir  e.g. <root>/mcp/pdf-reader-mcp
 * @returns {{ missing: string[], stale: string[], orphans: string[] }}
 *          paths relative to serverDir
 */
export function checkDistFreshness(serverDir) {
  const srcDir = join(serverDir, 'src');
  const distDir = join(serverDir, 'dist');
  const result = { missing: [], stale: [], orphans: [] };
  if (!existsSync(srcDir) || !existsSync(distDir)) return result;

  const compiledOf = (src) => {
    const rel = relative(srcDir, src);
    return join(distDir, rel.replace(/\.ts$/, '.js').replace(/\.mts$/, '.mjs'));
  };

  const sources = walk(srcDir).filter((p) => SOURCE.test(p) && !DECL.test(p) && !TEST.test(p));
  const expected = new Set();
  for (const src of sources) {
    const out = compiledOf(src);
    expected.add(out);
    if (!existsSync(out)) result.missing.push(relative(serverDir, src));
    else if (statSync(src).mtimeMs > statSync(out).mtimeMs) result.stale.push(relative(serverDir, src));
  }

  for (const out of walk(distDir)) {
    if (!/\.m?js$/.test(out) || expected.has(out)) continue;
    // A compiled file whose source is plain JS copied by the build (e.g. a worker)
    // has a source of the same name under src/.
    const rel = relative(distDir, out);
    if (existsSync(join(srcDir, rel))) continue;
    result.orphans.push(relative(serverDir, out));
  }
  return result;
}
