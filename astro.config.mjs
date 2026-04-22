import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://mussond.com',
  integrations: [
    mdx(),
    sitemap(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  redirects: {
    '/aboutme':                                                        { status: 301, destination: '/about' },
    '/about-my-website':                                               { status: 301, destination: '/about-this-site' },
    '/all-career-case-studies':                                        { status: 301, destination: '/case-studies' },
    '/all-accessibility-guides':                                       { status: 301, destination: '/guides' },
    '/accessibility-guides':                                           { status: 301, destination: '/guides' },
    '/all-design-system-articles':                                     { status: 301, destination: '/guides' },
    '/design-system-articles':                                         { status: 301, destination: '/guides' },
    '/all-logs':                                                       { status: 301, destination: '/logs' },
    '/case-studies/checkoutcom-infinity-design-system':                { status: 301, destination: '/case-studies/checkoutcom' },
    '/case-studies/coursera-design-system':                            { status: 301, destination: '/case-studies/coursera' },
    '/case-studies/aviva-global-atomic-design-system':                 { status: 301, destination: '/case-studies/aviva' },
    '/accessibility-guides/accessibility-principles-introduction':     { status: 301, destination: '/guides/accessibility-principles-introduction' },
    '/accessibility-guides/starting-material-for-accessibility':       { status: 301, destination: '/guides/starting-material-for-accessibility' },
    '/accessibility-guides/colour-blindness-breakdown':                { status: 301, destination: '/guides/colour-blindness-breakdown' },
    '/accessibility-guides/list-of-accessibility-resources':           { status: 301, destination: '/logs/list-of-accessibility-resources' },
    '/design-system-articles/component-library-or-design-system-differences': { status: 301, destination: '/guides/component-library-or-design-system' },
    '/writing':                                                        { status: 301, destination: '/guides' },
    '/writing/accessibility-principles-introduction':                  { status: 301, destination: '/guides/accessibility-principles-introduction' },
    '/writing/colour-blindness-breakdown':                             { status: 301, destination: '/guides/colour-blindness-breakdown' },
    '/writing/component-library-or-design-system':                     { status: 301, destination: '/guides/component-library-or-design-system' },
    '/writing/starting-material-for-accessibility':                    { status: 301, destination: '/guides/starting-material-for-accessibility' },
  },
});