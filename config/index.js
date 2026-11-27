import { execFileSync } from 'node:child_process'
import { defineConfig } from '@tarojs/cli'
import { version } from '../package.json'

const basePath = process.env.PUBLIC_BASE_PATH || '/'

function webBuildVersion() {
  let commit
  try {
    commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    // Workers Builds also provides the checkout SHA when Git metadata is unavailable.
    commit = process.env.WORKERS_CI === '1' ? process.env.WORKERS_CI_COMMIT_SHA : undefined
  }
  const shortCommit = /^[a-f0-9]{40}$/.test(commit ?? '') ? commit.slice(0, 8) : '提交未知'
  return `v${version} · ${shortCommit}`
}

export default defineConfig(async (merge) => {
  const isWeapp = process.env.TARO_ENV === 'weapp'
  const baseConfig = {
    projectName: 'today-eat-what',
    date: '2026-11-19',
    designWidth: 750,
    deviceRatio: { 640: 2.34 / 2, 750: 1, 375: 2, 828: 1.81 / 2 },
    sourceRoot: 'src',
    outputRoot: isWeapp ? 'dist-weapp' : 'dist',
    ...(isWeapp && {
      copy: {
        patterns: [{ from: 'src/assets/weapp-share.png', to: 'dist-weapp/assets/weapp-share.png' }],
      },
    }),
    framework: 'react',
    compiler: 'vite',
    plugins: [],
    defineConstants: isWeapp ? {} : { __WEB_BUILD_VERSION__: JSON.stringify(webBuildVersion()) },
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
