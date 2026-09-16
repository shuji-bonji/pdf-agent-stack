#!/usr/bin/env python3
"""**回してみるまで分からない形**の欠陥を、静的に見張る。

  ① import した名前が関数の中で局所変数に上書きされていないか（`specs/28` §16.7）
  ② 正規表現の**大域フラグ**（`(?m)` など）が式の先頭以外に置かれていないか（§17.16）

⚠️ ファイル名は ① だけを名乗っているが、中身は ② も見る（名前は履歴である）。

  python3 evals/boundary/harness/test-no-shadowed-imports.py

🔴 **これは実際に踏んだ欠陥の再発防止である**（2026-08-18・`specs/28` §16.7）。

`run-boundary-eval.py` に `import facts` を足したが、`main()` の中には
`facts = manifest.get("goldenFacts")` が先に在った。Python は**関数の中で 1 度でも
代入される名前をその関数全体で局所変数として扱う**ので、同じ関数の別の場所に書いた
`facts.ITEM_SET` は `UnboundLocalError` になる。

  - `python3 -m py_compile` は通る（構文としては正しい）
  - 自己検査も通る（`main()` を呼ばないから）
  - **モデルを 8 回呼び終えて、記録を書く直前で落ちた** —— 記録が 1 件も残らなかった

つまり「回してみるまで分からない」形の欠陥であり、回すのに 4 分と配信器が要る。
だから静的に見る。

## ② 正規表現の大域フラグ（2026-08-18・`specs/28` §17.16）

`re.compile(r"A|(?m)^B")` は **Python 3.11 以降でエラー**になる
（`global flags not at the start of the expression`）。3.10 までは**警告どまり**である。

  - このサンドボックスは **3.10**、ホストは **3.13** —— **同じコードで結果が違う**
  - サンドボックスの自己検査は全部通り、ホストで `import` した瞬間に落ちた

⚠️ 見張るのは**大域フラグ**（`(?m)` `(?im)` `(?-i)`）だけである。
   範囲を限る形（`(?m:...)` `(?-i:...)`）と `(?:` `(?=` `(?<=` `(?P<n>` は正しい。
"""

from __future__ import annotations

import ast
import re
import sys
from pathlib import Path

HARNESS = Path(__file__).resolve().parent


def imported_names(tree: ast.Module) -> set[str]:
    """モジュールの階層で import した名前（`as` があればそちら）"""
    names: set[str] = set()
    for node in tree.body:
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            for alias in node.names:
                names.add(alias.asname or alias.name.split(".")[0])
    return names


def assigned_names(func: ast.AST) -> set[str]:
    """その関数**自身**の本体で代入される名前（入れ子の関数は別の場面なので除く）"""
    names: set[str] = set()
    for node in ast.walk(func):
        if node is not func and isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef,
                                                  ast.Lambda, ast.ClassDef)):
            continue
        if isinstance(node, ast.Name) and isinstance(node.ctx, ast.Store):
            names.add(node.id)
    return names


# 大域フラグの形。`(?m)` `(?im)` `(?-i)` に当たり、`(?m:` `(?:` `(?=` `(?P<` には当たらない
GLOBAL_FLAG = re.compile(r"\(\?[aiLmsux]*-?[aiLmsux]*\)")
RE_FUNCS = {"compile", "search", "match", "fullmatch", "findall", "finditer", "sub", "split"}


def _literal_pattern(node: ast.AST) -> str | None:
    """正規表現として書かれた文字列を組み立てる。f-string は差し込みを `\x00` に置く。

    ⚠️ **位置がずれないようにする。** 差し込みを消すと、その後ろの `(?m)` が
       先頭に見えてしまう（見逃す側の誤り）。
    """
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        out = []
        for part in node.values:
            if isinstance(part, ast.Constant) and isinstance(part.value, str):
                out.append(part.value)
            else:
                out.append("\x00")
        return "".join(out)
    return None


# 🔴 **`re.compile()` の引数だけ見ても足りない。** `assertion.SLOTS` は正規表現を
#    辞書の値として持ち、照合するときに初めてコンパイルされる —— そちらは
#    **実行時に**落ちる。辞書の鍵で拾う。
PATTERN_KEYS = {"positive", "negative", "undetermined", "topic", "observe", "pattern"}


def _flag_problems(path: Path, lineno: int, pattern: str, where: str) -> list[str]:
    out = []
    for m in GLOBAL_FLAG.finditer(pattern):
        if m.start() == 0:
            continue
        out.append(
            f"{path.name}:{lineno} {where}の大域フラグ `{m.group(0)}` が"
            f"式の {m.start()} 文字目に在る（Python 3.11 以降でエラー）。"
            f"先頭に移すか、範囲を限る形 `(?{m.group(0)[2:-1].rstrip('-')}:…)` にする")
    return out


def check_global_flags(path: Path, tree: ast.Module) -> list[str]:
    problems: list[str] = []
    for node in ast.walk(tree):
        # ① `re.compile(...)` などの第 1 引数
        if (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                and node.func.attr in RE_FUNCS
                and isinstance(node.func.value, ast.Name) and node.func.value.id == "re"
                and node.args):
            pattern = _literal_pattern(node.args[0])
            if pattern is not None:
                problems += _flag_problems(path, node.lineno, pattern, "正規表現")
        # ② 辞書の値として持っている正規表現（`assertion.SLOTS`）
        if isinstance(node, ast.Dict):
            for key, value in zip(node.keys, node.values):
                if not (isinstance(key, ast.Constant) and key.value in PATTERN_KEYS):
                    continue
                items = value.elts if isinstance(value, (ast.List, ast.Tuple)) else [value]
                for item in items:
                    pattern = _literal_pattern(item)
                    if pattern is not None:
                        problems += _flag_problems(
                            path, getattr(item, "lineno", node.lineno), pattern,
                            f"辞書 `{key.value}` の正規表現")
    return problems


def check(path: Path) -> list[str]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    imports = imported_names(tree)
    problems: list[str] = check_global_flags(path, tree)
    for func in ast.walk(tree):
        if not isinstance(func, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        shadowed = assigned_names(func) & imports
        for name in sorted(shadowed):
            # その関数の中で**属性として**参照していれば、そこは必ず落ちる
            used_as_module = [
                n.lineno for n in ast.walk(func)
                if isinstance(n, ast.Attribute) and isinstance(n.value, ast.Name)
                and n.value.id == name and isinstance(n.value.ctx, ast.Load)
            ]
            if used_as_module:
                problems.append(
                    f"{path.name}:{func.lineno} {func.name}() が import した `{name}` を"
                    f"局所変数で上書きし、{used_as_module} 行目で `{name}.…` を参照している"
                    f"（実行時に UnboundLocalError）")
            else:
                problems.append(
                    f"{path.name}:{func.lineno} {func.name}() が import した `{name}` を"
                    f"局所変数で上書きしている（今は参照していないが、足せば落ちる）")
    return problems


def main() -> int:
    problems: list[str] = []
    targets = sorted(p for p in HARNESS.glob("*.py"))
    for path in targets:
        problems += check(path)
    print(f"# 静的な検査（{len(targets)} ファイル）—— import 名の上書き / 正規表現の大域フラグ\n")
    for problem in problems:
        print("❌ " + problem)
    print("\n全項目 OK" if not problems else f"\n{len(problems)} 件")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
