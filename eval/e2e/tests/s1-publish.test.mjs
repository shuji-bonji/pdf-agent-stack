/**
 * S1: pdf-publish の流れ（書く → 読み戻す → 採点する → 同じパスに書き直す → 読み直す）
 *
 * pdf-publish Skill の Phase 1〜4 を、writer / reader / verify の 3 プロセスでなぞる。
 * 書き直した後の reader と verify が、1 回目の解析結果ではなく書き直した後のファイルを
 * 読んでいることを、ファイルの大きさ（stat）との一致で確かめる。
 */
import assert from 'node:assert/strict';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { start, WRITER_ENV, workDir } from '../lib.mjs';

let writer;
let reader;
let verify;
let work;
before(async () => {
  [writer, reader, verify] = await Promise.all([start('writer', WRITER_ENV), start('reader'), start('verify')]);
  work = workDir('s1');
});
after(async () => {
  await Promise.all([writer?.close(), reader?.close(), verify?.close()]);
  work?.done();
});

test('S1 書く → 読み戻す → 採点する → 同じパスに書き直すと、reader と verify が書き直した後の内容を返す', async () => {
  const out = join(work.dir, 'published.pdf');

  // Phase 1: 書く（タグ付き）
  const created = await writer.call('create_text_pdf', {
    text: 'Invoice 2026-001\n\nTotal: 12,345',
    title: 'Invoice',
    tagged: true,
    lang: 'en',
    outputPath: out,
  });
  assert.equal(created.isError, false, created.text);

  // Phase 2: 読み戻す
  const text = await reader.call('read_text', { file_path: out, response_format: 'json' });
  assert.equal(text.isError, false, text.text);
  const body = text.json.pages.map((p) => p.text ?? '').join('\n');
  assert.match(body, /Invoice 2026-001/);
  assert.match(body, /Total: 12,345/);

  // Phase 3: 採点する（宣言の識別と、内蔵の規則での採点）
  const declared1 = await verify.call('identify_conformance', { file_path: out, response_format: 'json' });
  assert.equal(declared1.json?.pdfUa?.part, '1');
  const scored1 = await verify.call('validate_conformance', {
    file_path: out,
    flavour: 'pdfua-1',
    engine: 'native',
    response_format: 'json',
  });
  assert.equal(scored1.isError, false, scored1.text);

  // Phase 4: 同じパスに書き直す
  const rewritten = await writer.call('set_metadata', { inputPath: out, outputPath: out, title: 'Invoice (rev 2)' });
  assert.equal(rewritten.isError, false, rewritten.text);
  const size = statSync(out).size;

  const meta = await reader.call('get_metadata', { file_path: out, response_format: 'json' });
  assert.equal(meta.json?.title, 'Invoice (rev 2)', 'reader が書き直す前の title を返した');
  assert.equal(meta.json?.fileSize, size, 'reader がファイルの今の大きさを返していない');

  const integrity = await verify.call('verify_integrity', { file_path: out, response_format: 'json' });
  assert.equal(integrity.json?.fileSize, size, 'verify がファイルの今の大きさを返していない');
  const declared2 = await verify.call('identify_conformance', { file_path: out, response_format: 'json' });
  assert.equal(declared2.json?.pdfUa?.part, '1', '書き直しで PDF/UA の宣言が消えた');

  const scored2 = await verify.call('validate_conformance', {
    file_path: out,
    flavour: 'pdfua-1',
    engine: 'native',
    response_format: 'json',
  });
  assert.equal(scored2.isError, false, scored2.text);
});
