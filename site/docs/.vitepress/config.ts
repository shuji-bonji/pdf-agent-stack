import { defineConfig } from 'vitepress';
import llmstxt from 'vitepress-plugin-llms';
import { withMermaid } from 'vitepress-plugin-mermaid';

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
        { text: 'pdf-publish', link: `${prefix}/skills/pdf-publish` }
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
      items: [{ text: 'pdf-reader', link: `${prefix}/reference/mcp/pdf-reader` }]
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
  isoPrimer: 'How to Read ISO Specs', mcpTools: 'MCP Tools Reference'
};

const ja = {
  guide: 'ガイド', overview: 'PDF Agent Stack とは', architecture: '全体構成と責務',
  gettingStarted: '導入手順', agents: '専門エージェント構築',
  mcp: 'MCP サーバー', mcpIndex: '一覧', skillsIndex: '一覧',
  useCases: 'ユースケース', ucIndex: '一覧', ucIncoming: '受入監査',
  ucPublish: '納品パイプライン', ucPdfa: '長期保存 (PDF/A)', ucA11y: 'アクセシビリティ (PDF/UA)',
  ucSpec: '仕様調査', ucBatch: '一括監査',
  envVars: '環境変数', errorCodes: 'エラーコード', glossary: '用語集',
  isoPrimer: 'ISO 仕様書の読み方', mcpTools: 'MCP ツールリファレンス'
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
    base: '/pdf-agent-stack/',
    lastUpdated: true,
    vite: { plugins: [llmstxt()] },
    head: [
      ['link', { rel: 'icon', type: 'image/svg+xml', href: '/pdf-agent-stack/images/logo.svg' }]
    ],
    locales: {
      root: {
        label: 'English',
        lang: 'en',
        title: 'PDF Agent Stack',
        description:
          'Read, verify, write — grounded in the spec. PDF tooling for AI agents: four MCP servers and two skills.',
        themeConfig: { siteTitle: 'PDF Agent Stack', nav: nav('', en), sidebar: sidebar('', en) }
      },
      ja: {
        label: '日本語',
        lang: 'ja',
        link: '/ja/',
        title: 'PDF Agent Stack',
        description:
          '読む・検証する・書く・仕様で裏付ける — AI エージェントのための PDF ツール群。4 つの MCP サーバーと 2 つの Skill。',
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
