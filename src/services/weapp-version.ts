import Taro from '@tarojs/taro'

export function getWeappVersionLabel(): string {
  try {
    const miniProgram = Taro.getAccountInfoSync?.()?.miniProgram
    switch (miniProgram?.envVersion) {
      case 'release': {
        const version = miniProgram.version?.trim()
        return version ? `正式版 v${version}` : '正式版'
      }
      case 'trial':
        return '体验版'
      case 'develop':
        return '开发版'
    }
  } catch {
    // Older clients may expose an API stub that throws.
  }
  return '小程序 · 版本未知'
}

let initialized = false

export function initWeappUpdates() {
  if (initialized) return
  initialized = true

  try {
    const manager = Taro.getUpdateManager?.()
    if (!manager || typeof manager.onUpdateReady !== 'function' ||
      typeof manager.onUpdateFailed !== 'function' || typeof manager.applyUpdate !== 'function') return

    let prompted = false
    let downloadFailureShown = false
    manager.onUpdateReady(async () => {
      if (prompted) return
      prompted = true
      try {
        const { confirm } = await Taro.showModal({
          title: '有新版本',
          content: '新版本已下载，立即更新会重新打开小程序。',
          confirmText: '立即更新',
          cancelText: '稍后更新',
        })
        if (confirm) manager.applyUpdate()
      } catch {
        await showUpdateFailure('更新未完成，请稍后重试')
      }
    })
    manager.onUpdateFailed(() => {
      if (prompted || downloadFailureShown) return
      downloadFailureShown = true
      void showUpdateFailure('新版下载失败，请稍后重试')
    })
  } catch {
    // The current version remains usable if the native update API is unavailable.
  }
}

async function showUpdateFailure(title: string) {
  try {
    await Taro.showToast({ title, icon: 'none' })
  } catch {
    // Feedback is optional on clients without a working toast API.
  }
}
