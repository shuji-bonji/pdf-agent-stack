/**
 * テスト自体の確かめ: S2 の検査は、古い答えを返す読み手を見つけるか
 *
 * reader と verify を「同じ (ツール名, 引数) の 2 回目に 1 回目の応答を返す」接続に
 * 包んで、S2 と同じ検査を当てる。検査が食い違いを 1 つも報告しなければ、S2 が
 * 通っても何も示していない。
 */
import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { checkFreshness, staleProxy } from '../freshness.mjs';
import { start, WRITER_ENV, workDir } from '../lib.mjs';

let writer;
let reader;
let verify;
let work;
before(async () => {
  writer = await start('writer', WRITER_ENV);
  reader = staleProxy(await start('reader'));
  verify = staleProxy(await start('verify'));
  work = workDir('self');
});
after(async () => {
  await Promise.all([writer?.close(), reader?.close(), verify?.close()]);
  work?.done();
});

test('selfcheck 2 回目に 1 回目の応答を返す読み手に S2 の検査を当てると、食い違いを報告する', async () => {
  const problems = await checkFreshness({ writer, reader, verify, dir: work.dir });
  assert.ok(problems.length >= 5, `報告が少ない（${problems.length} 件）: ${problems.join(' / ')}`);
  assert.ok(problems.some((p) => p.startsWith('reader の title')));
  assert.ok(problems.some((p) => p.startsWith('verify の fileSize')));
});
