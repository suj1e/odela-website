import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
  site: 'https://odela.beer',
  devToolbar: { enabled: false },
  integrations: [
    starlight({
      title: 'odela',
      description: '多 agent 的本地工作台：spaces、sessions、tabs、CLI 可控。',
      logo: { src: './src/assets/icon.png', alt: 'odela' },
      favicon: '/icon.png',
      customCss: ['./src/styles/starlight.css'],
      expressiveCode: {
        themes: ['min-dark', 'min-light'],
      },
      components: {
        ThemeSelect: './src/components/ThemeSelect.astro',
      },
      defaultLocale: 'root',
      locales: {
        root: { label: '中文', lang: 'zh-CN' },
        en: { label: 'English', lang: 'en' },
      },
      sidebar: [
        {
          label: '开始',
          translations: { en: 'Start' },
          items: [
            { label: '文档', translations: { en: 'Docs' }, link: '/docs/' },
            { label: '快速开始', translations: { en: 'Getting started' }, link: '/docs/getting-started/' },
          ],
        },
      ],
    }),
  ],
});
