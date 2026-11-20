import Taro from '@tarojs/taro'
import { parseMenu, type Meal, type MenuEnvelope } from '../domain/menu'
import { migrateUntouchedDemoMenu, SAMPLE_MEALS } from '../domain/sample'

const KEY = 'today-eat-what.menu.v1'

export function readMenu(): Meal[] {
  try {
    const raw: unknown = Taro.getStorageSync(KEY)
    if (!raw) return SAMPLE_MEALS.map((meal) => ({ ...meal }))
    const data: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw
    const parsed = parseMenu(data)
    return parsed ? migrateUntouchedDemoMenu(parsed) : SAMPLE_MEALS.map((meal) => ({ ...meal }))
  } catch {
    return SAMPLE_MEALS.map((meal) => ({ ...meal }))
  }
}

export function writeMenu(items: Meal[]): boolean {
  try {
    const payload: MenuEnvelope = { version: 1, items }
    Taro.setStorageSync(KEY, JSON.stringify(payload))
    return true
  } catch {
    return false
  }
}
