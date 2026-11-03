import { start, serverVersion } from '/home/claude/pdf-agent-stack/eval/e2e/lib.mjs';
const out = [];
for (const [label, env] of [['PDF_SPEC_DIR unset', { PDF_SPEC_DIR: undefined }], ['PDF_SPEC_DIR missing dir', { PDF_SPEC_DIR: '/nonexistent/specs' }], ['PDF_SPEC_DIR literal ${VAR}', { PDF_SPEC_DIR: '${PDF_SPEC_DIR}' }]]) {
  const s = await start('spec', env);
  for (const [t, a] of [['list_specs', {}], ['get_section', { spec: 'pdf17', section: '7.5.5' }], ['search_spec', { query: 'Encrypt' }], ['compare_versions', { section: '7.6' }]]) {
    const r = await s.call(t, a); out.push({ label, t, r });
    console.log(`--- ${label} ${t} isError=${r.isError}\n${r.text.slice(0, 420)}`);
  }
  await s.close();
}
