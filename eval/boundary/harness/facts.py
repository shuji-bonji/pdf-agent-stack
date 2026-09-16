#!/usr/bin/env python3
"""ツール出力から**事実を抜く**—— 抽出器の唯一の実装。

`run-boundary-eval.py` と `runner_ollama.py` の両方がここを呼ぶ。

🔴 **2 か所に置かない。** 採点の付記（B0・`--facts-appendix`）と、
   報告を書く前に見せる事実ブロック（B1・`--report-mode facts-first`）は
   **同じツール出力から同じ事実を出さなければならない**。別々に実装すると、
   「コードが渡した事実」と「コードが採点に使った事実」が食い違い、
   B1 の結果を読むときに**どちらのずれを見ているのか分けられなくなる**。

⚠️ ここは**ツール出力に書いてあることだけ**を書く。既定値に倒さない ——
   倒すと「測っていないこと」を事実として書くことになる。
"""

from __future__ import annotations

import json
import re


# ── 判定の語彙（`evaluate_policy` 自身のもの）
POLICY_VALUES = "trust_and_use|use_with_caution|human_review_required|reject"

def first_group(match: re.Match | None) -> str | None:
    """交替（|）で書いた正規表現から、実際に捕まった群を 1 つ返す"""
    if not match:
        return None
    return next((g for g in match.groups() if g), None)


def _enclosing_object_ids(text: str) -> list[int]:
    """各文字位置に「それを囲んでいる `{ }` の通し番号」を割り当てる。

    ツール出力は JSON と地の文が混ざったテキストで、どこが 1 つの文書かも分からない。
    だが**この値がどのオブジェクトのものか**さえ分かれば足りる。文字列リテラルの中の
    波括弧は数えない（`"reason": "… {x} …"` で崩れる）。

    正規表現の前後 N 文字を見る方式では書けない —— 最初にそれをやって、
    トップレベルの `"verdict"` の直後にある `firedRules[0]` の `}` を拾い、
    「これは規則の値だ」と誤判定した（2026-07-29）。**入れ子は距離では測れない。**
    """
    ids = [-1] * (len(text) + 1)
    stack: list[int] = []
    next_id = 0
    in_string = False
    escaped = False
    for i, ch in enumerate(text):
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
        elif ch == '"':
            in_string = True
        elif ch == "{":
            stack.append(next_id)
            next_id += 1
        elif ch == "}" and stack:
            ids[i] = stack.pop()
            continue
        ids[i] = stack[-1] if stack else -1
    return ids


def extract_policy_verdict(haystack: str) -> str | None:
    """`evaluate_policy` の**最終判定**を読む。**最後の呼び出しの値**を採る。

    ⚠️ **`"verdict"` は 1 つの応答に 3 種類ある。**

        {"profile": …, "verdict": "human_review_required",      ← これが最終判定
         "firedRules": [{"ruleId": …, "verdict": "…"}, …],      ← 規則ごとの重み
         "facts": {"signatures": [{"verdict": "valid"}]}}       ← 署名の検証結果

    最終判定は**発火した規則のうち最も重いもの**なので、`firedRules` の**最後**とは
    一致しない。G-3（`POL-REVIEW-DOCMDP-VIOLATION` が先頭で発火し、後ろに軽い
    caution 規則が 2 つ続く）で、`human_review_required` を `use_with_caution` と
    読み違えた（2026-07-29・10 回目。§18-O）。**位置ではなく構造で選ぶ。**
    """
    found: list[tuple[int, str]] = []
    # markdown: `- Verdict: **x**`（規則行は `- **POL-…** → x` なので混ざらない）
    for m in re.finditer(rf"(?m)^\s*-\s*Verdict:\s*\*\*({POLICY_VALUES})\*\*", haystack):
        found.append((m.start(), m.group(1)))
    # json: **同じオブジェクトが `ruleId` を持つなら規則の重み**、持たないものが最終判定。
    # キーの並び順には依存しない（囲んでいるオブジェクトで判定する）
    ids = _enclosing_object_ids(haystack)
    rule_objects = {ids[m.start()] for m in re.finditer(r'"ruleId"', haystack)}
    for m in re.finditer(rf"\"verdict\"\s*:\s*\"({POLICY_VALUES})\"", haystack):
        if ids[m.start()] in rule_objects:
            continue
        found.append((m.start(), m.group(1)))
    return max(found)[1] if found else None


# **表記ではなく値を返す。** markdown の `Result: **NOT COMPLIANT**` と
# json の `"compliant": false` は同じ事実で、どちらが出るかは
# エージェントが選んだ response_format でしかない。表記のまま返すと、
# **同じ判定を「対の前提が崩れた」と読む**（15 回目の P-3 で踏んだ・§21-S）。
CONFORMANCE_CANON = {
    "COMPLIANT": "compliant",
    "true": "compliant",
    "NOT COMPLIANT": "non_compliant",
    "false": "non_compliant",
    "NO VIOLATIONS DETECTED": "not_determined",
    "null": "not_determined",
}


def extract_conformance_result(haystack: str) -> str | None:
    """`validate_conformance` の結果を読む。**最後の呼び出しの値**を、正規化して返す。"""
    found: list[tuple[int, str]] = []
    for m in re.finditer(
        r"(?m)^\s*-\s*Result:\s*\*\*(COMPLIANT|NOT COMPLIANT|NO VIOLATIONS DETECTED)\*\*", haystack
    ):
        found.append((m.start(), CONFORMANCE_CANON[m.group(1)]))
    for m in re.finditer(r"\"compliant\"\s*:\s*(true|false|null)", haystack):
        found.append((m.start(), CONFORMANCE_CANON[m.group(1)]))
    return max(found)[1] if found else None


# ── 事実ブロックに載せる項目
#
# 🔴 **項目一覧は版として記録に残す**（`ITEM_SET`）。一覧を足すたびに B0 の付記の中身が
#    変わるので、版が記録に無いと**古い記録と新しい記録を同じ表に並べられる**。
#    2026-08-16 に Context を足し（§12.3）、2026-08-18 に完全性（12.8.3.4.5 a）を足した。
#    2026-08-18b（§17.14）に 3 項目を足した —— 署名の検証結果（verdict）・調べた規則の数・
#    署名の範囲より後ろのバイト数。**どれも既にツール出力から読めていたのに捨てていた値**で、
#    足す前は「B3 + 選択」で答えられるのが 26 ケース中 6 件だった（§17.13）。
#    ⚠️ `embedded_fonts` は行を変えずに**値だけ**正規化した（`0` → `not_embedded`）——
#    表記ではなく値を返す（`CONFORMANCE_CANON` と同じ扱い）。
ITEM_SET = "2026-08-18b"

# ── 完全性（ISO 32000-2 12.8.3.4.5 a）
#
# 🔴 **判定器（`assertion.py`）が測るスロットは、事実ブロックが全部持っていなければならない。**
#    持っていないスロットについて B1 のモデルは「書かない」か「観測していないと書く」しかなく、
#    **観測は確定しているのに報告が不明と書く**（過小・`specs/28` §3.1）を器が作り出すことになる。
#    完全性は 4 スロットの 1 つなので載せる。markdown / JSON の**両方の形**を受ける
#    （どちらが出るかはエージェントが選んだ `response_format` でしかない）。
SIG_VERIFIED = re.compile(r"Signature cryptographically verified:\s*\*\*(yes|no)\*\*"
                          r"|\"signatureVerified\"\s*:\s*(true|false)")
DIGEST_MATCH = re.compile(r"Digest match \(ByteRange vs messageDigest\):\s*\*\*(yes|no)\*\*"
                          r"|\"digestMatches\"\s*:\s*(true|false)")
COVERS_FILE = re.compile(r"Covers entire file:\s*(yes|no)\b"
                         r"|\"coversEntireFile\"\s*:\s*(true|false)")
BYTES_AFTER = re.compile(r"\"bytesAfterSignedRange\"\s*:\s*(\d+)"
                         r"|(\d+)\s*byte\(s\) added after signed range")
# 署名 1 本ごとの検証結果。**判定器（`assertion.py`）の `integrity` はこの値を観測に使う**のに、
# 事実ブロックは持っていなかった（`specs/28` §17.9 に「今は足さない」と書いた項目）。
# ⚠️ これは a)〜d) を合わせた結論ではない —— 同じ応答で trust が `not_evaluated`、
#    revocation が `unknown` のまま `verdict: valid` が出る。**署名値の検証の結果である。**
# ⚠️ `(?m)` は**式の先頭**に置く。途中に書くと Python 3.11 以降で
#    `re.PatternError: global flags not at the start of the expression` になる
#    （このサンドボックスは 3.10 で**警告どまり**、ホストは 3.13 で**落ちる**）。
#    `test-no-shadowed-imports.py` が静的に見張っている。
SIGNATURE_VERDICT = re.compile(r"(?m)\"verdict\"\s*:\s*\"(valid|invalid|indeterminate)\""
                               r"|^\s*-?\s*Verdict:\s*\*\*(VALID|INVALID|INDETERMINATE)\*\*")
# 調べた規則の数。`FAILED_RULES` が第 2 群で捕まえていたが、**値にしていなかった**
CHECKED_RULES = re.compile(r"\"checkedRules\"\s*:\s*(\d+)|Rules:\s*(\d+)\s*checked")

TRUST_STATUS = re.compile(r"Trust:\s*\*\*(\w+)\*\*|\"trust\"\s*:\s*\{[^}]*?\"status\"\s*:\s*\"(\w+)\"")
REVOCATION_STATUS = re.compile(
    r"Revocation:\s*\*\*(\w+)\*\*|\"revocation\"\s*:\s*\{[^}]*?\"status\"\s*:\s*\"(\w+)\"")
DECLARATION_RISK = re.compile(r"(FONT_NOT_EMBEDDED|declarationRisks)")
NOT_PERFORMED = re.compile(r"NOT PERFORMED|\"performed\"\s*:\s*false|native_engine_requested")
# 系統 N の事実ブロックと項目を揃えるためのもの（§11.19）。
# **ツール出力に無ければ書かない** —— 既定値に倒すと「測っていないこと」を書くことになる
FAILED_RULES = re.compile(r"\"failedRules\"\s*:\s*(\d+)(?:[^}]*?\"checkedRules\"\s*:\s*(\d+))?"
                          r"|Rules:\s*(?:\d+)\s*checked[^\n]*?(\d+)\s*failed")
IS_TAGGED = re.compile(r"\"isTagged\"\s*:\s*(true|false)|\*\*Tagged\*\*:\s*(Yes|No)")
EMBEDDED_COUNT = re.compile(r"\"embeddedCount\"\s*:\s*(\d+)")


CONTEXT_MARKDOWN = re.compile(r"^[ \t]*-[ \t]*Context:[ \t]*(.+?)[ \t]*$", re.M)
CONTEXT_JSON = re.compile(r'"note"\s*:\s*"((?:[^"\\]|\\.)*)"')


def constraint_contexts(haystack: str, limit: int = 3) -> list[str]:
    """条文違反に付いている Context を、**ツールが書いたまま**取り出す。

    markdown と JSON の両方の形で出る（`response_format` は既定 markdown だが、
    モデルが JSON を要求することもある）。**両方受ける** ——
    片方だけ見ると「出力の形が違うだけ」で運べなくなる。

    ⚠️ 重複を除き、順序は出た順を保つ（同じ note が複数の対象に付くことがある）。
    """
    found: list[str] = []
    for match in CONTEXT_MARKDOWN.finditer(haystack):
        note = match.group(1).strip()
        if note and note not in found:
            found.append(note)
    for match in CONTEXT_JSON.finditer(haystack):
        try:                      # JSON のエスケープを戻す（\" \n \uXXXX）
            note = json.loads(f'"{match.group(1)}"').strip()
        except json.JSONDecodeError:
            continue
        if note and note not in found:
            found.append(note)
    return found[:limit]


def observations(haystack: str) -> list[dict]:
    """観測を**構造で**返す。1 件 = `{key, value, line}`。

    🔴 **`fact_lines()` はこの関数の派生である。** 事実ブロック（B0/B1）と
       報告の雛形（B3・`report_template.py`）が別々に観測を抜くと、
       **同じツール出力から違う項目一覧が出る**装置になる。
       雛形は `value` を見て定型文を選び、事実ブロックは `line` を並べる ——
       抜くのは 1 回だけである。

    `value` はツールが書いた生の値（`not_evaluated` / `unknown` / `yes` …）。
    値を持たない項目（宣言のリスク・未実施・Context）は `value` が `None` である。
    `line` は事実ブロックに出る行そのもの（**表記を変えない** ——
    変えると過去の記録と並べられなくなる）。
    """
    found: list[dict] = []
    if not haystack.strip():
        return found

    def add(key: str, value: str | None, line: str) -> None:
        found.append({"key": key, "value": value, "line": line})

    policy = extract_policy_verdict(haystack)
    conformance = extract_conformance_result(haystack)
    if policy:
        add("policy", policy, f"- 4 値判定（evaluate_policy）: **{policy}**")
    if conformance:
        # **採点と同じ語彙で書く。** `non_compliant` は eval の内部表現でしかなく、
        # ケースの `must_match_any` が探すのは veraPDF の表記（`NOT COMPLIANT`）と日本語である。
        # 33 回目に「コードが書いた事実が、コードの採点に当たらない」を踏んだ
        label = {"compliant": "COMPLIANT（適合）",
                 "non_compliant": "NOT COMPLIANT（非適合）",
                 "not_determined": "判定できません（部分集合では適合を証明できない）"}[conformance]
        add("conformance", conformance, f"- 適合判定（validate_conformance）: **{label}**")
    # ── 完全性（12.8.3.4.5 a）。**署名が有効かどうかは書かない** ——
    #    それは a)〜d) を合わせた結論であり、ツールの 1 項目ではない。
    #    ⚠️ 下の `verdict` は結論ではない（trust / revocation が未評価のまま valid が出る）
    verdict = first_group(SIGNATURE_VERDICT.search(haystack))
    if verdict:
        add("signature_verdict", verdict.lower(),
            f"- 署名の検証結果（verdict）: **{verdict.lower()}**")
    verified = first_group(SIG_VERIFIED.search(haystack))
    if verified:
        add("signature_verified", verified,
            "- 署名値の暗号的検証: **"
            + ("検証できた" if verified in ("yes", "true") else "検証できなかった") + "**")
    digest = first_group(DIGEST_MATCH.search(haystack))
    if digest:
        add("digest_match", digest,
            "- ダイジェストの一致（ByteRange と messageDigest）: **"
            + ("一致" if digest in ("yes", "true") else "不一致") + "**")
    covers = first_group(COVERS_FILE.search(haystack))
    if covers:
        # ⚠️ `first_group` で取る。`BYTES_AFTER` は交替（JSON / markdown）なので、
        #    `group(1)` を直に読むと markdown 側に当たったとき `None` が本文に出る（実際に出た）
        after = first_group(BYTES_AFTER.search(haystack))
        add("covers_entire_file", covers,
            "- 署名が覆う範囲: **"
            + ("ファイル全体**" if covers in ("yes", "true") else
               "ファイルの一部**"
               + (f"（署名の範囲より後に {after} バイトある）" if after is not None else "")))
    after_bytes = first_group(BYTES_AFTER.search(haystack))
    if after_bytes is not None:
        add("bytes_after_signed_range", after_bytes,
            f"- 署名の範囲より後ろのバイト数: **{after_bytes} バイト**")
    trust = first_group(TRUST_STATUS.search(haystack))
    if trust:
        add("trust", trust,
            f"- 署名者の信頼（trust）: **{trust}**"
            + ("（trust anchor 未指定のため評価していない）"
               if trust == "not_evaluated" else ""))
    revocation = first_group(REVOCATION_STATUS.search(haystack))
    if revocation:
        add("revocation", revocation,
            f"- 失効確認（revocation）: **{revocation}**"
            + ("（確認できていない）" if revocation in ("unknown", "not_checked") else ""))
    if DECLARATION_RISK.search(haystack):
        add("declaration_risk", None,
            "- **宣言のリスク: FONT_NOT_EMBEDDED** — この宣言は測ると落ちる"
            "（フォントが埋め込まれていない）")
    if NOT_PERFORMED.search(haystack):
        add("not_performed", None,
            "- **権威的検証は実施されていない**（部分集合または未実行）")

    # ── 条文違反に付いている **Context**（2026-08-16・specs/27 §12.3）────────────
    #
    # 🔴 **付記の射程外だったものを射程に入れる。** 8 走 × 43 ケースを 2 度回して、
    #    E-3（Context を落とす）だけが **8/8 → 8/8** で 1 ミリも動かなかった ——
    #    付記が効かなかったのではなく、**抜く項目の一覧に無かった**。
    #    「効かない」と「触っていない」を分けないと、装置の限界を実際より狭く見積もる。
    #
    # ⚠️ これは「緑になるまで装置をいじる」ではない。落とすと**真の記述が誤解を招く報告に変わる**
    #    ものを、コードが運ぶだけである（pdf-verify の instructions がそう要求している:
    #    "Report the context with the failure —— dropping it turns a true statement into a
    #    misleading one"）。解釈は 1 つも足さない —— **ツールが書いた文をそのまま置く。**
    #
    # 出どころは 2 つの形がある（実装を読んで確かめた・推測しない）:
    #    markdown … `  - Context: <note>`（pdf-verify formatter.ts:390）
    #    JSON     … `"note": "<note>"`（pdf-constraints の Failure.note）
    for note in constraint_contexts(haystack):
        add("constraint_context", note, f"- **条文違反に付いている Context**: {note}")

    # ── **系統 N の入力と項目を揃える**（設計書 §3 / §11.19）。
    #    教師データの事実ブロックにしか無い項目があると、学習時と推論時で入力が食い違う ——
    #    「タグ付きか」を教わったモデルが、実運用ではその行を見せてもらえないことになる。
    #    ⚠️ ここは**ツール出力から読めたものだけ**を書く（測っていないことは書かない）。
    checked = first_group(CHECKED_RULES.search(haystack))
    if checked:
        add("checked_rules", checked, f"- 検証で調べた規則: **{checked} 件**")
    rules = FAILED_RULES.search(haystack)
    if rules:
        add("failed_rules", rules.group(1),
            f"- PDF/UA-1 の検証で落ちた規則: **{rules.group(1)} 件**"
            + (f"（{rules.group(2)} 件中）" if rules.lastindex and rules.lastindex >= 2 else ""))
    tagged = first_group(IS_TAGGED.search(haystack))
    if tagged:
        add("is_tagged", tagged,
            "- 構造ツリー（タグ付き）: "
            + ("**あり**" if tagged.lower() in ("true", "yes")
               else "**なし**（支援技術は読み上げの順序を決められない）"))
    embedded = EMBEDDED_COUNT.search(haystack)
    if embedded:
        # **表記ではなく値を返す。** `0` は件数の表記であって、答えは「埋め込まれていない」である
        add("embedded_fonts",
            "not_embedded" if embedded.group(1) == "0" else "embedded",
            "- フォントの埋め込み: "
            + ("**なし**（環境によって字形が変わる）" if embedded.group(1) == "0"
               else "**あり**"))
    return found


def fact_lines(haystack: str) -> tuple[list[str], str | None, str | None]:
    """事実の行を返す。戻り値は `(行, 4 値判定, 適合判定)`。

    4 値と適合判定を別に返すのは、**判定行（`VERDICT:`）をコードが書く**ためである。

    ⚠️ **この関数は `observations()` の並べ替えでしかない。** 項目を足すときは
       `observations()` に足す —— ここに足すと雛形（B3）が見落とす。
    """
    found = observations(haystack)
    by_key = {o["key"]: o["value"] for o in found}
    return ([o["line"] for o in found],
            by_key.get("policy"), by_key.get("conformance"))


def facts_block(haystack: str) -> str:
    """事実ブロックの本文。抜けるものが 1 つも無ければ空文字を返す。

    末尾に `VERDICT:` を付けるのは 4 値または適合判定が読めたときだけ ——
    読めていないのに書くと、**コードが観測していない値を宣言する**ことになる。
    """
    lines, policy, conformance = fact_lines(haystack)
    if not lines:
        return ""
    block = "## 事実（ツール出力からコードが転記。LLM は関与していない）\n" + "\n".join(lines)
    if policy:
        block += f"\n\nVERDICT: {policy}"
    elif conformance:
        block += f"\n\nVERDICT: {conformance}"
    return block

