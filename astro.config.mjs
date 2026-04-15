import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  site: 'https://mussond.github.io',
  base: isProd ? '/mussond-com' : '/',
  vite: {
    plugins: [tailwindcss()],
  },
});