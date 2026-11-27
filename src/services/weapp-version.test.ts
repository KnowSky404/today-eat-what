import Taro from '@tarojs/taro'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tarojs/taro', () => ({ default: {} }))

beforeEach(() => {
  vi.resetModules()
})

describe('WeChat version label', () => {
  it.each([
    ['release', '1.2.3', '正式版 v1.2.3'],
    ['release', '', '正式版'],
    ['trial', '1.2.3', '体验版'],
    ['develop', '', '开发版'],
    [undefined, '', '小程序 · 版本未知'],
  ])('formats %s with version %j', async (envVersion, version, label) => {
    Object.assign(Taro, { getAccountInfoSync: () => ({ miniProgram: { envVersion, version } }) })
    const { getWeappVersionLabel } = await import('./weapp-version')
    expect(getWeappVersionLabel()).toBe(label)
  })

  it('handles missing and throwing native APIs', async () => {
    const { getWeappVersionLabel } = await import('./weapp-version')
    Object.assign(Taro, { getAccountInfoSync: undefined })
    expect(getWeappVersionLabel()).toBe('小程序 · 版本未知')
    Object.assign(Taro, { getAccountInfoSync: () => { throw new Error('unsupported') } })
    expect(getWeappVersionLabel()).toBe('小程序 · 版本未知')
  })
})

async function setupUpdates() {
  const manager = {
    onUpdateReady: vi.fn<(callback: () => Promise<void>) => void>(),
    onUpdateFailed: vi.fn<(callback: () => void) => void>(),
    applyUpdate: vi.fn(),
  }
  const showModal = vi.fn()
  const showToast = vi.fn()
  const getUpdateManager = vi.fn(() => manager)
  Object.assign(Taro, { getUpdateManager, showModal, showToast })
  const { initWeappUpdates } = await import('./weapp-version')
  initWeappUpdates()
  initWeappUpdates()
  expect(getUpdateManager).toHaveBeenCalledTimes(1)
  expect(manager.onUpdateReady).toHaveBeenCalledTimes(1)
  expect(manager.onUpdateFailed).toHaveBeenCalledTimes(1)
  return {
    ready: manager.onUpdateReady.mock.calls[0][0],
    failed: manager.onUpdateFailed.mock.calls[0][0],
    applyUpdate: manager.applyUpdate,
    showModal,
    showToast,
  }
}

describe('WeChat updates', () => {
  it.each([true, false])('only prompts once and respects confirmation %s', async (confirm) => {
    const { ready, applyUpdate, showModal, showToast } = await setupUpdates()
    let resolveModal!: (choice: { confirm: boolean }) => void
    showModal.mockReturnValue(new Promise((resolve) => { resolveModal = resolve }))
    expect(showModal).not.toHaveBeenCalled()

    const pending = ready()
    await ready()
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(showModal).toHaveBeenCalledWith(expect.objectContaining({
      confirmText: '立即更新',
      cancelText: '稍后更新',
    }))
    expect(applyUpdate).not.toHaveBeenCalled()

    resolveModal({ confirm })
    await pending
    await ready()
    expect(showModal).toHaveBeenCalledTimes(1)
    expect(applyUpdate).toHaveBeenCalledTimes(confirm ? 1 : 0)
    expect(showToast).not.toHaveBeenCalled()
  })

  it('reports a download failure once and still accepts a later successful download', async () => {
    const { ready, failed, applyUpdate, showModal, showToast } = await setupUpdates()
    failed()
    failed()
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(showToast).toHaveBeenCalledWith({ title: '新版下载失败，请稍后重试', icon: 'none' })
    expect(showModal).not.toHaveBeenCalled()
    expect(applyUpdate).not.toHaveBeenCalled()
    showModal.mockResolvedValue({ confirm: true })
    await ready()
    expect(applyUpdate).toHaveBeenCalledTimes(1)
  })

  it('continues normally if the native dialog rejects', async () => {
    const { ready, applyUpdate, showModal, showToast } = await setupUpdates()
    showModal.mockRejectedValue(new Error('native dialog unavailable'))
    showToast.mockRejectedValue(new Error('native toast unavailable'))
    await ready()
    expect(applyUpdate).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledTimes(1)
  })

  it.each([undefined, () => undefined, () => ({}), () => { throw new Error('unsupported') }])(
    'continues normally with an unavailable update manager (%s)',
    async (getUpdateManager) => {
      const showModal = vi.fn()
      Object.assign(Taro, { getUpdateManager, showModal })
      const { initWeappUpdates } = await import('./weapp-version')
      expect(initWeappUpdates).not.toThrow()
      expect(showModal).not.toHaveBeenCalled()
    },
  )
})
