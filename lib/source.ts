import { llms, loader } from 'fumadocs-core/source';
import { remarkMdxMermaid } from 'fumadocs-core/mdx-plugins';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { applyMdxPreset } from 'fumadocs-mdx/config';
import { defineDocs } from 'fumadocs-mdx/macro';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';

const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    mdxOptions: applyMdxPreset({
      remarkPlugins: [remarkMdxMermaid],
    }),
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  // 文档页直接挂在站点根路径。内容目录的第一层只用来分组侧边栏，不进地址：
  // public/quickstart.mdx → /quickstart，self-hosted/install.mdx → /self-hosted/install。
  baseUrl: '',
  slugs: (_file, next) => {
    const slugs = next();
    return slugs[0] === 'public' ? slugs.slice(1) : slugs;
  },
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

export const docsLlms = llms(source, {
  renderPage: async (page) => `# ${page.data.title} (${page.url})

${await page.data.getText('processed')}`,
});
