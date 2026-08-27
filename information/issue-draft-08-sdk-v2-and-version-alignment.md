# Issue 下書き: MCP SDK v2 移行を目的とした、依存ライブラリの版統一

**優先度: 1（トラック A。verify の pdf-lib 撤去はトラック B として並行・§10）**

**起票先: [pdf-agent-stack#21](https://github.com/shuji-bonji/pdf-agent-stack/issues/21)**
— トラック A / B の決裁と進捗はここに集約する。

実測日: 2026-08-27 / 対象: `pdf-agent-stack` 配下の 4 MCP + lib 3 + agent 1
実測手順は §11 に置く（再現できる形で書く。数字は本文とそこだけに持たせる）。

---

## 1. なぜ目的を「v2 移行」に置くか

当初この Issue は「版を揃える」だけの内容だった。目的を SDK v2 移行に置き換える理由は 3 つある。

1. **未決が消える。** zod 4 は v2 の要件（`zod: ^4.2.0`）。「3 系に据え置くか 4 に寄せるか」を
   好みで決める必要がなくなり、仕様で決まる。Node 20+ も同じ
2. **二度手間が消える。** v1 の世界に揃えてから v2 でまた揃え直す、が無くなる
3. **`.strict()` の決着が移行作業に合流する。** v2 は raw shape ではなく Standard Schema
   オブジェクトを推奨するので、verify の 7 ツールを `z.object({...})` にする作業が
   そもそも発生する。そのとき `.strict()` を付けるかを決めればよく、別作業にならない

## 2. 版の実体 — v2 はパッケージ名ごと変わっている

| パッケージ | latest | 公開日 |
|---|---|---|
| `@modelcontextprotocol/sdk`（family が使用中） | **1.30.0** | 2026-07-27 |
| `@modelcontextprotocol/server` | **2.0.0** | 2026-07-27（beta.5 = 07-21） |
| `@modelcontextprotocol/client` | **2.0.0** | 同上 |
| `@modelcontextprotocol/core` | **2.0.0** | 同上 |
| `@modelcontextprotocol/codemod` | **2.0.0** | 同上 |

`@modelcontextprotocol/sdk` に 2.x は 1 つも無い（`npm view @modelcontextprotocol/sdk@2` は 404）。
monolithic な `sdk` は廃止方向。**v1.x はバグ修正とセキュリティ更新を少なくとも 6 か月**
（2026-07-28 から ≒ 2027-01 まで）。急ぎではないが期限がある。

v2 の性質: `type: module`（ESM 専用）/ `engines.node: >=20` /
`dependencies` に **`zod: ^4.2.0`** / ツールスキーマは Standard Schema（Zod v4 / ArkType / Valibot）。

## 3. 移行の面（実測）

| | ESM | SDK に触る `src` | transport | 削除された API |
|---|---|---|---|---|
| pdf-spec-mcp | ✅ `type: module` | 3 | stdio | **0** |
| pdf-reader-mcp | ✅ | 21 | stdio | **0** |
| pdf-verify-mcp | ✅ | 9 | stdio | **0** |
| pdf-writer-mcp | ✅ | 2 | stdio | **0** |

**4 サーバとも既に ESM**なので、v2 の ESM ファーストは追加コストにならない。
import は合計 35 ファイルだが、**33 は `server/mcp.js` のパス変更だけ**である。

移行ガイドが挙げる破壊的変更のうち、family に当たるものを実測で潰した:

| 破壊的変更 | family の使用 |
|---|---|
| `SSEServerTransport` / `WebSocketClientTransport` / `StreamableHTTPServerTransport` 削除 | **0 件**（全部 stdio） |
| `setRequestHandler(Schema, …)` → メソッド文字列形式 | **0 件** |
| 可変長の `.tool()` / `.prompt()` / `.resource()` 廃止 | **0 件**（全部 `registerTool`） |
| ハンドラ第 2 引数 `extra` → `ctx` | **0 件**（`extra` の grep 13 件はすべて無関係な局所変数とコメント） |
| `McpError` → `ProtocolError` / `ErrorCode` → `ProtocolErrorCode` | **0 件**（`ErrorCode` の grep 14 件は自前の `LawErrorCode` / `WriterErrorCode`） |
| `completable(schema.optional(), cb)` の反転 | **0 件** |
| `schemaToJson` / `server/zod-compat.js` 削除 | **0 件** |

**当たるのは 3 つだけ**:

1. import パス（`@modelcontextprotocol/sdk/server/mcp.js` → `@modelcontextprotocol/server`）
2. stdio の subpath（→ `@modelcontextprotocol/server/stdio`）
3. **zod 4 系への引き上げ**（reader / verify）と、raw shape → `z.object()`

⚠️ **テスト側に 1 つ注意点がある。** v2 の `InMemoryTransport` は
「クライアント/サーバー混在不可（同じパッケージの import から使う）」と移行ガイドにある。
該当するのは `pdf-spec-mcp/src/registry.test.ts` と `pdf-writer-mcp/tests`（どちらも
`sdk/client/index.js` + `sdk/inMemory.js` の組み合わせ）。`pdf-reader-mcp/tests` は
`client/stdio.js` なので別経路。

codemod がある: `npx @modelcontextprotocol/codemod@2 v1-to-v2 .` →
`grep -rn '@mcp-codemod-error' .` → `tsc --noEmit` → フォーマッタ → テスト。
v1 と v2 は別名なので**段階移行も可能**（プロセス / トランスポート境界ごと）。

## 4. いまの版の不整合

### 4.1 `engines` の宣言が依存の宣言と食い違う（2 件）

| リポジトリ | 宣言 | 実行時依存の下限 | 由来 |
|---|---|---|---|
| **pdf-spec-mcp** | `>=20.0.0` | `>=22.13.0 \|\| >=24` | `pdfjs-dist@5.7.284` |
| **pdf-reader-mcp** | `>=18` | `>=20` | `pdfjs-dist@4.10.38` / `@hono/node-server@2.1.1` |

**spec の食い違いは「動かない」ことを意味しない（実測）。** spec が import しているのは
`pdfjs-dist/legacy/build/pdf.mjs` で、この legacy ビルドは core-js を同梱し
`Promise.withResolvers` を 5550 行目で自前定義している（使用 27 箇所）。
Node 20.20.2 と 22.22.2 で `getDocument` / `numPages` / `getOutline` / `getTextContent` /
`getStructTree` / `getPageIndex` が同じ結果を返した。modern ビルドは **Node 22 でも落ちる**
（`DOMMatrix is not defined`・pdfjs 自身が legacy を使えと警告）。
→ `>=22.13.0 || >=24` は Node で使う経路の要求ではない。**`>=20` 据え置き + 例外記録**（§5 A1）。

### 4.2 CI と publish

reader の CI マトリクスに `18` が残っている（実測下限 `>=20` を下回る）。
spec の publish が node `20`、pdf-constraints も `20`。
`[20, 22]` / publish `22` に揃える。

### 4.3 検出されない理由

`.npmrc` が 7 リポジトリのどこにも無く、`engine-strict` が未設定なので `npm ci` は
`EBADENGINE` を**警告として出して通る**。版の横断比較を見ている場所も無い
（`stack-check.yml` は npm published と構成表の照合だけ）。

### 4.4 ツールチェーン

| リポジトリ | TypeScript（宣言 / 解決） | @types/node | vitest | Biome | zod（宣言 / 解決） |
|---|---|---|---|---|---|
| pdf-spec-mcp | ^5.7.0 / 5.9.3 | ^22.0.0 | ^2.1.0 | `2.5.4` | ^4.4.3 / **4.4.3** |
| pdf-reader-mcp | ^5.7.2 / 5.9.3 | ^22.10.0 | ^3.0.0 | `2.5.4` | ^3.23.8 / **3.25.76** |
| pdf-verify-mcp | ^5.7.2 / 5.9.3 | ^22.10.0 | ^3.0.0 | `2.5.4` | ^3.23.8 / **3.25.76** |
| **pdf-writer-mcp** | **^7.0.2** | **^26.1.1** | **^4.1.10** | `2.5.4` | ^4.4.3 / **4.4.3** |
| normativepdf | ^5.9.0 | — | ^3.2.0 | **`^2.5.4`** | — |
| pdf-constraints | ^5.7.0 | ^22.0.0 | ^2.1.0 | `2.5.4` | — |
| pdf-agent-pipeline | ^5.8.0 | ^22.15.0 | — | — | — |

`target` / `lib` は 7 つとも `ES2022`。`.nvmrc` はどこにも無い。
**キャレットのせいで、実体は TypeScript 5.9.3 と 7.0.2 の二世代・zod 3.25.76 と 4.4.3 の二世代。**

---

## 5. 段取り — トラック A

### A1. 版の土台（TypeScript 7 / @types/node 22 / engines / CI）

**TypeScript 7 は v2 の要件ではない。**ここに置くのは、v2 移行で型が大きく動くので、
先に上げておけば落ちたときの原因が 1 つになるからである。

実測（3 リポジトリを複製して `npm ci` し tsc を入れ替えた）:

| リポジトリ | 現行（5.9.3） | TS 7.0.2 素のまま | TS 7.0.2 + `types: ["node"]` |
|---|---|---|---|
| pdf-verify-mcp | 0 | **65** | **0** |
| pdf-reader-mcp | 0 | **67** | **0** |
| pdf-spec-mcp | 0 | **43** | **0** |

**175 件は全部同じ原因。** TS 7 は `@types/*` を `node_modules` から自動で取り込まない。
writer だけ影響が出ていなかったのは `"types": ["node"]` を持っているため。
**コードの変更は 0 件。** 出力も、verify で **JS 33 ファイルすべてバイト一致**、
`.d.ts` の差は 1 ファイルの引用符の種類のみ。

`@types/node` 26 は TypeScript とは独立の実費（2×2 で切り分け・verify）:

| | @types/node 22.20.1 | @types/node 26.4.0 |
|---|---|---|
| TypeScript 5.9.3 | 0 件 | **1 件** |
| TypeScript 7.0.2 | 0 件 | **1 件** |

1 件は `cms-verifier.ts:31` で pkijs の `CryptoEngine` が WebCrypto の `ICryptoEngine`
（`decapsulateBits` / `decapsulateKey` / `encapsulateBits` / `encapsulateKey` = 耐量子 KEM）を
実装していないこと。writer で出ないのは writer が pkijs を使っていないから。
→ `@types/node` は `engines.node` に合わせて `^22` に統一（writer の 26 を戻す）。

作業:

- [ ] TypeScript を `7.0.2` に統一。spec / reader / verify の tsconfig に `"types": ["node"]` を 1 行
- [ ] **writer の `@types/node` を `^26.1.1` → `^22` に復元する**（`engines.node: >=20` と揃える。
      26 のままだと pkijs の型で 1 件出る repo が生まれる = A1 の実測）
- [ ] `@types/node` を 4 サーバ + lib で `^22` に統一
- [ ] `engines.node`: reader を `>=18` → `>=20`。spec は `>=20` 据え置き + 例外記録（§4.1）
- [ ] **CI マトリクスに Node 20 を残したまま `[20, 22]` に統一**（reader から `18` を外す。
      20 を落とさないのは `engines.node: >=20` を実際に測る唯一のジョブだから）、publish を `22` に統一
- [ ] Biome を `2.5.4` 完全固定（normativepdf のキャレットを外す・規約 §2.7）
- [ ] `scripts/check-engines.mjs` を 7 リポジトリに置き、CI の `npm ci` 直後で回す

#### 🔴 実測でぶつかった例外 — normativepdf は TypeScript 5.9 のまま据え置く（2026-08-27）

`npm ci` が `ERESOLVE` で落ちた:

```
While resolving: typedoc@0.28.20
Found: typescript@7.0.2
Could not resolve dependency:
peer typescript@"5.0.x || … || 5.9.x || 6.0.x" from typedoc@0.28.20
```

**typedoc は最新（0.28.20）でも peer の上限が `6.0.x`** で、TypeScript 7 を受けない。
typedoc を持つのは 7 リポジトリ中 normativepdf だけである（2026-08-26 に
リファレンス生成のために入れた。`treatWarningsAsErrors` で「公開面から参照されるのに
未エクスポートの型」を機械検出している）。

**据え置く判断の根拠**: TypeScript の版は §4.4 の表でいう「誰にも届かない層」であり、
normativepdf の `.d.ts` は TS 5.7 でも 7.0 でも同じに読める（実測済み）。
外部への影響は無い。typedoc が TS 7 に対応したら上げる。
`--legacy-peer-deps` は採らない（食い違いを隠すため）。

`check-engines.mjs` の内容:

1. `package-lock.json` の全 packages から `engines.node` を集める
2. `optional` / `os` / `cpu` を持つものは除外する
3. `||` は選択肢なので、各選択肢の先頭バージョンの最小値をその依存の下限とする
4. 実行時依存（`dev: false`）の最大下限 ≦ 自分の `engines.node` の下限 でなければ 1 を返す
5. dev 込みの最大下限が CI マトリクスの最小値を超えていたら警告として出す（落とさない）

例外は入口とセットで書き、`entryPoint` 以外を import したら無効にする:

```json
"engineExceptions": {
  "pdfjs-dist": {
    "reason": "legacy/build/pdf.mjs は core-js を同梱し Promise.withResolvers を自前定義する。Node 20.20.2 で 6 つの API を実走して 22.22.2 と同結果",
    "measuredOn": "2026-08-27",
    "entryPoint": "pdfjs-dist/legacy/build/pdf.mjs"
  }
}
```

### A2. zod 4（v2 の要件）

**下限は `^4.2.0`。それ未満は受入しない。** 移行ガイドの記述:

> v1 サポート: `^3.25 || ^4.0` ／ **v2 要件: `^4.2.0`**
> Zod 3.x は実行時に失敗（**登録時の無音失敗**）／Zod 4.0–4.1 はフォールバック動作（**記述が削除される**）

つまり **4.0 / 4.1 も不可**。「zod 4 系」ではなく `^4.2.0` と書く。
いま解決されているのは spec / writer が 4.4.3、reader / verify が **3.25.76**。

reader / verify を `^4.2.0`（実体 4.4.3）へ。**実費は 1 行**（実測）:

```
src/tools/validate-clauses.ts(22,6): error TS2554: Expected 2-3 arguments, but got 1.
```

zod 4 の `z.record` は key 型が必須:

```diff
- .record(z.union([z.boolean(), z.string(), z.number()]))
+ .record(z.string(), z.union([z.boolean(), z.string(), z.number()]))
```

これで verify は 0 エラー。**reader は無修正で 0 エラー**（19 ツールすべてが
`.strict()` した ZodObject を `registerTool` に直接渡しているため、
`tools/list` が返すスキーマにも `additionalProperties: false` が残る）。

#### ✅ A2 実施済み（2026-08-27・4 リポジトリともコミット）

宣言は 4 サーバとも `^4.2.0`（解決は 4.4.3）。型検査の実費は上の 1 行だけだった。
テストは reader 438 / verify 153 / spec 339 / writer 408 passed。

#### 🔴 実測でぶつかった例外 — verify は `.strict()` 無しで `false` を返していた

上の「現状の生 shape は zod 4 で『無い』」は spec / writer（既に zod 4）を見た記述である。
**verify は zod 3 だったので、`.strict()` を 1 つも書いていないのに、7 ツールとも
`tools/list` の `inputSchema` に `additionalProperties: false` が入っていた**
（zod 3 の JSON Schema 変換は素の ZodObject にも `false` を付ける）。zod 4 は付けない。

| | zod 3（A2 前） | zod 4 に上げた直後 |
|---|---|---|
| pdf-verify-mcp | `false` × 7 | **無し × 7** |
| pdf-reader-mcp | `false` × 19 | `false` × 19（`.strict()` 済み） |

**zod を上げるだけで、`tools/list` から `additionalProperties: false` が消える。**
クライアントは「宣言に無いキーも渡してよい」と読む。そこで `.strict()` 化のうち
verify の分を A2 に前倒しし、`z.object({...}).strict()` にした（決裁 §6 の既定と同じ形）。

さらに、**`tools/list` に書いてある内容と、実際に引数を受け取ったときの動作は、
これまで一致していなかった**。`tools/list` は「宣言に無いキーは受け付けない」と書いて
いたが、zod 3 の `z.object()` の既定は strip なので、実際は受け取って黙って捨てていた。
実走した差:

```
before: {file_path, response_format, no_such_arg} -> isError=false（結果を返す）
after : 同じ引数                                  -> isError=true / -32602 Unrecognized key
```

**§8 の「`.strict()` で落ちる既存の呼び出しがあるか」はこれで解消した**（verify について）:
pdf-agent-pipeline が `callToolJson` で渡す引数、pdf-trust / pdf-publish / pdf-specialist が
記述している引数は、すべて宣言済みのものだけである。

#### A2 の受入 — `tools/list` の 5 項目突き合わせ（54 ツール）

計器は `scripts/tools-list-snapshot.mjs`（この Issue で追加）。**SDK のクライアントを使わず
生の JSON-RPC over stdio で話す** ので、測る側を動かさずに v1 と v2 のサーバを比べられる。

| | ツール数 | description | additionalProperties | required | inputSchema |
|---|---|---|---|---|---|
| pdf-spec-mcp | 8 / 差 0 | 差 0 | 差 0 | 差 0 | 差 0 |
| pdf-reader-mcp | 19 / 差 0 | 差 0 | 差 0 | 差 0 | **1 件** |
| pdf-verify-mcp | 7 / 差 0 | 差 0 | 差 0 | 差 0 | **1 件** |
| pdf-writer-mcp | 20 / 差 0 | 差 0 | 差 0 | 差 0 | 差 0 |

差 2 件はどちらも帰属済みで、受け付ける値は変わらない:

1. reader `locate_objects.object_numbers` の要素に `maximum: 9007199254740991` が付いた。
   zod 4 が `.int()` に安全整数の上限を書くようになったため。`.max()` を明示していない
   `.int()` はこの 1 箇所だけだった
2. verify `validate_clauses.given` の値が `type: [boolean, string, number]` から
   `anyOf: [...]` になり、key 型を明示したぶん `propertyNames` が増えた

### A3. SDK v2 移行

#### ✅ 前提整備は済み（2026-08-27）

- [x] **verify に `buildServer()` を切り出した**。`src/index.ts` がトップレベルで
      `McpServer` を作りそのまま stdio に繋いでいたので、import しただけで
      トランスポートが立ち、`tools/list` を取る検査が書けなかった。
      `src/server.ts` に分離（spec / writer と同じ形）。INSTRUCTIONS の本文は変えていない
- [x] **verify に `tests/unit/registry.test.ts` を足した**（22 件）。
      5 項目を InMemoryTransport 越しに固定する。
      **空振りでないことを実測**: 共通入力の `.strict()` を 1 箇所外すと落ち、戻すと通る
- [x] 切り出しが外部に出る仕様を動かしていないことの実測: 5 項目とも差 0 件、
      `instructions` のハッシュも `serverInfo` も同一

- [ ] `npx @modelcontextprotocol/codemod@2 v1-to-v2 .` を各リポジトリで回す
- [ ] `grep -rn '@mcp-codemod-error' .` を潰す
- [ ] import パス（35 ファイル）と stdio subpath を確認
- [ ] **verify の 7 ツールの raw shape（`{ ...PdfToolInputSchema, ... }`）を
      `z.object({...}).strict()` へ**。spec / writer の `tool.shape` も同様に見直す
- [ ] `InMemoryTransport` の混在禁止に対応（spec の `src/registry.test.ts`・writer の `tests`）
- [ ] `tsc --noEmit` → biome → `npm test`

🔴 **A3 の途中で入力検証の形を変えない。** raw shape → `z.object({...}).strict()` に
揃えるところまでが A3 で、**失敗形の §2.3 化は A3 完了後に別途決める**（§A4）。
同じリリースに混ぜると、`tools/list` の差が「移行によるもの」か「検証の作り変えによるもの」か
帰属できなくなる。

#### A3 の完了条件 — 公開 MCP の semver / peerDependencies

4 サーバはすべて npm 公開物（`bin` 付き・0.x）である。A3 は利用者に届く変更を含むので、
版の上げ方と依存の宣言をここで決める。

- [ ] **版**: `engines.node` が上がる（reader `>=18` → `>=20`）のは**利用者に届く破壊的変更**。
      4 サーバとも 0.x なので minor を上げる（例 reader 0.12.0 → 0.13.0）。
      1.0.0 に上げるかは別途
- [ ] **peerDependencies**: **現状は不要**（実測 = 4 サーバの `src/index.ts` は
      `export` を 1 つも持たず、`dist/index.d.ts` は 6〜10 行で SDK / zod の型が 0 件）。
      `main` / `exports: ["."]` は宣言されているが実質 bin 専用である
- [ ] **回帰検査を足す**: ビルド後の `dist/index.d.ts` に `@modelcontextprotocol` / `zod` の型が
      現れたら落ちる検査。**現れたらその時点で peerDependencies の宣言が要る**
- [ ] reader の `optionalDependencies`（`@hyzyla/pdfium ^2.1.13`）は据え置き
- [ ] `stack.json` / README の構成表を再生成（`stack-check.yml` が落ちるので必須）

### A4. 入力検証の失敗形を §2.3 の語彙に載せる

**v2 でも公式フックは無い**（実測）。v2 の `ServerOptions.jsonSchemaValidator`
（`getValidator(schema) => (input) => {valid, data, errorMessage}`）は公式の拡張点だが、
**Zod スキーマを渡す経路では呼ばれない（実測 0 回）**。Standard Schema の
`~standard.validate` が使われるため。v2 の `registerTool` は raw JSON Schema を
受け付けない（"must be a Standard Schema or a raw Zod shape"）。

`validateToolInput` と `createToolError` は **v2 でも prototype 上にある**ので、
サブクラスで包める（v1 / v2 とも実走で確認済み）:

```js
class FamilyMcpServer extends McpServer {
  async validateToolInput(tool, args, toolName) {
    try { return await super.validateToolInput(tool, args, toolName); }
    catch (e) { /* Unrecognized key / expected … at X を抜いて §2.3 の語彙に載せ替えて throw */ }
  }
  createToolError(message) { /* 目印つきなら structuredContent 付きで返す */ }
}
```

⚠️ **`validateToolInput` は文書化された公開 API ではない。** SDK を上げると黙って
生メッセージに戻るので、**包みが外れたことを検出する検査を必ず対にする**。

代案（公開 API のみ）は、スキーマを `passthrough()` にしてハンドラ側で検証する形だが、
**`tools/list` の `additionalProperties` が `{}`（zod4）/ `true`（zod3）になる**（実測）。
現状の生 shape は zod 4 でそもそも出ないので、**いまより緩い制約をクライアントに伝える**
方向になる。

### 決裁（2026-08-27・shuji）

1. **契約 Zod は `.strict()`**
2. **入力検証の失敗チャネルは v2 の `isError: true` を前提とする**
3. **§2.3 の語彙はハンドラが返せる失敗に必須。** SDK 前段の失敗へ載せる場合は
   **公開 API のみ**（passthrough + ハンドラ検証）。**内部 API の override はしない**

この 3 点から、**既定**はこうなる:

| 失敗の出どころ | 形 | `tools/list` の `additionalProperties` |
|---|---|---|
| ハンドラが返す失敗（業務のエラー） | **§2.3 必須**（`code` / `retryable` / `hint` / `next_actions`） | — |
| SDK 前段の入力検証 | SDK の生メッセージ（`isError: true`） | **`additionalProperties: false`** |

**既定 = `.strict()` した ZodObject を `registerTool` に直接渡す**（reader が既にこの形）。

### 時期 — A3 中は `.strict()` のまま上げる

- **A3 では入力検証の形を変えない。** raw shape → `z.object({...}).strict()` に揃えるところまで。
  SDK v2 へ上げるあいだ、失敗形は SDK の生メッセージのままにする
- **§2.3 化を行うかどうかは A3 完了後に決める。** 同じリリースに混ぜると、`tools/list` の差が
  「移行によるもの」か「検証の作り変えによるもの」か帰属できなくなる
- 行うと決めた場合の手段は **公開 API のみ**（passthrough + ハンドラ検証）。
  代償は `tools/list` の `additionalProperties` が `{}`（zod4）/ `true`（zod3）に緩むこと（実測）

### subclass / 内部 API は既定にしない

`validateToolInput` / `createToolError` の override は v1 / v2 とも**技術的には可能**
（prototype 上のメソッド・実走で確認済み）。`additionalProperties: false` を保ったまま §2.3 を載せられる
唯一の手段でもある。**それでも既定にはしない** — 文書化された公開 API ではなく、
SDK を上げると黙って生メッセージに戻るため。

採用を検討できるのは、次の 2 つが揃ったときだけとする:

1. §2.3 化を行うと決め、かつ `additionalProperties: false` を保つ必要があると判断した
2. **包みが外れたことを検出する検査**（T-3 で落ちることを実測したもの）を同じ変更に含める

- [ ] 規約 `06-family-implementation-standards.md` に §2.x として書き起こす

---

## 6. 決定

| 項目 | 決定 | 根拠 |
|---|---|---|
| **目的** | 4 サーバの SDK v2 移行。版統一はその中で行う | §1 |
| `engines.node` | normativepdf の `>=20` を下限。reader を `>=20` へ。spec は据え置き + 例外 | §4.1 の実測 |
| CI / publish | `[20, 22]` / `22` に統一 | §4.2 |
| TypeScript | **7.0.2 に統一**。tsconfig に `"types": ["node"]` を 1 行。**normativepdf のみ 5.9 据え置き**（typedoc の peer 上限が 6.0.x） | A1 の実測 |
| `@types/node` | **`^22` に統一**（writer の 26 を戻す） | A1 の 2×2 |
| **zod** | **`^4.2.0` に統一（v2 の要件）。実費は verify の 1 行** | A2 の実測 |
| Biome | `2.5.4` 完全固定 | 規約 §2.7 |
| vitest | 各リポジトリの自由（誰にも届かない層）。揃えるなら別 Issue | §4.4 |
| ツールスキーマ | **`.strict()` した ZodObject を `registerTool` に直接渡す** | A4 の決裁 |
| 入力検証の失敗形 | **A3 中は生メッセージのまま。§2.3 化の可否は A3 完了後に決める** | A4 の決裁 |
| §2.3 の語彙 | **ハンドラが返せる失敗には必須** | A4 の決裁 |
| 内部 API の override | **既定にしない**（条件つきでのみ検討・A4） | A4 の決裁 |
| zod の下限 | **`^4.2.0`。4.0 / 4.1 も受入しない** | A2 |
| 公開 MCP の版 | `engines.node` が上がるので minor を上げる。peerDependencies は現状不要（回帰検査を足す） | A3 の完了条件 |

## 7. 受入基準

### A1

1. 7 リポジトリで `check-engines` が緑
2. **T-3 を 4 通り実測**
   - `engines.node` を 1 段下げる → 落ちる
   - lock に `engines.node` が高い依存を 1 つ足す → 落ちる
   - `optional` 付きの環境別パッケージだけが高い状態 → **落ちない**
     （`@napi-rs/lzma-linux-x64-gnu`：`optional: true` / `os: [linux]` / `cpu: [x64]` /
     `^22.20 || ^24.12 || >=25`・spec の lock で実測。そのまま検体になる）
   - spec の `src/` から modern ビルドを import すると例外が無効になり落ちる
3. **spec の CI の Node 20 ジョブで、実際の規格 PDF を 1 本読む**（§9 の第 1 項を潰す）
4. TypeScript 7.0.2 で 4 リポジトリとも型検査 0 件・`npm test` が移行前と同じ結果

### A2 / A3 — 🔴 `tools/list` の実応答を突き合わせる

移行ガイドにこうある:

> Zod 3.x は実行時に失敗（**登録時の無音失敗**）
> Zod 4.0–4.1 はフォールバック動作（**記述が削除される**）

**無音**なので、型検査もテストも通ったまま、ツールが登録されない、あるいは description が
消えた状態になりうる（[[green-tests-can-be-vacuous]] と同じ型）。

- **移行の前後で `tools/list` の実応答を突き合わせ、次の 5 項目が一致すること**
  （意図した差は 1 件ずつ帰属させる）:

  1. **ツール数**
  2. 各ツールの **`description`**（zod 4.0–4.1 のフォールバックは記述を落とす）
  3. **`inputSchema`** 全体
  4. **`inputSchema.additionalProperties`** — `.strict()` が効いているかはここにしか出ない。
     生 shape / `.shape` を渡すと zod 4 では**そもそも出ない**ので、
     「消えた」と「元から無い」を区別するため単独の項目として比べる
  5. **`inputSchema.required`** — 必須キーの集合。`.default()` の付け外しで黙って動く
- 既にある仕組みを使う: `pdf-spec-mcp/src/registry.test.ts` /
  `pdf-writer-mcp/tests/registry.test.ts` / `pdf-reader-mcp/tests/verify-stdio.mjs` /
  `scripts/generate-reference.mjs`（stack 横断）
- ⚠️ **verify には `tools/list` の実応答を取る検査が無い。** A3 の前に足す
- リリース後は `npx` で公開版を叩いて同じ突き合わせをする（[[verify-published-package-by-npx]]）

### A4

- 4 サーバのすべてのツールが `.strict()` した ZodObject を渡している
  （`tools/list` の全ツールで `additionalProperties: false` と `required` を実測）
- **A3 の時点では失敗形が SDK の生メッセージのままであること**（§2.3 化を混ぜていない）
- ハンドラが返す失敗が、4 サーバとも §2.3 の 4 項目を持っている
- **`.strict()` によって落ちる既存の呼び出しが無いこと** — pdf-trust / pdf-publish /
  pdf-specialist が投げる引数を実際に通して確かめる（§8 の未測定項目を潰す）

## 8. 測っていないこと（受入に入れない）

- **ISO 32000-2（1,000 ページ超）を Node 20 で読み切れるか。** §4.1 で測ったのは
  799 バイトの手製 PDF（1 ページ・テキスト・アウトライン 1 件）に対する API 表面である
  → 受入基準 A1-3 で潰す
- **`npm test` を TypeScript 7 で回した結果。** 測ったのは型検査と emit だけ
- **v2 の実サーバを stdio で起動した挙動。** 測ったのは `InMemoryTransport` 越しの
  `tools/list` / `tools/call` のみ
- ~~**`.strict()` を有効にしたときに落ちる既存の呼び出しがあるか。**~~
  → **verify については解消した**（A2 の実測）。stack 内の呼び出し側が渡す引数は
  すべて宣言済み。spec / writer に `.strict()` を入れるときは同じ確認を改めて行う
- 各リポジトリを Node 24 / 26 で回したときの挙動

## 9. 順序

```
トラック A: A1 版の土台 → A2 zod 4 → A3 SDK v2 → A4 入力検証の失敗形
             └─(並行)→
トラック B:            N §7.9 文字列層 → B1 pdf-constraints → B2 verify
```

**A1 だけが両方の土台**（型検査が動かないと何も測れない）。それ以降 B は独立に進む。

## 10. トラック B は独立（従属させない）— 3 段

| 段 | 文書 | 内容 |
|---|---|---|
| **N** | `lib/normativepdf/docs/handoff/text-string-and-date.md` | §7.9 の文字列層（テキスト文字列の復号 + 日付）。**消費者が 4 つ**（reader / verify / pdf-constraints / writer の書き側）あり、同じものを 4 通りに実装している |
| **B1** | `lib/pdf-constraints/docs/handoff/pdflib-removal.md` | `@shuji-bonji/pdf-constraints` 0.3.0 の pdf-lib 撤去（5 ファイル / 638 行） |
| **B2** | `mcp/pdf-verify-mcp/docs/handoff/pdflib-removal.md` | verify の pdf-lib 撤去（5 ファイル） |

🔴 **B1 を B2 より先にやる。** `pdf-constraints` が `dependencies` に
`pdf-lib: ^1.17.1` を持っており、verify がそれを消費しているので、
**verify 側だけ移しても pdf-lib は推移依存として残る**（実測 2026-08-27）。

**N を先頭に置く**のは、B1 と B2 の両方が §7.9 を必要とするため
（`decodeText()` の呼び出しが pdf-constraints に 6 箇所・verify に 19 箇所）。
先に 1 リリース出しておけば、両方が同じものを消費できる。

トラック A との接点は無い。verify で **SDK に触るファイルと pdf-lib に触るファイルは
1 つも重ならない**（実測）:

```
SDK に触る   : src/index.ts + src/tools/*.ts（9 件）
pdf-lib に触る: src/services/*.ts（5 件）
両方に触る   : 0 件
```

従属させると v2 の都合で PDF の作業が止まり、handoff の「これ 1 件。他の作業を混ぜない」の
規律にも反する。A1 の完了後は並行してよい。

## 11. 実測の再現手順

```bash
# engines の下限（optional/os/cpu を除外・|| は選択肢）
node scripts/check-engines.mjs --report

# pdfjs を Node 20 で動かす
#   Node 20 を入れ、pdfjs-dist@5.7.284 を入れ、legacy ビルドで
#   getDocument / numPages / getOutline / getTextContent / getStructTree / getPageIndex を呼ぶ

# TypeScript 7 の型検査（各リポジトリを複製して）
npm ci && npm i -D typescript@7.0.2
#   tsconfig の compilerOptions に "types": ["node"] を足してから
npx tsc --noEmit -p tsconfig.json

# emit の比較
npx tsc -p tsconfig.json --outDir dist-59   # typescript@5.9
npx tsc -p tsconfig.json --outDir dist-70   # typescript@7.0.2
diff -rq dist-59 dist-70

# tools/list の突き合わせ（A2 / A3 の受入）
node scripts/tools-list-snapshot.mjs take <server-dir> before.json --label before
#   ...変更を入れて npm run build...
node scripts/tools-list-snapshot.mjs take <server-dir> after.json  --label after
node scripts/tools-list-snapshot.mjs diff before.json after.json --detail
#   SDK のクライアントを使わず生 JSON-RPC over stdio で話すので、
#   測る側を動かさずに v1 と v2 のサーバを比べられる

# v2 の挙動確認
npm i @modelcontextprotocol/server@2 @modelcontextprotocol/client@2 zod@4
```

## 12. 関連

- `Document-Note/mcps/PDFfamily/specs/06-family-implementation-standards.md`
  §2.1（`McpServer` + `registerTool` + zod）/ §2.3（エラー語彙）/ §2.7（Biome 完全固定）
  — Node / TypeScript / zod / 入力検証の版と扱いについては記述が無い。本 Issue の決定を追記する
- `information/issue-draft-01-stack-version-drift.md` — 公開版と構成表のドリフト（対応済み）
- `mcp/pdf-verify-mcp/docs/handoff/pdflib-removal.md` — トラック B（§10）
- 検討して**採らなかったもの**: `stimulus-pdf-viewer@0.5.0`（pdfjs-dist を外せるか調べた）。
  `peerDependencies` に `pdfjs-dist ^4.0.0` と **`pdf-lib ^1.17.0`** を持ち、外すどころか要求する。
  中身は Rails / Hotwire のブラウザ側 UI（`document.querySelector` で worker の URL を取り、
  canvas の上限 16384px を扱う）で、Node の読み手にはならない。
  ただし ROADMAP の「実地試験 1: PDF エディタ PWA」の先行実装としては読む価値がある
