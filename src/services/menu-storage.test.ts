import { beforeEach, expect, it, vi } from 'vitest'
import Taro from '@tarojs/taro'
import { SAMPLE_MEALS } from '../domain/sample'
import { readMenu, writeMenu } from './menu-storage'

vi.mock('@tarojs/taro', () => ({
  default: { getStorageSync: vi.fn(), setStorageSync: vi.fn() },
}))

beforeEach(() => vi.resetAllMocks())

it('loads the recommendations on first launch and preserves an intentionally empty list', () => {
  expect(readMenu()).toEqual({ meals: SAMPLE_MEALS, canSave: true })
  expect(writeMenu([])).toBe(true)
  const [key, payload] = vi.mocked(Taro.setStorageSync).mock.calls[0]
  vi.mocked(Taro.getStorageSync).mockReturnValue(payload)
  expect(readMenu()).toEqual({ meals: [], canSave: true })
  expect(Taro.getStorageSync).toHaveBeenLastCalledWith(key)
})

it('reports storage errors and prevents writes after a failed read', () => {
  vi.mocked(Taro.getStorageSync).mockImplementation(() => { throw new Error('storage unavailable') })
  expect(readMenu()).toEqual({ meals: SAMPLE_MEALS, canSave: false })
  vi.mocked(Taro.setStorageSync).mockImplementation(() => { throw new Error('storage unavailable') })
  expect(writeMenu([])).toBe(false)
})
