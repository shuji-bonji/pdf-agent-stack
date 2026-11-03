import { start, serverVersion } from '/home/claude/pdf-agent-stack/eval/e2e/lib.mjs';
import { mkdirSync, writeFileSync, rmSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const SP = '/home/claude/e2/specimens', OUT = '/home/claude/e2/wout';
rmSync(OUT, { recursive: true, force: true }); mkdirSync(join(OUT, '出力 先'), { recursive: true });
const FONT = '/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf';
const log = [];
async function run(label, s, tool, args) {
  let r; try { r = await s.call(tool, args); } catch (e) { r = { thrown: String(e?.message ?? e) }; }
  log.push({ label, tool, args, isError: r.isError, text: r.text ?? r.thrown });
  let code = ''; try { const j = JSON.parse(r.text); code = j.code ?? (j.success === false ? 'success:false' : ''); } catch {}
  console.log(`${r.isError ? 'ERR' : 'ok '} ${label.padEnd(34)} ${code}`);
  return r;
}
const w0 = await start('writer', {});            // フォント無し
const w = await start('writer', { PDF_WRITER_FONT: FONT });
const rd = await start('reader'); const vf = await start('verify', { PDF_VERIFY_VERAPDF: '/nonexistent/verapdf' });
await run('ja text, no font', w0, 'create_text_pdf', { text: '日本語の本文', outputPath: join(OUT, 'nofont.pdf') });
await run('ascii text, no font', w0, 'create_text_pdf', { text: 'Hello', outputPath: join(OUT, 'ascii.pdf') });
await run('ja text, env font', w, 'create_text_pdf', { text: '日本語の本文です。', outputPath: join(OUT, 'ja.pdf'), title: '題名', tagged: true, lang: 'ja' });
await run('ja md tagged (drawTitle default)', w, 'create_markdown_pdf', { markdown: '# 見出し\n\n本文です。\n\n## 小見出し\n\n- 項目1\n- 項目2\n', outputPath: join(OUT, 'md.pdf'), title: '見出し', tagged: true, lang: 'ja' });
await run('ja md tagged drawTitle=false', w, 'create_markdown_pdf', { markdown: '# 見出し\n\n本文です。', outputPath: join(OUT, 'md-nodraw.pdf'), title: '見出し', drawTitle: false, tagged: true, lang: 'ja' });
await run('md pdf 2.0', w, 'create_markdown_pdf', { markdown: '# Title\n\nBody', outputPath: join(OUT, 'md20.pdf'), pdfVersion: '2.0', tagged: true, lang: 'en' });
await run('table ja', w, 'create_table_pdf', { headers: ['品目', '数量'], rows: [['りんご', '3'], ['みかん', '5']], outputPath: join(OUT, 'table.pdf'), tagged: true, lang: 'ja' });
await run('output to space+ja dir', w, 'create_text_pdf', { text: 'x', outputPath: join(OUT, '出力 先', 'a b.pdf') });
await run('output to missing dir', w, 'create_text_pdf', { text: 'x', outputPath: join(OUT, 'no', 'such', 'dir.pdf') });
await run('relative outputPath', w, 'create_text_pdf', { text: 'x', outputPath: 'relative.pdf' });
for (const f of ['enc-aes256-emptyuser', 'enc-aes128-emptyuser', 'enc-rc4-128-emptyuser', 'enc-aes256-userpw', 'enc-rc4-128-userpw', 'contract-like-signed', 'broken-truncated', 'empty', 'not-a-pdf', 'does-not-exist', 'pdf20-objstm', 'linearized']) {
  await run(`set_metadata ${f}`, w, 'set_metadata', { inputPath: join(SP, f + '.pdf'), title: 't', outputPath: join(OUT, `meta-${f}.pdf`) });
  await run(`rotate ${f}`, w, 'rotate_pages', { inputPath: join(SP, f + '.pdf'), rotation: 90, outputPath: join(OUT, `rot-${f}.pdf`) });
}
await run('meta ja path', w, 'set_metadata', { inputPath: join(SP, '空白 と 日本語', 'スモーク 1.pdf'), title: 't', outputPath: join(OUT, '出力 先', 'メタ 1.pdf') });
copyFileSync(join(SP, 'smoke.pdf'), join(OUT, 'inplace.pdf'));
await run('in-place (output=input)', w, 'set_metadata', { inputPath: join(OUT, 'inplace.pdf'), title: 'inplace', outputPath: join(OUT, 'inplace.pdf') });
await run('no outputPath no base64', w, 'set_metadata', { inputPath: join(SP, 'smoke.pdf'), title: 't' });
await run('ensure_tagged smoke', w, 'ensure_tagged', { inputPath: join(SP, 'smoke.pdf'), title: 'Smoke', lang: 'en', outputPath: join(OUT, 'tagged.pdf') });
await run('ensure_pdfa smoke', w, 'ensure_pdfa', { inputPath: join(SP, 'smoke.pdf'), outputPath: join(OUT, 'pdfa.pdf') });
await run('ensure_pdfa pdfa-4', w, 'ensure_pdfa', { inputPath: join(SP, 'smoke.pdf'), flavour: 'pdfa-4', outputPath: join(OUT, 'pdfa4.pdf') });
await run('attach csv', w, 'attach_file', { inputPath: join(OUT, 'pdfa.pdf'), attachmentPath: join(SP, '..', '..', 'pdf-agent-stack', 'eval', 'hosts', 'grok-build', 'fixtures', 'generated', 'invoice-2026-0915.csv'), relationship: 'Source', outputPath: join(OUT, 'pdfa-att.pdf') });
await run('merge', w, 'merge_pdfs', { inputPaths: [join(SP, 'smoke.pdf'), join(SP, 'enc-aes256-emptyuser.pdf')], outputPath: join(OUT, 'merged.pdf') });
await run('split', w, 'split_pdf', { inputPath: join(SP, 'long-report-unit.pdf'), ranges: ['1', '2-3'], outputDir: join(OUT, 'split') });
await run('extract pages out of range', w, 'extract_pages', { inputPath: join(SP, 'smoke.pdf'), pages: '2-5', outputPath: join(OUT, 'ex.pdf') });
await run('annotation', w, 'add_annotation', { inputPath: join(SP, 'smoke.pdf'), page: 1, type: 'text', rect: { x1: 10, y1: 10, x2: 30, y2: 30 }, contents: 'メモ', outputPath: join(OUT, 'annot.pdf') });
await run('watermark ja', w, 'add_watermark', { inputPath: join(SP, 'smoke.pdf'), text: '社外秘', outputPath: join(OUT, 'wm.pdf') });
await run('page numbers', w, 'stamp_page_numbers', { inputPath: join(SP, 'long-report-unit.pdf'), outputPath: join(OUT, 'pn.pdf') });
await run('unknown arg', w, 'set_metadata', { inputPath: join(SP, 'smoke.pdf'), title: 't', bogus: 1, outputPath: join(OUT, 'bogus.pdf') });
// 読み戻し
for (const f of ['ja.pdf', 'md.pdf', 'md-nodraw.pdf', 'md20.pdf', 'table.pdf', 'tagged.pdf', 'pdfa.pdf', 'pdfa4.pdf', 'pdfa-att.pdf', 'merged.pdf', 'inplace.pdf']) {
  await run(`R summarize ${f}`, rd, 'summarize', { file_path: join(OUT, f), response_format: 'json' });
  await run(`R extract_structured ${f}`, rd, 'extract_structured_text', { file_path: join(OUT, f), response_format: 'json' });
  await run(`V identify ${f}`, vf, 'identify_conformance', { file_path: join(OUT, f), response_format: 'json' });
}
await run('V pdfua ja.pdf', vf, 'validate_conformance', { file_path: join(OUT, 'ja.pdf'), flavour: 'pdfua-1', response_format: 'json' });
await run('V pdfa pdfa.pdf', vf, 'validate_conformance', { file_path: join(OUT, 'pdfa.pdf'), response_format: 'json' });
for (const s of [w0, w, rd, vf]) await s.close();
writeFileSync('/home/claude/e2/out/writer.json', JSON.stringify({ version: serverVersion('writer'), log }, null, 1));
