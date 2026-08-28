import { readFileSync } from 'node:fs';
import { parsePdf, dictGet, readPageTree } from 'normativepdf';
const f = process.argv[2];
const doc = await parsePdf(new Uint8Array(readFileSync(f)));
console.log('origin', doc.origin, 'version', doc.version, 'chainStop', JSON.stringify(doc.chainStop));
console.log('xref エントリ', doc.xref.size);
const kinds = {}; let failed = 0; const errs = new Map();
for (const [n, e] of doc.xref) {
  if (e.type !== 'in-use' && e.type !== 'compressed') continue;
  try {
    const o = await doc.getObject(n, e.type === 'in-use' ? e.generation : 0);
    kinds[o.kind] = (kinds[o.kind] ?? 0) + 1;
  } catch (err) {
    failed += 1;
    const m = String(err.message).slice(0, 80);
    errs.set(m, (errs.get(m) ?? 0) + 1);
  }
}
console.log('取れた:', JSON.stringify(kinds));
console.log('落ちた:', failed);
for (const [m, c] of [...errs].sort((a,b)=>b[1]-a[1]).slice(0,5)) console.log('   ', c, '件 ', m);
console.log('trailer Info:', JSON.stringify(dictGet(doc.trailer, 'Info')));
try { const cat = await doc.getCatalog(); console.log('catalog kind:', cat.kind); } catch (e) { console.log('catalog 失敗:', String(e.message).slice(0,90)); }
try { const t = await readPageTree({ resolve: v => doc.resolve(v), getCatalog: () => doc.getCatalog() }); console.log('pages', t.pages.length, 'reached', t.reached); } catch (e) { console.log('readPageTree 失敗:', String(e.message).slice(0,90)); }
