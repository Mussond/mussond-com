import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://mussond.github.io',
  base: '/mussond-com',
  integrations: [tailwind()],
});