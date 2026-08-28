import { readFileSync } from 'node:fs';
import { parsePdf, dictGet } from 'normativepdf';
import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';
const bytes = new Uint8Array(readFileSync(process.argv[2]));
const old = await PDFDocument.load(bytes, { updateMetadata: false });
const ti = old.context.trailerInfo;
console.log('pdf-lib trailerInfo キー:', Object.keys(ti ?? {}));
console.log('pdf-lib trailerInfo.Info:', String(ti?.Info));
const info = ti?.Info ? old.context.lookup(ti.Info) : undefined;
console.log('pdf-lib Info は PDFDict か:', info instanceof PDFDict);
if (info instanceof PDFDict) {
  for (const k of ['CreationDate','ModDate']) {
    const v = info.get(PDFName.of(k));
    console.log('  ', k, '=', v?.constructor?.name, JSON.stringify(String(v)).slice(0,60));
  }
}
const doc = await parsePdf(bytes);
console.log('normativepdf trailer キー:', [...doc.trailer.entries.keys()].join(','));
console.log('normativepdf Info:', JSON.stringify(dictGet(doc.trailer,'Info')));
