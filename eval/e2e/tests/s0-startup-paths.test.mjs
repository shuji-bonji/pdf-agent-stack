/**
 * S0: 起動・tools/list・利用者の書き方のパス（2026-11 試用 E5・#47）
 *
 * 各 OS で、4 サーバーが stdio で起動し、tools/list が inputSchema 付きのツールを返すことを確かめる。
 * あわせて、空白と日本語を含むフォルダー・ファイル名のパスを writer → reader → verify に渡す。
 * Windows では、同じファイルを区切りを `/` にした書き方（`C:/...`）でも渡す。LLM がこの形で
 * パスを書くことがあるため。
 */
import assert from 'node:assert/strict';
import { mkdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { after, before, test } from 'node:test';
import { SERVERS, serverVersion, start, WRITER_ENV, workDir } from '../lib.mjs';

for (const key of Object.keys(SERVERS)) {
  test(`S0-${key} 起動して tools/list が inputSchema 付きのツールを返す`, async () => {
    const conn = await start(key, key === 'writer' ? WRITER_ENV : {});
    try {
      const tools = await conn.listTools();
      console.log(`${SERVERS[key]}@${serverVersion(key)} ${process.platform}-${process.arch}: ${tools.length} tools`);
      assert.ok(tools.length > 0, 'tools/list が空');
      for (const t of tools) assert.equal(t.inputSchema?.type, 'object', `${t.name} の inputSchema.type`);
    } finally {
      await conn.close();
    }
  });
}

let writer;
let reader;
let verify;
let work;
before(async () => {
  [writer, reader, verify] = await Promise.all([start('writer', WRITER_ENV), start('reader'), start('verify')]);
  work = workDir('s0');
});
after(async () => {
  await Promise.all([writer?.close(), reader?.close(), verify?.close()]);
  work?.done();
});

test('S0-paths 空白と日本語を含むパスを、writer → reader → verify が同じファイルとして扱う', async () => {
  const dir = join(work.dir, 'with space', '日本語 フォルダー');
  mkdirSync(dir, { recursive: true });
  const src = join(dir, '入力 ファイル.pdf');
  const out = join(dir, '出力 ファイル.pdf');
  const created = await writer.call('create_text_pdf', { text: 'spaced path', title: 'Before', outputPath: src });
  assert.equal(created.isError, false, created.text);

  const written = await writer.call('set_metadata', { inputPath: src, outputPath: out, title: 'Spaced Path' });
  assert.equal(written.isError, false, written.text);

  const forms = [out];
  if (process.platform === 'win32') forms.push(out.replace(/\\/g, '/'));
  const size = statSync(out).size;
  for (const p of forms) {
    const meta = await reader.call('get_metadata', { file_path: p, response_format: 'json' });
    assert.equal(meta.isError, false, `${p}: ${meta.text.slice(0, 300)}`);
    assert.equal(meta.json?.title, 'Spaced Path', p);
    assert.equal(meta.json?.pageCount, 1, p);
    const integrity = await verify.call('verify_integrity', { file_path: p, response_format: 'json' });
    assert.equal(integrity.isError, false, `${p}: ${integrity.text.slice(0, 300)}`);
    assert.equal(integrity.json?.fileSize, size, p);
  }
});
