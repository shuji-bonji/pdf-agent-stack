import { readFileSync } from 'node:fs';
import { parsePdf, dictGet, decodeStream } from 'normativepdf';
const doc = await parsePdf(new Uint8Array(readFileSync(process.argv[2])));
for (const [n, e] of doc.xref) {
  if (e.type !== 'in-use' && e.type !== 'compressed') continue;
  let o; try { o = await doc.getObject(n, e.type === 'in-use' ? e.generation : 0); } catch { continue; }
  if (o.kind !== 'dict') continue;
  const t = dictGet(o, 'Type');
  if (t?.kind !== 'name' || t.value !== 'FontDescriptor') continue;
  console.log('FontDescriptor obj', n, 'FontName', JSON.stringify(dictGet(o,'FontName')));
  for (const key of ['FontFile','FontFile2','FontFile3']) {
    const v = dictGet(o, key);
    if (v === undefined) continue;
    console.log('  ', key, '=', JSON.stringify(v));
    try {
      const s = await doc.resolve(v);
      console.log('   resolve ->', s.kind, s.kind === 'stream' ? `dict keys: ${[...s.dict.entries.keys()].join(',')} raw=${s.raw.length}B` : '');
      if (s.kind === 'stream') {
        const d = await decodeStream(s);
        console.log('   decode ->', d.length, 'B');
      }
    } catch (err) { console.log('   🔴 失敗:', String(err.message).slice(0,140)); }
  }
}
