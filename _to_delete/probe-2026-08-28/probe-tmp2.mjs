/** 予測 3（日付の文法）と、コーパス全体の BOM の分布を測る。使い捨て。 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PDFDocument, PDFDict, PDFName, PDFString, PDFHexString } from 'pdf-lib';
import { decodeTextString, parsePdfDate as fields } from 'normativepdf';

/** L1 で捨てた自前の正規表現（比較のためだけに復元） */
function oldParse(value) {
  if (typeof value !== 'string') return null;
  const m = /^D:(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?(?:([Z+-])(?:(\d{2})'?(\d{2})?'?)?)?$/.exec(value);
  if (!m) return null;
  const [, year, month = '01', day = '01', hour = '00', min = '00', sec = '00', sign, oh = '00', om = '00'] = m;
  const mo = +month, d = +day, h = +hour, mi = +min, s = +sec;
  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59 || s > 59) return null;
  const off = sign === '+' || sign === '-' ? (+oh * 60 + +om) * (sign === '-' ? -1 : 1) : 0;
  return Date.UTC(+year, mo - 1, d, h, mi, s) - off * 60_000;
}
function newParse(value) {
  if (typeof value !== 'string') return null;
  const p = fields(value);
  if (p === null) return null;
  const signed = p.utRelationship === '+' ? 1 : p.utRelationship === '-' ? -1 : 0;
  const off = signed * (p.offsetHours * 60 + p.offsetMinutes);
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - off * 60_000;
}

const files = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.toLowerCase().endsWith('.pdf')) files.push(p);
  }
};
for (const d of process.argv.slice(2)) walk(d);

const st = { files: 0, dates: 0, sameDate: 0, diffDate: 0, bothNull: 0, samples: [],
             allStrings: 0, allUtf8Bom: 0, allUtf16Bom: 0, allDecodeDiff: 0, bomFiles: new Set() };
for (const f of files) {
  let doc;
  try { doc = await PDFDocument.load(readFileSync(f), { updateMetadata: false }); } catch { continue; }
  st.files += 1;
  const ctx = doc.context;
  try {
    const info = ctx.trailerInfo?.Info ? ctx.lookup(ctx.trailerInfo.Info) : undefined;
    if (info instanceof PDFDict) {
      for (const k of ['CreationDate', 'ModDate']) {
        const v = info.get(PDFName.of(k));
        if (!(v instanceof PDFString || v instanceof PDFHexString)) continue;
        const text = decodeTextString(Uint8Array.from(v.asBytes()));
        const a = oldParse(text), b = newParse(text);
        st.dates += 1;
        if (a === null && b === null) st.bothNull += 1;
        else if (a === b) st.sameDate += 1;
        else { st.diffDate += 1; if (st.samples.length < 10) st.samples.push({ file: f.split('/').pop(), k, text, old: a, now: b }); }
      }
    }
  } catch {}
  // コーパス全体の文字列（この消費者が読まないものも含む）
  try {
    for (const [, obj] of ctx.enumerateIndirectObjects()) {
      const visit = (o) => {
        if (o instanceof PDFString || o instanceof PDFHexString) {
          const by = Uint8Array.from(o.asBytes());
          st.allStrings += 1;
          if (by[0] === 0xef && by[1] === 0xbb && by[2] === 0xbf) { st.allUtf8Bom += 1; st.bomFiles.add(f.split('/').pop()); }
          else if (by[0] === 0xfe && by[1] === 0xff) st.allUtf16Bom += 1;
          if (o.decodeText() !== decodeTextString(by)) st.allDecodeDiff += 1;
        } else if (o instanceof PDFDict) for (const [, v] of o.entries()) visit(v);
      };
      visit(obj);
    }
  } catch {}
}
st.bomFiles = [...st.bomFiles];
console.log(JSON.stringify(st, null, 1));
