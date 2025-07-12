// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import glsl from 'vite-plugin-glsl';
import { visualizer } from 'rollup-plugin-visualizer';
import sitemap from '@astrojs/sitemap';
import netlify from '@astrojs/netlify';
// import sveltiaCms from 'astro-sveltia-cms';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://edce.space',
  // integrations: [mdx(), sitemap(), sveltiaCms({}), icon()],
  integrations: [mdx(), sitemap(), icon()],
  output: 'hybrid',
  // output: 'server',
  adapter: netlify(),
  vite: {
    plugins: [
      glsl(),
      visualizer({
        emitFile: true,
        filename: 'stats.html',
      }),
    ],
    ssr: {
      noExternal: ['normalize.css'],
    },
  },
});
