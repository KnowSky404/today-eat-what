import { defineConfig } from '@tarojs/cli'

const basePath = process.env.PUBLIC_BASE_PATH || '/'

export default defineConfig(async (merge) => {
  const baseConfig = {
    projectName: 'today-eat-what',
    date: '2026-11-19',
    designWidth: 750,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 375: 2, 828: 1.81 / 2 },
    sourceRoot: 'src',
    outputRoot: process.env.TARO_ENV === 'weapp' ? 'dist-weapp' : 'dist',
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
      // Do not set basename: '/' here: it prevents the initial route from mounting in Taro 4.3.1.
      router: { mode: 'hash' },
      postcss: { pxtransform: { enable: false }, autoprefixer: { enable: true } },
    },
  }
  return merge({}, baseConfig)
})
