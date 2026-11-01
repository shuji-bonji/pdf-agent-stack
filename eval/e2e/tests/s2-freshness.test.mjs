/**
 * S2: 鮮度 —— 1 回読んだ PDF を同じパスに書き直し、同じプロセスで読み直す
 *
 * 検査の本体は ../freshness.mjs（selfcheck が古い答えを返す接続で同じ検査を当て、
 * 検査が食い違いを見つけることを確かめる）。
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { checkFreshness } from '../freshness.mjs';
import { start, WRITER_ENV, workDir } from '../lib.mjs';

let writer;
let reader;
let verify;
let work;
before(async () => {
  [writer, reader, verify] = await Promise.all([start('writer', WRITER_ENV), start('reader'), start('verify')]);
  work = workDir('s2');
});
after(async () => {
  await Promise.all([writer?.close(), reader?.close(), verify?.close()]);
  work?.done();
});

test('S2 同じパスに 3 回書き直した後、同じプロセスの reader と verify が書き直した後の内容を返す', async () => {
  const problems = await checkFreshness({ writer, reader, verify, dir: work.dir });
  assert.deepEqual(problems, []);
});
