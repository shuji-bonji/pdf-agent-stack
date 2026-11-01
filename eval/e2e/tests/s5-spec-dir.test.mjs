/**
 * S5: 起動中に仕様書のフォルダーを変える（shuji-bonji/pdf-spec-mcp#29・#30）
 *
 * 本物の仕様書は配布できないので、仕様の名前を付けた最小の PDF を PDF_SPEC_DIR に置く。
 * ディスクの索引キャッシュは使わない（PDF_SPEC_CACHE=off。メモリの層を測る）。
 */
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { start, workDir, writeMinimalPdf } from '../lib.mjs';

async function withSpecServer(fn) {
  const work = workDir('s5');
  const spec = await start('spec', { PDF_SPEC_DIR: work.dir, PDF_SPEC_CACHE: 'off' });
  try {
    await fn(spec, work.dir);
  } finally {
    await spec.close();
    work.done();
  }
}

const structure = async (spec, id) => spec.call('get_structure', { spec: id });
const specIds = async (spec) => (await spec.call('list_specs', {})).json.specs.map((s) => s.id).sort();

test('S5-1 壊れた仕様書を正しい PDF に置き換えると、同じプロセスの次の呼び出しで読む（#29）', async () => {
  await withSpecServer(async (spec, dir) => {
    const file = join(dir, 'ISO_TS_32001-2022.pdf');
    writeFileSync(file, 'not a pdf');
    assert.equal((await structure(spec, 'ts32001')).isError, true);
    writeMinimalPdf(file, 1);
    const second = await structure(spec, 'ts32001');
    assert.equal(second.isError, false, `置き換えた後も失敗する: ${second.text.slice(0, 120)}`);
    assert.equal(second.json.totalPages, 1);
  });
});

test('S5-2 仕様書をページ数の違う PDF に差し替えると、同じプロセスの次の呼び出しで差し替えた後の内容を返す（#30）', async () => {
  await withSpecServer(async (spec, dir) => {
    const file = join(dir, 'ISO_TS_32001-2022.pdf');
    writeMinimalPdf(file, 1);
    assert.equal((await structure(spec, 'ts32001')).json.totalPages, 1);
    writeMinimalPdf(file, 3);
    assert.equal((await structure(spec, 'ts32001')).json.totalPages, 3, '差し替える前の内容を返した');
  });
});

test('S5-3 仕様書を足すと、同じプロセスの次の呼び出しで list_specs に出る（#30）', async () => {
  await withSpecServer(async (spec, dir) => {
    writeMinimalPdf(join(dir, 'ISO_TS_32001-2022.pdf'), 1);
    assert.deepEqual(await specIds(spec), ['ts32001']);
    writeMinimalPdf(join(dir, 'ISO_TS_32002-2022.pdf'), 1);
    assert.deepEqual(await specIds(spec), ['ts32001', 'ts32002'], '足した仕様書が出ない');
  });
});
