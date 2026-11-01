/**
 * S3: 起動中に描画の部品を入れる（shuji-bonji/pdf-reader-mcp#34）
 *
 * `render_page` は部品（@hyzyla/pdfium）が無いと「入れて、もう一度呼んで」と案内する。
 * 部品を外した状態で起動し、呼ぶ → 起動したまま部品を戻す → 呼ぶ。2 回目で描画すること。
 * 部品が最初から入っていない環境では飛ばす（戻すものが無い）。
 */
import assert from 'node:assert/strict';
import { renameSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { pdfiumDir, start, workDir, writeMinimalPdf } from '../lib.mjs';

const pdfium = pdfiumDir();

test('S3 部品が無い状態で render_page を呼んだ後に部品を入れると、同じプロセスの次の呼び出しで描画する', { skip: pdfium === null ? '@hyzyla/pdfium が入っていない' : false }, async () => {
  const work = workDir('s3');
  const pdf = join(work.dir, 'page.pdf');
  writeMinimalPdf(pdf, 1);
  const aside = `${pdfium}.e2e-aside`;
  renameSync(pdfium, aside);
  let reader;
  try {
    reader = await start('reader');
    const first = await reader.call('render_page', { file_path: pdf, pages: '1' });
    assert.equal(first.isError, true, '部品を外したのに描画した（外し方が効いていない）');
    assert.match(first.text, /@hyzyla\/pdfium/);

    renameSync(aside, pdfium);
    const second = await reader.call('render_page', { file_path: pdf, pages: '1' });
    assert.equal(second.isError, false, `部品を入れた後も描画しない: ${second.text.slice(0, 120)}`);
    assert.ok(second.kinds.includes('image'));
  } finally {
    try {
      renameSync(aside, pdfium);
    } catch {
      // 戻し済み
    }
    await reader?.close();
    work.done();
  }
});
