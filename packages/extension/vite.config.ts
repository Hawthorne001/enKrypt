import { fileURLToPath, URL } from 'node:url'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import chromeManifest from './src/manifest/manifest.chrome'
import firefoxManifest from './src/manifest/manifest.firefox'
import operaManifest from './src/manifest/manifest.opera'
import assetsRewritePlugin from './configs/vite/assets-rewrite'
import transformManifest from './configs/vite/transform-manifest'
import transformCSInject from './configs/vite/transform-cs-inject'
import { version as nodeVersion } from 'node:process'
import { version } from './package.json'

const BROWSER = process.env.BROWSER

const getManifest = () => {
  switch (BROWSER) {
    case 'firefox':
      return firefoxManifest
    case 'opera':
      return operaManifest
    default:
      return chromeManifest
  }
}

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  define: {
    __PREFILL_PASSWORD__: JSON.stringify('test pass'),
    PACKAGE_VERSION: JSON.stringify(version),
    IS_DEV: process.env.NODE_ENV === 'development',
    IS_FIREFOX: BROWSER === 'firefox',
    IS_OPERA: BROWSER === 'opera',
    IS_CHROME: BROWSER === 'chrome',
    IS_SAFARI: BROWSER === 'safari',
    BUILD_TIME:
      BROWSER === 'firefox'
        ? JSON.stringify('FF-build')
        : new Date().toLocaleString().replace(/\D/g, ''),
  },
  plugins: [
    nodePolyfills({
      include: [
        'crypto',
        'buffer',
        'util',
        'stream',
        'url',
        'http',
        'https',
        'path',
        'process',
      ],
      protocolImports: true,
    }),
    vue(),
    assetsRewritePlugin,
    transformCSInject(),
    transformManifest(),
    crx({
      manifest: getManifest(),
      browser: BROWSER === 'firefox' ? 'firefox' : 'chrome',
      contentScripts: {
        injectCss: false,
      },
    }),
  ],
  css: {
    preprocessorOptions: {
      less: {
        math: 'always',
        relativeUrls: true,
        javascriptEnabled: true,
      },
    },
  },
  build: {
    commonjsOptions: { transformMixedEsModules: true },
    emptyOutDir: true,
    sourcemap: process.env.MINIFY === 'true' ? false : true,
    minify: process.env.MINIFY === 'true' ? 'esbuild' : false,
    rollupOptions: {
      plugins: [],
      input: {
        action: 'action.html',
        onboard: 'onboard.html',
        index: 'index.html',
      },
    },
  },
  optimizeDeps: {
    include: ['vue', '@vueuse/core', 'webextension-polyfill', 'crypto'],
    exclude: ['node:fs/promises', 'zlib'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@action': fileURLToPath(new URL('./src/ui/action', import.meta.url)),
    },
  },
})
