---
description: PDF family の 4 サーバーに共通のエラー応答の形、共通のコード、サーバーごとのコード
---

# エラーコード一覧

4 サーバーとも、失敗を同じ形で返します（pdf-agent-stack `docs/specs/06` §2.3）。ツール結果は `isError: true` で、本文は平らな JSON のオブジェクト 1 つです。分岐は `code` で、再試行するかは `retryable` で決め、次の手は `next_actions` に従ってください。英語の文を解析して判断しないでください。

```jsonc
{
  "error": "File not found.",          // 必須。英語の 1 文
  "code": "DOC_NOT_FOUND",             // 必須。共通のコードか、そのサーバーのコード
  "retryable": false,                  // 必須。引数・フラグ・環境を変えれば成功しうるか
  "hint": "...",                       // 任意。英語
  "next_actions": [                    // 任意。次に取れる手
    { "action": "verify_file_path", "reason": "...", "example": { "file_path": "/abs/path.pdf" } }
  ],
  "detail": { "cause": "ENOENT: ..." } // 任意。サーバーごとの補足
}
```

- `code`・`next_actions[].action`・`example` のキーは、Skill が分岐と再試行に使います。値を変えるのは破壊的変更として扱います。
- reader・writer・verify では `retryable` の値が `code` ごとに 1 つに決まっていて、同じコードなら同じ値です。spec だけは、エラーを投げる箇所によって値が変わります（下の表）。
- ハンドラに届く前に MCP の SDK が拒んだ要求（必須の引数が無い・ツールが宣言していないキーを渡した）は、この形ではなく、SDK の `Input validation error: …` の文のまま返ります。

## 共通のコード

同じ状況には、どのサーバーも同じコードを返します。`—` はそのサーバーが返さないコードです。

| `code` | 使う状況 | reader | writer | verify | spec |
|---|---|---|---|---|---|
| `INVALID_ARGUMENT` | 引数の誤り（相対パス・範囲外のページ・知らない flavour・URL の誤りなど）。細かい理由は `detail` にある | `true` | `true` | `true` | `true` |
| `DOC_NOT_FOUND` | 渡したパスにファイルが無い | `false` | `false` | `false` | — |
| `INVALID_PDF` | ファイルが ISO 32000 の構造の条文に反していて（0 バイト・PDF でない・途中で切れている）、書かれたとおりに読めない。**文書についての所見で、サーバーの故障ではない。** 「確かめられなかった」ではなく、構造の違反として記録する | `false` | `false` | `false` | — |
| `ENCRYPTED_PDF` | 暗号化されているので、そのツールの仕事をしない。**何をしないかはサーバーで違う**。reader は読めない（`password` 引数が無い）、writer は編集しない、verify は veraPDF に渡さない（`password` を渡せば進む） | `false` | `false` | `true` | — |
| `UNSUPPORTED_PDF_FEATURE` | 文書は正しいが、そのサーバーが扱わない機能を使っている（XFA フォームなど） | `false` | `false` | — | — |
| `FILE_TOO_LARGE` | サイズの上限を超えた | `false` | `false` | `false` | — |
| `SOURCE_API_ERROR` | `read_url` で、相手が成功以外の HTTP の状態を返したか、TLS の接続が成り立たなかった（証明書の期限切れ・名前の不一致・中間証明書の欠落・信頼されていない CA や自己署名・TLS の版や暗号スイートの不一致・取得する側の端末の日時のずれ）。同じ URL を呼び直しても直らない | `false` | — | — | — |
| `SOURCE_TIMEOUT` | `read_url` の取得が時間切れになった | `true` | — | — | — |
| `SOURCE_UNAVAILABLE` | `read_url` の取得が相手に届かなかった（接続を拒まれた・切られた・ホスト名を引けない） | `true` | — | — | — |
| `INTERNAL_ERROR` | **サーバー側の故障だけ。** 不具合の可能性があるので、引数を添えて報告する | `false` | `false` | `false` | `false` |

Fetch Standard が接続を断るポート（9 など）を指す URL は、`SOURCE_*` ではなく `INVALID_ARGUMENT` です。

## サーバーごとのコード

共通のコードのどれにも当たらないときだけ使います。

### pdf-reader-mcp

| `code` | 使う状況・対処 | `retryable` |
|---|---|---|
| `RENDERER_NOT_AVAILABLE` | `render_page` で、任意の部品 `@hyzyla/pdfium` を読み込めない。入れてからもう一度呼ぶ（サーバーの再起動は要らない） | `true` |

### pdf-writer-mcp

| `code` | 使う状況・対処 | `retryable` |
|---|---|---|
| `SIGNED_PDF` | 署名を守るために止めた。注釈の追加なら、まず `preserveSignatures: true`（増分更新。タグの無い文書だけ）。それ以外は利用者に確かめてから `allowBreakingSignatures: true` | `true` |
| `TAGGED_PDF` | 構造木を壊す操作（flatten など）なので止めた。先に代わりの手を示し、利用者の了解があれば `allowBreakingTags: true` | `true` |
| `FONT_REQUIRED` | フォントが指定されておらず、標準フォント（Helvetica、WinAnsiEncoding）で書けない字がある → `fontPath` か `PDF_WRITER_FONT`。0.26.0 から、断るのは WinAnsiEncoding に符号の無い U+0100 以上の字（日本語・`ł`・`✔` など）だけで、`“` `—` `€` `…` `™` は描ける。原因の字は `detail.characters`（`U+XXXX`）と `detail.count` に入る | `true` |
| `FONT_NOT_FOUND` | フォントのパスが誤っている → 実在するフォントを渡す | `true` |
| `MISSING_GLYPH` | フォントに無い文字がある → 別のフォントか、`onMissingGlyph: "replace"` / `"ignore"`。0.26.0 から、原因の字は `detail.characters`（`U+XXXX`、最大 1,000 字）と `detail.count` に入る。`error` の文は 10 字で切れる | `true` |

### pdf-verify-mcp

| `code` | 使う状況・対処 | `retryable` |
|---|---|---|
| `INVALID_BYTE_RANGE` | 署名の `/ByteRange` が 4 つの数でないか、ファイルの外を指している | `false` |
| `WRONG_PASSWORD` | パスワードが誤っているか、セキュリティハンドラが Standard でない | `true` |
| `VERAPDF_NOT_FOUND` / `VERAPDF_NOT_AVAILABLE` | veraPDF が入っていないか動かない → `PDF_VERIFY_VERAPDF` を設定するか、`engine: "native"`（適合を証明できない一部の規則だけを見る）を使う | `true` |
| `VERAPDF_NO_RESULT` | veraPDF は動いたが、検証の結果を返さなかった。合格でも `INTERNAL_ERROR` でもない | `false` |

### pdf-spec-mcp

| `code` | 使う状況・対処 | `retryable` |
|---|---|---|
| `REGISTRY_ERROR` | 仕様書のフォルダーが設定されていないか読めない、または `spec` の id を知らない。`next_actions` に従う（`PDF_SPEC_DIR` を設定する、`list_specs` を呼ぶ） | 原因による。フォルダーは `false`、知らない id は `true` |
| `CONTENT_ERROR` | 節・表・ページが見つからないか読めない | 原因による（別の引数で成功しうるときは `true`） |
| `PREREQUISITE_ERROR` | ツールに要る仕様書や部品が無い。`next_actions` に入れるものが書いてある | `false` |

## 旧い名前（外した）

verify 0.33.x と spec 0.12.x は移行の版で、新しいコードを返しながら、旧名を `detail.legacyCode` に残していました。**verify 0.34.0 と spec 0.13.0 で旧名を外しました。** 分岐は `code` で行ってください。旧名を読んでいた場合は、次のように置き換えてください。

| サーバー | 旧名 | いまの名前 | 外した版 |
|---|---|---|---|
| verify | `FILE_NOT_FOUND` | `DOC_NOT_FOUND` | 0.34.0 |
| verify | `PARSE_FAILED` | `INVALID_PDF` | 0.34.0 |
| verify | `MISSING_PATH` / `RELATIVE_PATH` / `NOT_A_FILE` / `INVALID_FLAVOUR` | `INVALID_ARGUMENT`（旧名は `detail.reason` にある） | 0.34.0 |
| verify | `message` / `suggestion` | `error` / `hint` | 0.34.0 |
| spec | `VALIDATION_ERROR` | `INVALID_ARGUMENT` | 0.13.0 |
