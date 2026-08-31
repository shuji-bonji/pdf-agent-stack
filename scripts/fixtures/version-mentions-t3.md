# version-mentions.mjs を壊して確かめるための検体

`--t3` だけが読む（通常の走査からは外してある。SKIP_DIR の `fixtures`）。
`__READER_NOW__` は走らせるときに stack.json の pdf-reader-mcp の版に置き換わる。
検体に版を焼き込むと、reader が上がった日にこの検体の意味が変わってしまう。

拾ってほしいもの:

- pdf-reader-mcp v99.0.0 で直った
- reader は __READER_NOW__ である
- 2026-08-27 のリリース（reader 0.0.1）は過去の記述で、直してはいけない
- pdf-read v9.9.9 を要求

拾ってはいけないもの。**どの行にも部品名が隣にある** —— 部品名が無い行を並べても、
拾わないことの証明にはならない（そもそも拾いようがない）:

- verify が使う veraPDF 1.30.0（別の道具の版）
- writer の biome 2.5.4（別の道具の版）
- reader は §9.10.1 に従う（条番号）
- pdf-reader-mcp 1.9.10.1 は 4 つ組で版ではない
- ### 3.8.5 normativepdf 0.9.0 に載せる（3.8.5 は見出しの節番号）
- spec / writer が 4.4.3 は zod の版。version-mentions:ignore
