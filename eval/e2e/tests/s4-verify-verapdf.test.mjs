/**
 * S4: 起動中に veraPDF を置く（shuji-bonji/pdf-verify-mcp#24）
 *
 * `PDF_VERIFY_VERAPDF` に、まだ無いパスを渡して起動する（PATH と決まった場所の経路は、
 * Homebrew の veraPDF がある手元と、無い CI で結果が変わるため使わない。環境変数の経路は
 * PATH に落ちない）。呼ぶ → 起動したままそのパスに偽の veraPDF を置く → 呼ぶ。
 * 2 回目が `configured_path_unusable` のままでないこと。
 */
import assert from 'node:assert/strict';
import { chmodSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { start, workDir, writeMinimalPdf } from '../lib.mjs';

test('S4 veraPDF が無い状態で validate_conformance を呼んだ後に置くと、同じプロセスの次の呼び出しで見つける', { skip: process.platform === 'win32' }, async () => {
  const work = workDir('s4');
  const pdf = join(work.dir, 'doc.pdf');
  const exe = join(work.dir, 'verapdf');
  writeMinimalPdf(pdf, 1);
  const verify = await start('verify', { PDF_VERIFY_VERAPDF: exe });
  try {
    const args = { file_path: pdf, flavour: 'pdfa-2b', response_format: 'json' };
    const first = await verify.call('validate_conformance', args);
    assert.equal(first.json?.authoritativeValidation?.reason, 'configured_path_unusable');

    // 版を答えて終了コード 3 で終わる偽物。実行されれば validate_conformance はエラーになる
    writeFileSync(exe, '#!/bin/sh\necho "veraPDF 9.9.9"\nexit 3\n');
    chmodSync(exe, 0o755);
    const second = await verify.call('validate_conformance', args);
    assert.notEqual(
      second.json?.authoritativeValidation?.reason,
      'configured_path_unusable',
      `置いた後も「使えない」と答えた: ${second.text.slice(0, 200)}`,
    );
  } finally {
    await verify.close();
    work.done();
  }
});
