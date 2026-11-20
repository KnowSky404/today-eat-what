import { spawnSync } from 'node:child_process'
import { createPrivateKey } from 'node:crypto'
import { mkdir, readFile, realpath, rm } from 'node:fs/promises'
import { isAbsolute, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const projectPath = join(root, 'dist-weapp')
const [action] = process.argv.slice(2)

function finish(message, code = 0) {
  // miniprogram-ci keeps a compiler worker alive after the result settles.
  const stream = code === 0 ? process.stdout : process.stderr
  stream.write(message + '\n', () => process.exit(code))
}

try {
  if (action !== 'preview' && action !== 'upload') throw new Error('用法：preview 或 upload')
  const { TARO_APP_ID: appid, WEAPP_PRIVATE_KEY_PATH: keyPath, WEAPP_VERSION: version, WEAPP_DESC: desc } = process.env
  if (!/^wx[0-9a-f]{16}$/.test(appid ?? '')) throw new Error('请在 TARO_APP_ID 中配置微信公众平台的小程序 AppID。')
  if (action === 'upload' && !version?.trim()) throw new Error('请在 WEAPP_VERSION 中配置上传版本号。')
  if (!keyPath) throw new Error('请在 WEAPP_PRIVATE_KEY_PATH 中配置小程序代码上传私钥的文件路径。')

  let privateKeyPath
  try {
    privateKeyPath = await realpath(keyPath)
  } catch {
    throw new Error('无法读取 WEAPP_PRIVATE_KEY_PATH 指向的文件。')
  }
  const keyRelativeToBuild = relative(await realpath(projectPath).catch(() => projectPath), privateKeyPath)
  if (!isAbsolute(keyRelativeToBuild) && keyRelativeToBuild !== '..' && !keyRelativeToBuild.startsWith('..' + sep)) {
    throw new Error('请将上传私钥移出 dist-weapp/。构建会清理该目录，目录中的文件也可能被打包。')
  }
  try {
    createPrivateKey(await readFile(privateKeyPath))
  } catch {
    throw new Error('无法读取上传私钥，请检查文件权限，并使用微信公众平台下载的原始私钥文件。')
  }

  const { default: ci } = await import('miniprogram-ci').catch((error) => {
    if (error.code === 'ERR_MODULE_NOT_FOUND' && error.message.includes("'miniprogram-ci'")) {
      throw new Error('请先运行 bun ci --cwd tools/weapp 安装微信发布工具。')
    }
    throw error
  })
  const build = spawnSync('bun', ['run', 'build:weapp'], { cwd: root, stdio: 'inherit' })
  if (build.error || build.status !== 0) throw new Error('微信小程序生产构建失败。')

  const config = JSON.parse(await readFile(join(projectPath, 'project.config.json'), 'utf8'))
  if (config.appid !== appid || config.miniprogramRoot !== './') throw new Error('构建产物的小程序配置与本次发布配置不一致。')
  const project = new ci.Project({
    appid,
    type: 'miniProgram',
    projectPath,
    privateKeyPath,
    ignores: ['**/*.key', '**/*.pem', '**/*.p12', '**/*.pfx'],
  })
  const options = { project, desc, setting: { useProjectConfig: true } }

  if (action === 'preview') {
    const previewDir = join(root, 'artifacts', 'weapp')
    const qrcodeOutputDest = join(previewDir, 'preview.jpg')
    await mkdir(previewDir, { recursive: true })
    await rm(qrcodeOutputDest, { force: true })
    await ci.preview({ ...options, qrcodeFormat: 'image', qrcodeOutputDest })
    finish('预览二维码已生成至 artifacts/weapp/preview.jpg')
  } else {
    await ci.upload({ ...options, version: version.trim() })
    finish(`开发版本 ${version.trim()} 已上传，请在微信公众平台的版本管理中检查。`)
  }
} catch (error) {
  finish(error.message ?? String(error), 1)
}
