import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://mussond.com',
  integrations: [
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    '/aboutme':                                                        { status: 301, destination: '/about' },
    '/about-my-website':                                               { status: 301, destination: '/about-this-site' },
    '/all-career-case-studies':                                        { status: 301, destination: '/case-studies' },
    '/all-accessibility-guides':                                       { status: 301, destination: '/writing' },
    '/accessibility-guides':                                           { status: 301, destination: '/writing' },
    '/all-design-system-articles':                                     { status: 301, destination: '/writing' },
    '/design-system-articles':                                         { status: 301, destination: '/writing' },
    '/all-logs':                                                       { status: 301, destination: '/logs' },
    '/case-studies/checkoutcom-infinity-design-system':                { status: 301, destination: '/case-studies/checkoutcom' },
    '/case-studies/coursera-design-system':                            { status: 301, destination: '/case-studies/coursera' },
    '/case-studies/aviva-global-atomic-design-system':                 { status: 301, destination: '/case-studies/aviva' },
    '/accessibility-guides/accessibility-principles-introduction':     { status: 301, destination: '/writing/accessibility-principles-introduction' },
    '/accessibility-guides/starting-material-for-accessibility':       { status: 301, destination: '/writing/starting-material-for-accessibility' },
    '/accessibility-guides/colour-blindness-breakdown':                { status: 301, destination: '/writing/colour-blindness-breakdown' },
    '/accessibility-guides/list-of-accessibility-resources':           { status: 301, destination: '/logs/list-of-accessibility-resources' },
    '/design-system-articles/component-library-or-design-system-differences': { status: 301, destination: '/writing/component-library-or-design-system' },
  },
});
