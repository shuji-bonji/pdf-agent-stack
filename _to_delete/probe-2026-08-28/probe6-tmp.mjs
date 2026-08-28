import { readFileSync } from 'node:fs';
import { checkFile } from './dist/index.js';
import { extractDocumentFacts } from './dist/facts/document.js';
import { parsePdf } from 'normativepdf';
const f = process.argv[2];
const doc = await parsePdf(new Uint8Array(readFileSync(f)));
const s = await extractDocumentFacts(doc, {});
for (const [k, v] of Object.entries(s.facts)) console.log(' ', k, '=', JSON.stringify(v)?.slice(0, 70));
