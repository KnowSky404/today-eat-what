import { defineConfig } from '@tarojs/cli'

const basePath = process.env.PUBLIC_BASE_PATH || '/'

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'today-eat-what',
    date: '2026-11-19',
    designWidth: 750,
    sourceRoot: 'src',
    outputRoot: 'dist',
    framework: 'react',
    compiler: 'vite',
    plugins: [],
    defineConstants: {},
    mini: {
      postcss: { pxtransform: { enable: false }, autoprefixer: { enable: true } },
    },
    h5: {
      publicPath: basePath,
      staticDirectory: 'static',
      router: { mode: 'hash', basename: '/' },
      postcss: { pxtransform: { enable: false }, autoprefixer: { enable: true } },
    },
  }
  return merge({}, baseConfig)
})
