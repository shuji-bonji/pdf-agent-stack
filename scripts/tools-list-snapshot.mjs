#!/usr/bin/env node
/**
 * tools/list の実応答スナップショットを取り、2 つを 5 項目で突き合わせる。
 *
 * なぜ SDK のクライアントを使わないか:
 *   この計器は SDK v1 のサーバと v2 のサーバを、測る側を動かさずに比べるためにある。
 *   SDK のクライアントを使うと、測る側の版が測られる側と一緒に動いてしまい、
 *   差が「サーバの変化」か「クライアントの変化」か帰属できなくなる。
 *   よって生の JSON-RPC over stdio で話す（generate-reference.mjs の handshake と同じ手）。
 *
 * 突き合わせる 5 項目（issue-draft-08 §7「A2 / A3」）:
 *   1. ツール数
 *   2. 各ツールの description
 *   3. inputSchema 全体
 *   4. inputSchema.additionalProperties — 「false」「true」「{}」「そもそも無い」を区別する
 *   5. inputSchema.required — 必須キーの集合
 *
 * 使い方:
 *   node scripts/tools-list-snapshot.mjs take  <server-dir> <out.json> [--label NAME]
 *   node scripts/tools-list-snapshot.mjs diff  <before.json> <after.json>
 *
 *   <server-dir> は package.json のあるディレクトリ。dist/index.js を node で起動する。
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const HANDSHAKE_TIMEOUT_MS = 30_000;

/* ---------------- MCP handshake（生 JSON-RPC over stdio） ---------------- */

function handshake({ command, args, cwd, env }) {
  return new Promise((resolveHS, rejectHS) => {
    const p = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    let stderrTail = '';
    p.stderr.on('data', (d) => {
      stderrTail = (stderrTail + d).slice(-2000);
    });
    const timer = setTimeout(() => {
      p.kill();
      rejectHS(
        new Error(
          `handshake timeout (${HANDSHAKE_TIMEOUT_MS / 1000}s)` +
            (stderrTail ? `\n--- server stderr (tail) ---\n${stderrTail}` : ''),
        ),
      );
    }, HANDSHAKE_TIMEOUT_MS);

    let buf = '';
    const pending = new Map();
    // JSON でない行は読み飛ばす（native binding の警告が stdout に漏れることがある）。
    p.stdout.on('data', (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch {
          continue;
        }
        if (msg.id != null && pending.has(msg.id)) pending.get(msg.id)(msg);
      }
    });
    p.on('error', rejectHS);

    const send = (m) => p.stdin.write(`${JSON.stringify(m)}\n`);
    const rpc = (id, method, params) =>
      new Promise((res) => {
        pending.set(id, res);
        send({ jsonrpc: '2.0', id, method, params });
      });

    (async () => {
      const init = await rpc(1, 'initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'tools-list-snapshot', version: '1.0.0' },
      });
      send({ jsonrpc: '2.0', method: 'notifications/initialized' });
      const tools = await rpc(2, 'tools/list', {});
      clearTimeout(timer);
      p.kill();
      if (!tools?.result?.tools) {
        rejectHS(new Error(`tools/list returned no tools: ${JSON.stringify(tools)}`));
        return;
      }
      resolveHS({
        serverInfo: init.result?.serverInfo ?? null,
        instructions: init.result?.instructions ?? null,
        tools: tools.result.tools,
      });
    })().catch((e) => {
      clearTimeout(timer);
      p.kill();
      rejectHS(e);
    });
  });
}

/* ---------------- スナップショットの形 ---------------- */

const sha = (s) => createHash('sha256').update(s ?? '').digest('hex').slice(0, 16);

/** キー順に依存しない JSON 文字列（比較の同一性をキー順で崩さない）。 */
function stable(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
}

/**
 * additionalProperties は「無い」ことに意味があるので、4 値に落とす。
 * 生 shape / .shape を渡すと zod 4 ではそもそも出ない。「消えた」と「元から無い」を
 * 区別するために、値そのものではなくこの表記を比べる。
 */
function additionalPropertiesOf(schema) {
  if (!schema || !Object.hasOwn(schema, 'additionalProperties')) return 'absent';
  const v = schema.additionalProperties;
  if (v === false) return 'false';
  if (v === true) return 'true';
  return `value:${stable(v)}`;
}

function toSnapshot(label, hs) {
  const tools = {};
  for (const t of [...hs.tools].sort((a, b) => a.name.localeCompare(b.name))) {
    tools[t.name] = {
      description: t.description ?? null,
      descriptionSha: t.description == null ? null : sha(t.description),
      descriptionLength: t.description == null ? null : t.description.length,
      title: t.title ?? t.annotations?.title ?? null,
      annotations: t.annotations ?? null,
      inputSchema: t.inputSchema ?? null,
      inputSchemaSha: sha(stable(t.inputSchema ?? null)),
      additionalProperties: additionalPropertiesOf(t.inputSchema),
      required: [...(t.inputSchema?.required ?? [])].sort(),
      properties: Object.keys(t.inputSchema?.properties ?? {}).sort(),
    };
  }
  return {
    label,
    serverInfo: hs.serverInfo,
    instructionsSha: hs.instructions == null ? null : sha(hs.instructions),
    toolCount: hs.tools.length,
    toolNames: Object.keys(tools).sort(),
    tools,
  };
}

/* ---------------- 突き合わせ ---------------- */

function diff(before, after) {
  const lines = [];
  let findings = 0;
  const note = (ok, item, text) => {
    if (!ok) findings += 1;
    lines.push(`${ok ? '  OK  ' : '  DIFF'} [${item}] ${text}`);
  };

  // 1. ツール数
  note(
    before.toolCount === after.toolCount,
    '1 ツール数',
    `${before.toolCount} -> ${after.toolCount}`,
  );

  const beforeNames = new Set(before.toolNames);
  const afterNames = new Set(after.toolNames);
  const removed = before.toolNames.filter((n) => !afterNames.has(n));
  const added = after.toolNames.filter((n) => !beforeNames.has(n));
  if (removed.length) note(false, '1 ツール数', `消えたツール: ${removed.join(', ')}`);
  if (added.length) note(false, '1 ツール数', `増えたツール: ${added.join(', ')}`);

  const common = before.toolNames.filter((n) => afterNames.has(n));

  // 2〜5 はツールごと
  for (const name of common) {
    const b = before.tools[name];
    const a = after.tools[name];

    note(
      b.descriptionSha === a.descriptionSha,
      '2 description',
      `${name}: ${b.descriptionLength} 文字 -> ${a.descriptionLength} 文字` +
        (a.description == null ? '（description が無い）' : ''),
    );

    note(
      b.inputSchemaSha === a.inputSchemaSha,
      '3 inputSchema',
      `${name}: ${b.inputSchemaSha} -> ${a.inputSchemaSha}`,
    );

    note(
      b.additionalProperties === a.additionalProperties,
      '4 additionalProperties',
      `${name}: ${b.additionalProperties} -> ${a.additionalProperties}`,
    );

    note(
      stable(b.required) === stable(a.required),
      '5 required',
      `${name}: [${b.required.join(', ')}] -> [${a.required.join(', ')}]`,
    );

    if (stable(b.properties) !== stable(a.properties)) {
      const gone = b.properties.filter((p) => !a.properties.includes(p));
      const plus = a.properties.filter((p) => !b.properties.includes(p));
      note(
        false,
        '3 inputSchema',
        `${name}: properties 差 -${gone.join(',') || 'なし'} +${plus.join(',') || 'なし'}`,
      );
    }
  }

  return { lines, findings };
}

/** inputSchema が変わったツールの、生の差分を出す（帰属のため）。 */
function detail(before, after, name) {
  const b = before.tools[name]?.inputSchema ?? null;
  const a = after.tools[name]?.inputSchema ?? null;
  return [
    `--- before: ${name}`,
    JSON.stringify(b, null, 2),
    `--- after: ${name}`,
    JSON.stringify(a, null, 2),
  ].join('\n');
}

/* ---------------- CLI ---------------- */

const [, , mode, ...rest] = process.argv;

if (mode === 'take') {
  const dir = resolve(rest[0] ?? '.');
  const out = rest[1];
  const labelIdx = rest.indexOf('--label');
  const label = labelIdx >= 0 ? rest[labelIdx + 1] : dir;
  if (!out) {
    console.error('usage: tools-list-snapshot.mjs take <server-dir> <out.json> [--label NAME]');
    process.exit(2);
  }
  const hs = await handshake({
    command: process.execPath,
    args: [resolve(dir, 'dist/index.js')],
    cwd: dir,
  });
  const snap = toSnapshot(label, hs);
  writeFileSync(out, `${JSON.stringify(snap, null, 2)}\n`);
  console.log(
    `${label}: ${snap.toolCount} tools -> ${out}` +
      `\n  ${snap.toolNames.join(', ')}`,
  );
} else if (mode === 'diff') {
  const before = JSON.parse(readFileSync(resolve(rest[0]), 'utf8'));
  const after = JSON.parse(readFileSync(resolve(rest[1]), 'utf8'));
  const showDetail = rest.includes('--detail');
  console.log(`# ${before.label} -> ${after.label}`);
  const { lines, findings } = diff(before, after);
  for (const l of lines) console.log(l);
  console.log(`\n差分 ${findings} 件`);
  if (showDetail && findings > 0) {
    for (const name of after.toolNames) {
      if (before.tools[name]?.inputSchemaSha !== after.tools[name]?.inputSchemaSha) {
        console.log(`\n${detail(before, after, name)}`);
      }
    }
  }
  process.exit(findings === 0 ? 0 : 1);
} else {
  console.error(
    [
      'usage:',
      '  node scripts/tools-list-snapshot.mjs take <server-dir> <out.json> [--label NAME]',
      '  node scripts/tools-list-snapshot.mjs diff <before.json> <after.json> [--detail]',
    ].join('\n'),
  );
  process.exit(2);
}
