import { describe, expect, it } from 'vitest'
import { activeMeals, chooseMeal, isDuplicate, parseMenu, type Meal } from './menu'

const meals: Meal[] = [
  { id: 'a', shop: '店一', dish: '饭', enabled: true },
  { id: 'b', shop: '店一', dish: '面', enabled: true },
  { id: 'c', shop: '店二', dish: '汤', enabled: true },
  { id: 'd', shop: '店二', dish: '饺子', enabled: false },
]

describe('menu domain', () => {
  it('samples eligible pairs uniformly across the flat list', () => {
    expect(chooseMeal(meals, () => 0)?.id).toBe('a')
    expect(chooseMeal(meals, () => 0.34)?.id).toBe('b')
    expect(chooseMeal(meals, () => 0.999)?.id).toBe('c')
    expect(chooseMeal(meals, () => 1)?.id).toBe('c')
  })
  it('ignores disabled meals and handles empty choices', () => {
    expect(activeMeals(meals).map((item) => item.id)).toEqual(['a', 'b', 'c'])
    expect(chooseMeal(meals.map((item) => ({ ...item, enabled: false })))).toBeNull()
  })
  it('checks duplicate pairs after trimming and case normalization', () => {
    expect(isDuplicate(meals, ' 店一 ', '饭')).toBe(true)
    expect(isDuplicate(meals, '店二', '饭')).toBe(false)
    expect(isDuplicate(meals, '店一', '饭', 'a')).toBe(false)
  })
  it('parses versioned storage and keeps an intentionally empty list', () => {
    expect(parseMenu({ version: 1, items: [] })).toEqual([])
    expect(parseMenu({ version: 2, items: meals })).toBeNull()
  })
  it('drops invalid and repeated records without corrupting other meals', () => {
    const result = parseMenu({
      version: 1,
      items: [meals[0], { ...meals[0], dish: '重复 id' }, { ...meals[1], enabled: 'yes' }, meals[2]],
    })
    expect(result?.map((item) => item.id)).toEqual(['a', 'c'])
  })
})
