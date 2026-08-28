import { readFileSync } from 'node:fs';
import { parsePdf, dictGet, decodeStream } from 'normativepdf';
import { PDFDocument, PDFName, PDFRawStream, decodePDFRawStream } from 'pdf-lib';
const f = process.argv[2];
const bytes = new Uint8Array(readFileSync(f));
const doc = await parsePdf(bytes);
const cat = await doc.getCatalog();
const md = await doc.resolve(dictGet(cat, 'Metadata'));
console.log('normativepdf: Metadata kind =', md.kind);
if (md.kind === 'stream') {
  console.log('  dict:', JSON.stringify([...md.dict.entries].map(([k,v])=>[k, v.kind, v.kind==='name'?v.value:v.kind==='integer'?v.value:'']), null, 0).slice(0,300));
  const d = await decodeStream(md);
  console.log('  decode ->', d.length, 'B / 先頭:', new TextDecoder().decode(d.subarray(0,40)));
}
// pdf-lib 側（旧実装と同じ手順）
const old = await PDFDocument.load(bytes, { updateMetadata: false });
const m2 = old.context.lookup(old.catalog.get(PDFName.of('Metadata')));
console.log('pdf-lib: PDFRawStream?', m2 instanceof PDFRawStream);
if (m2 instanceof PDFRawStream) {
  const hasFilter = m2.dict.has(PDFName.of('Filter'));
  console.log('  has Filter:', hasFilter);
  try {
    const b = hasFilter ? decodePDFRawStream(m2).decode() : m2.contents;
    console.log('  bytes ->', b.length, '/ 先頭:', new TextDecoder().decode(b.subarray(0,40)));
  } catch (e) { console.log('  🔴 失敗:', String(e.message).slice(0,120)); }
}
