import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';
import { withMermaid } from 'vitepress-plugin-mermaid';

/** プロジェクトページなので base を含む。OGP の URL は絶対でなければ無視される。 */
const BASE = '/pdf-agent-stack/';
const SITE = `https://shuji-bonji.github.io${BASE}`;

const mcpSidebar = (prefix: string, labels: Record<string, string>) => [
  {
    text: labels.mcp,
    items: [
      { text: labels.mcpIndex, link: `${prefix}/mcp/` },
      { text: 'pdf-spec-mcp', link: `${prefix}/mcp/pdf-spec` },
      { text: 'pdf-reader-mcp', link: `${prefix}/mcp/pdf-reader` },
      { text: 'pdf-verify-mcp', link: `${prefix}/mcp/pdf-verify` },
      { text: 'pdf-writer-mcp', link: `${prefix}/mcp/pdf-writer` }
    ]
  }
];

const sidebar = (prefix: string, l: Record<string, string>) => ({
  [`${prefix}/guide/`]: [
    {
      text: l.guide,
      items: [
        { text: l.overview, link: `${prefix}/guide/overview` },
        { text: l.architecture, link: `${prefix}/guide/architecture` },
        { text: l.gettingStarted, link: `${prefix}/guide/getting-started` },
        { text: l.agents, link: `${prefix}/guide/agents` }
      ]
    }
  ],
  [`${prefix}/mcp/`]: mcpSidebar(prefix, l),
  [`${prefix}/skills/`]: [
    {
      text: 'Skills',
      items: [
        { text: l.skillsIndex, link: `${prefix}/skills/` },
        { text: 'pdf-trust', link: `${prefix}/skills/pdf-trust` },
        { text: 'pdf-publish', link: `${prefix}/skills/pdf-publish` },
        { text: 'pdf-read', link: `${prefix}/skills/pdf-read` }
      ]
    }
  ],
  [`${prefix}/use-cases/`]: [
    {
      text: l.useCases,
      items: [
        { text: l.ucIndex, link: `${prefix}/use-cases/` },
        { text: l.ucIncoming, link: `${prefix}/use-cases/incoming-audit` },
        { text: l.ucPublish, link: `${prefix}/use-cases/publish-pipeline` },
        { text: l.ucPdfa, link: `${prefix}/use-cases/pdfa-archive` },
        { text: l.ucA11y, link: `${prefix}/use-cases/accessibility` },
        { text: l.ucSpec, link: `${prefix}/use-cases/spec-research` },
        { text: l.ucBatch, link: `${prefix}/use-cases/batch-audit` }
      ]
    }
  ],
  [`${prefix}/reference/`]: [
    {
      text: 'Reference',
      items: [
        { text: l.isoPrimer, link: `${prefix}/reference/iso-reading-primer` },
        { text: l.envVars, link: `${prefix}/reference/env-vars` },
        { text: l.errorCodes, link: `${prefix}/reference/error-codes` },
        { text: l.glossary, link: `${prefix}/reference/glossary` }
      ]
    },
    {
      text: l.mcpTools,
      items: [
        { text: 'pdf-spec', link: `${prefix}/reference/mcp/pdf-spec` },
        { text: l.specOutput, link: `${prefix}/reference/pdf-spec-output` },
        { text: 'pdf-reader', link: `${prefix}/reference/mcp/pdf-reader` },
        { text: 'pdf-verify', link: `${prefix}/reference/mcp/pdf-verify` },
        { text: 'pdf-writer', link: `${prefix}/reference/mcp/pdf-writer` }
      ]
    },
    {
      text: l.library,
      items: [{ text: 'pdf-constraints', link: `${prefix}/reference/pdf-constraints` }]
    }
  ]
});

const en = {
  guide: 'Guide', overview: 'What is PDF Agent Stack?', architecture: 'Architecture & Responsibilities',
  gettingStarted: 'Getting Started', agents: 'Building PDF Agents',
  mcp: 'MCP Servers', mcpIndex: 'Overview', skillsIndex: 'Overview',
  useCases: 'Use Cases', ucIndex: 'Overview', ucIncoming: 'Incoming PDF Audit',
  ucPublish: 'Publish Pipeline', ucPdfa: 'PDF/A Archiving', ucA11y: 'Accessibility (PDF/UA)',
  ucSpec: 'Spec Research', ucBatch: 'Batch Audit',
  envVars: 'Environment Variables', errorCodes: 'Error Codes', glossary: 'Glossary',
  isoPrimer: 'How to Read ISO Specs', mcpTools: 'MCP Tools Reference', library: 'Library',
  specOutput: 'Reading pdf-spec Output'
};

const ja = {
  guide: 'ガイド', overview: 'PDF Agent Stack とは', architecture: '全体構成と責務',
  gettingStarted: '導入手順', agents: '専門エージェント構築',
  mcp: 'MCP サーバー', mcpIndex: '一覧', skillsIndex: '一覧',
  useCases: 'ユースケース', ucIndex: '一覧', ucIncoming: '受入監査',
  ucPublish: '納品パイプライン', ucPdfa: '長期保存 (PDF/A)', ucA11y: 'アクセシビリティ (PDF/UA)',
  ucSpec: '仕様調査', ucBatch: '一括監査',
  envVars: '環境変数', errorCodes: 'エラーコード', glossary: '用語集',
  isoPrimer: 'ISO 仕様書の読み方', mcpTools: 'MCP ツールリファレンス', library: 'ライブラリ',
  specOutput: 'pdf-spec の出力の読み方'
};

const nav = (prefix: string, l: Record<string, string>) => [
  { text: l.guide, link: `${prefix}/guide/overview` },
  { text: 'MCP', link: `${prefix}/mcp/` },
  { text: 'Skills', link: `${prefix}/skills/` },
  { text: l.useCases, link: `${prefix}/use-cases/` },
  { text: 'Reference', link: `${prefix}/reference/env-vars` }
];

export default withMermaid(
  defineConfig({
    title: 'PDF Agent Stack',
    description:
      'Read, verify, write and reason about PDFs — a family of MCP servers and skills for AI agents',
    base: BASE,
    lastUpdated: true,
    // markdown-it-attrs を無効化する。生成リファレンスの例示行
    // 「- 全文抽出: { file_path: "/doc.pdf" }」の行末 {...} を attrs が属性として
    // 消費し、`<li file_path:="" doc.pdf,="">` のような不正な属性名（カンマ・角括弧入り）
    // を生む。例示テキストが全ブラウザで消えるうえ、リリース版 Safari は SPA 遷移の
    // mount 時に setAttribute が InvalidCharacterError を投げて本文が空白になる
    // （リロード時は SSG HTML の hydration なので発症しない）。attrs 構文 {.class}
    // の意図的使用はサイト内に無い。
    markdown: { attrs: { disable: true } },
    // プロジェクトページなので base まで含める（sitemap の URL は hostname + ページパスで組まれる）
    sitemap: { hostname: SITE },
    // llms.txt 生成はビルド時のみ有効化する。
    // プラグインの dev ミドルウェアは「.md で終わる全リクエスト」を横取りして
    // dist の生 Markdown を返すため、dist が存在すると dev の SPA 遷移
    // （ページを .md モジュールとして取得する）が全ページで壊れる。
    vite: {
      plugins: [llmstxt().map((p) => ({ ...p, apply: 'build' as const }))],
      // mermaid 本体は事前バンドルされず生 ESM のまま配信されるため、その依存のうち
      // CJS/UMD のものは名指しで事前バンドルしないと dev でブラウザが読めない
      // （生の UMD を ESM として読むので export が無く、
      //  "does not provide an export named 'default'" になる）。
      // vitepress-plugin-mermaid が入れてくれるのは cytoscape 等だけなので、
      // 漏れているものをここで足す。fastdom は mermaid 11.17 で増えた依存。
      // build は Rollup の CJS 変換が効くので再現しない。
      optimizeDeps: {
        include: ['fastdom', 'fastdom/extensions/fastdom-promised.js', 'cytoscape-fcose']
      }
    },
    head: [
      // favicon: SVG を優先し、対応しないブラウザは .ico に落ちる
      ['link', { rel: 'icon', type: 'image/svg+xml', href: `${BASE}images/logo.svg` }],
      ['link', { rel: 'icon', type: 'image/x-icon', href: `${BASE}favicon.ico` }],
      ['link', { rel: 'apple-touch-icon', sizes: '180x180', href: `${BASE}apple-touch-icon.png` }],
      ['link', { rel: 'manifest', href: `${BASE}site.webmanifest` }],
      ['meta', { name: 'theme-color', content: '#b41535' }],
      // OGP / Twitter の固定分。url・title・description・image はページごとに
      // transformPageData が差し替える（og:image は絶対 URL でなければ無視される）。
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:site_name', content: 'PDF Agent Stack' }],
      ['meta', { property: 'og:image:width', content: '1200' }],
      ['meta', { property: 'og:image:height', content: '630' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:creator', content: '@shuji_bonji' }]
    ],
    transformPageData(pageData) {
      const isJa = pageData.relativePath.startsWith('ja/');
      const path = pageData.relativePath.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html');
      // layout: home のページは title を持たない（h1 が無いため）。
      // その場合サイト名だけを使う — " | PDF Agent Stack" の頭が空になるのを防ぐ。
      const pageTitle = (pageData.frontmatter.title ?? pageData.title ?? '').trim();
      const title = pageTitle ? `${pageTitle} | PDF Agent Stack` : 'PDF Agent Stack';
      const description =
        pageData.frontmatter.description ??
        (isJa
          ? 'AI エージェントのための PDF ツール群 — 4 つの MCP サーバーと 3 つの Skill'
          : 'PDF tooling for AI agents — four MCP servers and two Skills');
      const image = `${SITE}${isJa ? 'images/og-image-ja.png' : 'images/og-image.png'}`;

      pageData.frontmatter.head ??= [];
      pageData.frontmatter.head.push(
        ['meta', { property: 'og:url', content: `${SITE}${path}` }],
        ['meta', { property: 'og:title', content: title }],
        ['meta', { property: 'og:description', content: description }],
        ['meta', { property: 'og:image', content: image }],
        ['meta', { property: 'og:image:alt', content: 'PDF Agent Stack' }],
        ['meta', { property: 'og:locale', content: isJa ? 'ja_JP' : 'en' }],
        ['meta', { name: 'twitter:title', content: title }],
        ['meta', { name: 'twitter:description', content: description }],
        ['meta', { name: 'twitter:image', content: image }]
      );
    },
    locales: {
      root: {
        label: 'English',
        lang: 'en',
        title: 'PDF Agent Stack',
        description:
          'Read, verify, write — grounded in the spec. PDF tooling for AI agents: four MCP servers and three skills.',
        themeConfig: { siteTitle: 'PDF Agent Stack', nav: nav('', en), sidebar: sidebar('', en) }
      },
      ja: {
        label: '日本語',
        lang: 'ja',
        link: '/ja/',
        title: 'PDF Agent Stack',
        description:
          '読む・検証する・書く・仕様で裏付ける — AI エージェントのための PDF ツール群。4 つの MCP サーバーと 3 つの Skill。',
        themeConfig: { siteTitle: 'PDF Agent Stack', nav: nav('/ja', ja), sidebar: sidebar('/ja', ja) }
      }
    },
    themeConfig: {
      logo: '/images/logo.svg',
      search: { provider: 'local' },
      socialLinks: [
        { icon: 'github', link: 'https://github.com/shuji-bonji/pdf-agent-stack' },
        { icon: 'npm', link: 'https://www.npmjs.com/~shuji-bonji' }
      ],
      footer: {
        message: 'MIT Licensed',
        copyright: '© shuji-bonji'
      }
    }
  })
);
