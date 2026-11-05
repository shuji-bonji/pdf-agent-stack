/**
 * S6: エラー応答の契約（pdf-agent-stack#48）
 *
 * 4 サーバーに同じ種類の失敗の入力を渡し、ツール結果の本文が family の形
 * （docs/specs/06 §2.3）になっているか、同じ状況に同じ `code` を返すかを確かめる。
 *
 * 形（ツール結果 `isError: true` の本文が JSON）:
 *   error        必須。英語の文
 *   code         必須。共通語彙か、そのサーバー固有のコード
 *   retryable    必須。真偽値
 *   hint         任意。英語の文
 *   next_actions 任意。{ action, reason, example? } の配列。reason は英語
 *   detail       任意。オブジェクト
 * 移行の 1 版だけ、`detail.legacyCode` があるときに限って `message`・`suggestion` も認める。
 *
 * SDK が前段で落とす入力検証の失敗（宣言に無いキーなど）は、この形の対象外（§2.11、
 * 2026-08-27 決定・2026-11-04 再確認）。そのため「SDK の文言のまま返る」ことを確かめる。
 * 失敗の入力が SDK の前段で落ちた場合（`Input validation error` で始まる）は、
 * ハンドラの失敗ではないので、その旨を出力して形の検査はしない。
 */
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createServer as createHttpServer } from 'node:http';
import { createServer as createHttpsServer } from 'node:https';
import { createServer as createNetServer } from 'node:net';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, test } from 'node:test';
import { start, WRITER_ENV, workDir } from '../lib.mjs';

/** family の共通語彙（§2.3） */
const COMMON = new Set([
  'INVALID_ARGUMENT',
  'DOC_NOT_FOUND',
  'INVALID_PDF',
  'ENCRYPTED_PDF',
  'UNSUPPORTED_PDF_FEATURE',
  'FILE_TOO_LARGE',
  'SOURCE_API_ERROR',
  'SOURCE_TIMEOUT',
  'SOURCE_UNAVAILABLE',
  'INTERNAL_ERROR',
]);

/** サーバー固有のコード（共通語彙の意味に当たらないものだけ） */
const SPECIFIC = {
  reader: ['RENDERER_NOT_AVAILABLE'],
  writer: ['SIGNED_PDF', 'TAGGED_PDF', 'FONT_REQUIRED', 'FONT_NOT_FOUND', 'MISSING_GLYPH'],
  verify: ['INVALID_BYTE_RANGE', 'WRONG_PASSWORD', 'VERAPDF_NOT_FOUND', 'VERAPDF_NOT_AVAILABLE', 'VERAPDF_NO_RESULT'],
  spec: ['REGISTRY_ERROR', 'CONTENT_ERROR', 'PREREQUISITE_ERROR'],
};

const TOP_LEVEL = new Set(['error', 'code', 'retryable', 'hint', 'next_actions', 'detail']);
const LEGACY_KEYS = new Set(['message', 'suggestion']);
const JAPANESE = /[぀-ヿ㐀-鿿]/;
const SDK_STAGE = /^Input validation error/;

/** 契約に反している点を文で返す（空なら契約どおり） */
export function contractViolations(server, res) {
  const v = [];
  if (!res.isError) return ['isError が true でない'];
  const j = res.json;
  if (!j || typeof j !== 'object' || Array.isArray(j)) return [`本文が JSON のオブジェクトでない: ${res.text.slice(0, 120)}`];

  const legacy = Boolean(j.detail && typeof j.detail === 'object' && typeof j.detail.legacyCode === 'string');
  for (const k of Object.keys(j)) {
    if (TOP_LEVEL.has(k)) continue;
    if (legacy && LEGACY_KEYS.has(k)) continue;
    v.push(`契約に無い最上位の項目 \`${k}\``);
  }
  if (typeof j.error !== 'string' || j.error === '') v.push(`error が空でない文字列でない（${JSON.stringify(j.error)}）`);
  if (typeof j.code !== 'string') v.push('code が文字列でない');
  else if (!COMMON.has(j.code) && !SPECIFIC[server].includes(j.code)) v.push(`code \`${j.code}\` は共通語彙にも ${server} 固有のコードにも無い`);
  if (typeof j.retryable !== 'boolean') v.push('retryable が無い（真偽値で必須）');
  if (j.hint !== undefined && typeof j.hint !== 'string') v.push('hint が文字列でない');
  if (j.next_actions !== undefined) {
    if (!Array.isArray(j.next_actions)) v.push('next_actions が配列でない');
    else
      j.next_actions.forEach((a, i) => {
        if (!a || typeof a !== 'object') return v.push(`next_actions[${i}] がオブジェクトでない`);
        if (typeof a.action !== 'string') v.push(`next_actions[${i}].action が文字列でない`);
        if (typeof a.reason !== 'string') v.push(`next_actions[${i}].reason が文字列でない`);
        if (a.example !== undefined && (typeof a.example !== 'object' || Array.isArray(a.example)))
          v.push(`next_actions[${i}].example がオブジェクトでない`);
      });
  }
  if (j.detail !== undefined && (typeof j.detail !== 'object' || Array.isArray(j.detail))) v.push('detail がオブジェクトでない');

  const prose = [
    ['error', j.error],
    ['hint', j.hint],
    ...(Array.isArray(j.next_actions) ? j.next_actions.map((a, i) => [`next_actions[${i}].reason`, a?.reason]) : []),
  ];
  for (const [name, s] of prose) if (typeof s === 'string' && JAPANESE.test(s)) v.push(`${name} が英語でない`);
  return v;
}

let work;
let conns;
let files;
let specStartError;

function conn(server) {
  if (server === 'spec' && specStartError) throw new Error(`spec が起動しなかった: ${specStartError.message}`);
  return conns[server];
}
before(async () => {
  work = workDir('s6');
  files = {
    missing: join(work.dir, 'no-such-file.pdf'),
    notPdf: join(work.dir, 'not-a-pdf.pdf'),
    empty: join(work.dir, 'empty.pdf'),
    relative: 'relative/dir/file.pdf',
  };
  writeFileSync(files.notPdf, 'This is a text file, not a PDF.\n');
  writeFileSync(files.empty, '');
  const [reader, writer, verify] = await Promise.all([start('reader'), start('writer', WRITER_ENV), start('verify')]);
  conns = { reader, writer, verify };
  // spec が起動できないとき（ネイティブ部品の無い環境など）でも、ほかの 3 サーバーは測る。
  // spec のテストは、起動の失敗をそのまま落ちる理由として返す
  try {
    // 仕様書のフォルダーを渡さない: どのツールもハンドラが REGISTRY_ERROR を返す
    conns.spec = await start('spec', { PDF_SPEC_DIR: undefined, PDF_SPEC_CACHE: 'off' });
  } catch (e) {
    specStartError = e;
  }
});
after(async () => {
  await Promise.all(Object.values(conns ?? {}).map((c) => c?.close()));
  work?.done();
});

/** ファイルを 1 つ受け取るツールを、サーバーごとに 1 つ */
const FILE_TOOL = {
  reader: (p) => ['get_page_count', { file_path: p }],
  verify: (p) => ['identify_conformance', { file_path: p, response_format: 'json' }],
  writer: (p) => ['rotate_pages', { inputPath: p, rotation: 90, outputPath: join(work.dir, 'rotated.pdf') }],
};

/** 同じ状況に返すべき共通語彙のコード */
const FILE_CASES = [
  ['missing', 'DOC_NOT_FOUND', '存在しないパス'],
  ['notPdf', 'INVALID_PDF', 'PDF でないファイル'],
  ['empty', 'INVALID_PDF', '0 バイトのファイル'],
  ['relative', 'INVALID_ARGUMENT', '相対パス'],
];

for (const server of Object.keys(FILE_TOOL)) {
  for (const [file, expected, label] of FILE_CASES) {
    test(`S6-${server} ${label} → ${expected}`, async () => {
      const [tool, args] = FILE_TOOL[server](files[file]);
      const res = await conn(server).call(tool, args);
      if (SDK_STAGE.test(res.text)) {
        console.log(`${server} ${tool} ${label}: SDK の入力検証で落ちた（§2.3 の対象外）: ${res.text.slice(0, 160)}`);
        assert.equal(res.isError, true);
        return;
      }
      const violations = contractViolations(server, res);
      if (res.json?.code !== expected) violations.push(`code が \`${res.json?.code}\`（同じ状況の共通語彙は \`${expected}\`）`);
      assert.deepEqual(violations, [], `${server} ${tool} ${label}\n本文: ${res.text.slice(0, 400)}`);
    });
  }
}

/**
 * reader の `read_url` の取得の失敗（pdf-reader-mcp#46。0.20.0 で直した）。
 *
 * 外の網には触れない。127.0.0.1 に立てたサーバーと、名前解決の段階で失敗する `.invalid` だけを使う。
 * 時間切れ（`SOURCE_TIMEOUT`）は、`read_url` の時間切れが 30 秒で引数から変えられないので、
 * ここでは測らない（reader の単体テストが測る）。
 */
const TLS = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'tls');
const listen = (server) =>
  new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server.address().port)));
const closeServer = (server) =>
  new Promise((resolve) => {
    server.closeAllConnections?.();
    server.close(() => resolve());
  });

async function closedPort() {
  const s = createNetServer();
  const port = await listen(s);
  await new Promise((r) => s.close(() => r()));
  return port;
}

const READ_URL_CASES = [
  {
    label: '接続を拒まれる',
    expected: 'SOURCE_UNAVAILABLE',
    retryable: true,
    url: async () => ({ url: `http://127.0.0.1:${await closedPort()}/x.pdf` }),
  },
  {
    label: 'ホスト名を引けない',
    expected: 'SOURCE_UNAVAILABLE',
    retryable: true,
    url: async () => ({ url: 'http://no-such-host.invalid/x.pdf' }),
  },
  {
    label: 'HTTP 404',
    expected: 'SOURCE_API_ERROR',
    retryable: false,
    url: async () => {
      const server = createHttpServer((_req, res) => res.writeHead(404).end('not found'));
      return { url: `http://127.0.0.1:${await listen(server)}/x.pdf`, server };
    },
  },
  {
    label: '証明書を検証できない（自己署名）',
    expected: 'SOURCE_API_ERROR',
    retryable: false,
    url: async () => {
      const server = createHttpsServer(
        { key: readFileSync(join(TLS, 'self-signed.key')), cert: readFileSync(join(TLS, 'self-signed.pem')) },
        (_req, res) => res.end('%PDF-'),
      );
      return { url: `https://127.0.0.1:${await listen(server)}/x.pdf`, server };
    },
  },
  {
    label: 'fetch が断るポート（9）',
    expected: 'INVALID_ARGUMENT',
    retryable: true,
    url: async () => ({ url: 'http://127.0.0.1:9/x.pdf' }),
  },
];

for (const { label, expected, retryable, url } of READ_URL_CASES) {
  test(`S6-reader read_url ${label} → ${expected}`, async () => {
    const { url: target, server } = await url();
    try {
      const res = await conn('reader').call('read_url', { url: target });
      const violations = contractViolations('reader', res);
      if (res.json?.code !== expected) violations.push(`code が \`${res.json?.code}\`（同じ状況の共通語彙は \`${expected}\`）`);
      if (res.json?.retryable !== retryable) violations.push(`retryable が ${res.json?.retryable}（${retryable} を期待）`);
      assert.deepEqual(violations, [], `reader read_url ${label}\n本文: ${res.text.slice(0, 400)}`);
    } finally {
      if (server) await closeServer(server);
    }
  });
}

test('S6-spec 仕様書のフォルダーが無い → 契約どおりの REGISTRY_ERROR', async () => {
  const res = await conn('spec').call('get_section', { section: '7.1' });
  const violations = contractViolations('spec', res);
  if (res.json?.code !== 'REGISTRY_ERROR') violations.push(`code が \`${res.json?.code}\`（REGISTRY_ERROR を期待）`);
  assert.deepEqual(violations, [], `本文: ${res.text.slice(0, 400)}`);
});

/** 宣言に無いキー: SDK の前段で落ち、SDK の文言のまま返る（§2.11） */
const UNKNOWN_KEY = {
  reader: ['get_page_count', { file_path: '/tmp/x.pdf', no_such_arg: 1 }],
  verify: ['identify_conformance', { file_path: '/tmp/x.pdf', no_such_arg: 1 }],
  writer: ['rotate_pages', { inputPath: '/tmp/x.pdf', rotation: 90, outputPath: '/tmp/y.pdf', no_such_arg: 1 }],
  spec: ['get_section', { section: '7.1', no_such_arg: 1 }],
};
for (const [server, [tool, args]] of Object.entries(UNKNOWN_KEY)) {
  test(`S6-${server} 宣言に無いキー → SDK の入力検証の文言のまま（§2.11）`, async () => {
    const res = await conn(server).call(tool, args);
    assert.equal(res.isError, true, res.text);
    assert.match(res.text, SDK_STAGE, `SDK の前段の文言でない（包む経路が入った？ §2.11 を見直す）: ${res.text.slice(0, 200)}`);
    assert.match(res.text, /no_such_arg/, '拒否したキーの名前が文言に無い');
  });
}

test('S6-selfcheck 契約の検査が、ずれた形を見つける', () => {
  const bad = { isError: true, text: '', json: { error: true, code: 'FILE_NOT_FOUND', message: 'x', suggestion: 'y' } };
  const found = contractViolations('verify', bad);
  for (const needle of ['`message`', '`suggestion`', 'error が空でない文字列でない', '`FILE_NOT_FOUND`', 'retryable'])
    assert.ok(found.some((s) => s.includes(needle)), `${needle} を見つけていない: ${found.join(' / ')}`);
  const ok = { isError: true, text: '', json: { error: 'File not found.', code: 'DOC_NOT_FOUND', retryable: false } };
  assert.deepEqual(contractViolations('reader', ok), []);
  const jp = { isError: true, text: '', json: { error: 'x', code: 'DOC_NOT_FOUND', retryable: false, hint: 'ファイルを確認' } };
  assert.ok(contractViolations('reader', jp).some((s) => s.includes('hint が英語でない')));
  const transitional = {
    isError: true,
    text: '',
    json: { error: 'x', code: 'DOC_NOT_FOUND', retryable: false, message: 'x', suggestion: 'y', detail: { legacyCode: 'FILE_NOT_FOUND' } },
  };
  assert.deepEqual(contractViolations('verify', transitional), [], '移行の 1 版の形を拒んでいる');
});
