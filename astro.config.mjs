import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://mussond.github.io',
  base: '/mussond-com',
  vite: {
    plugins: [tailwindcss()],
  },
});