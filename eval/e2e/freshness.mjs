/**
 * S2（鮮度）の検査の本体。selfcheck からも使うので、テストと分けて置く。
 *
 * 1 回読んだ PDF を writer で同じパスに 3 回書き直し（メタデータ → 注釈 → 結合）、
 * 同じ reader / verify のプロセスで読み直す。2 回目の答えが書き直した後の内容で
 * なければ、その食い違いを 1 行ずつ返す（空の配列 = 問題なし）。
 */
import { statSync } from 'node:fs';
import { join } from 'node:path';

export async function checkFreshness({ writer, reader, verify, dir }) {
  const a = join(dir, 'a.pdf');
  const b = join(dir, 'b.pdf');
  const problems = [];

  await writer.call('create_text_pdf', { text: 'freshness round 1', title: 'Round 1', outputPath: a });
  await writer.call('create_text_pdf', { text: 'second document page', title: 'B', outputPath: b });

  const meta1 = (await reader.call('get_metadata', { file_path: a, response_format: 'json' })).json;
  const ann1 = (await reader.call('inspect_annotations', { file_path: a, response_format: 'json' }))
    .json;
  const int1 = (await verify.call('verify_integrity', { file_path: a, response_format: 'json' })).json;
  if (meta1?.title !== 'Round 1' || meta1?.pageCount !== 1) {
    problems.push(`1 回目の get_metadata が想定と違う: ${JSON.stringify(meta1)}`);
  }
  if (ann1?.totalAnnotations !== 0) problems.push('1 回目の注釈が 0 でない');

  const w1 = await writer.call('set_metadata', { inputPath: a, outputPath: a, title: 'Round 2' });
  const w2 = await writer.call('add_annotation', {
    inputPath: a,
    outputPath: a,
    page: 1,
    type: 'text',
    rect: { x1: 100, y1: 700, x2: 120, y2: 720 },
    contents: 'added after first read',
  });
  const w3 = await writer.call('merge_pdfs', { inputPaths: [a, b], outputPath: a });
  for (const [name, w] of [
    ['set_metadata', w1],
    ['add_annotation', w2],
    ['merge_pdfs', w3],
  ]) {
    if (w.isError) problems.push(`writer の ${name} が失敗した: ${w.text.slice(0, 200)}`);
  }

  const size = statSync(a).size;
  const meta2 = (await reader.call('get_metadata', { file_path: a, response_format: 'json' })).json;
  const ann2 = (await reader.call('inspect_annotations', { file_path: a, response_format: 'json' }))
    .json;
  const int2 = (await verify.call('verify_integrity', { file_path: a, response_format: 'json' })).json;

  if (meta2?.title !== 'Round 2') problems.push(`reader の title が ${meta2?.title}（期待 Round 2）`);
  if (meta2?.pageCount !== 2) problems.push(`reader の pageCount が ${meta2?.pageCount}（期待 2）`);
  if (meta2?.fileSize !== size) {
    problems.push(`reader の fileSize が ${meta2?.fileSize}（ファイルは ${size} バイト）`);
  }
  if (ann2?.totalAnnotations !== 1) {
    problems.push(`reader の totalAnnotations が ${ann2?.totalAnnotations}（期待 1）`);
  }
  if (int2?.fileSize !== size) {
    problems.push(`verify の fileSize が ${int2?.fileSize}（ファイルは ${size} バイト）`);
  }
  if (!(int2?.scope?.objects > int1?.scope?.objects)) {
    problems.push(
      `verify の scope.objects が増えていない（${int1?.scope?.objects} → ${int2?.scope?.objects}）`,
    );
  }
  return problems;
}

/**
 * テスト自体の確かめに使う、古い答えを返す接続。同じ (ツール名, 引数) の 2 回目に
 * 1 回目の応答を返す —— 読む側がパスをキーに解析結果を覚えるのと同じ振る舞い。
 */
export function staleProxy(conn) {
  const seen = new Map();
  return {
    async call(name, args) {
      const key = `${name} ${JSON.stringify(args)}`;
      if (!seen.has(key)) seen.set(key, await conn.call(name, args));
      return seen.get(key);
    },
    close: () => conn.close(),
  };
}
