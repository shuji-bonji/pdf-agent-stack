/**
 * L1 の予測を測る（使い捨て。repo には置かない）。
 *
 * pdf-constraints が実際に読むテキスト文字列だけを取り出し、
 * pdf-lib の decodeText() と normativepdf の decodeTextString() を突き合わせる。
 * ゴールデンは「判定」を凍結するので、判定が動かない復号の差は写らない。ここはその穴を測る。
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument, PDFDict, PDFName, PDFArray, PDFString, PDFHexString } from 'pdf-lib';
import { decodeTextString } from 'normativepdf';

const dirs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const from = Number(process.argv.find((a) => a.startsWith('--from='))?.slice(7) ?? 0);
const n = Number(process.argv.find((a) => a.startsWith('--n='))?.slice(4) ?? 500);

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.toLowerCase().endsWith('.pdf')) files.push(p);
  }
};
for (const d of dirs) walk(d);
const slice = files.slice(from, from + n);

const stat = { files: 0, strings: 0, same: 0, diff: 0, utf8bom: 0, utf16bom: 0, esc: 0, samples: [] };
const cmp = (obj, where, file) => {
  if (!(obj instanceof PDFString || obj instanceof PDFHexString)) return;
  const bytes = Uint8Array.from(obj.asBytes());
  stat.strings += 1;
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) stat.utf8bom += 1;
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    stat.utf16bom += 1;
    if (bytes.includes(0x00) && String.fromCharCode(...bytes.subarray(2)).includes('')) stat.esc += 1;
  }
  const a = obj.decodeText();
  const b = decodeTextString(bytes);
  if (a === b) stat.same += 1;
  else {
    stat.diff += 1;
    if (stat.samples.length < 8)
      stat.samples.push({ file: file.split('/').slice(-2).join('/'), where, pdflib: a.slice(0, 40), normative: b.slice(0, 40) });
  }
};

for (const f of slice) {
  let doc;
  try {
    doc = await PDFDocument.load(readFileSync(f), { updateMetadata: false });
  } catch {
    continue;
  }
  stat.files += 1;
  const ctx = doc.context;
  // 1) Info の日付（document.ts の stringValue が読むもの）
  try {
    const info = ctx.trailerInfo?.Info ? ctx.lookup(ctx.trailerInfo.Info) : undefined;
    if (info instanceof PDFDict) {
      for (const k of ['CreationDate', 'ModDate']) cmp(info.get(PDFName.of(k)), `Info/${k}`, f);
    }
  } catch {}
  // 2) 注釈のテキスト文字列（annotation.ts の textOf が読むもの）
  try {
    for (const page of doc.getPages()) {
      const annots = ctx.lookup(page.node.get(PDFName.of('Annots')));
      if (!(annots instanceof PDFArray)) continue;
      for (let i = 0; i < annots.size(); i += 1) {
        const a = ctx.lookup(annots.get(i));
        if (!(a instanceof PDFDict)) continue;
        for (const k of ['Contents', 'T', 'Subj', 'RC', 'NM', 'DA']) cmp(a.get(PDFName.of(k)), `Annot/${k}`, f);
      }
    }
  } catch {}
}
console.log(JSON.stringify(stat, null, 1));
