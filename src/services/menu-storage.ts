import Taro from '@tarojs/taro'
import { parseMenu, type Meal, type MenuEnvelope } from '../domain/menu'
import { migrateUntouchedDemoMenu, SAMPLE_MEALS } from '../domain/sample'

const KEY = 'today-eat-what.menu.v1'

export function readMenu(): { meals: Meal[]; canSave: boolean } {
  let raw: unknown
  try {
    raw = Taro.getStorageSync(KEY)
  } catch {
    // A failed read can hide an existing menu. Keep edits in memory for this session.
    return { meals: SAMPLE_MEALS.map((meal) => ({ ...meal })), canSave: false }
  }
  try {
    const data: unknown = typeof raw === 'string' && raw ? JSON.parse(raw) : raw
    const parsed = parseMenu(data)
    if (parsed) return { meals: migrateUntouchedDemoMenu(parsed), canSave: true }
  } catch {
    // Corrupt data falls back to the recommendations.
  }
  return { meals: SAMPLE_MEALS.map((meal) => ({ ...meal })), canSave: true }
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
