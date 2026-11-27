import Taro from '@tarojs/taro'

const KEY = 'today-eat-what.fast-spin'

export function readFastSpin(): boolean {
  try {
    return Taro.getStorageSync(KEY) === true
  } catch {
    return false
  }
}

export function writeFastSpin(enabled: boolean) {
  try {
    Taro.setStorageSync(KEY, enabled)
  } catch {
    // The current session still uses the selected preference.
  }
}
