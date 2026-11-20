import { describe, expect, it } from 'vitest'
import { activeMeals, chooseMeal, isDuplicate, parseMenu, type Meal } from './menu'
import { LEGACY_SAMPLE_MEALS, SAMPLE_MEALS, migrateUntouchedDemoMenu } from './sample'

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
  it('allows the same restaurant/dish in two different areas', () => {
    const same = [
      { id: 'a', shop: '孙大鹏', dish: '土豆片夹馍', area: '旺座', enabled: true },
      { id: 'b', shop: '孙大鹏', dish: '土豆片夹馍', area: '大都荟', enabled: true },
    ]
    expect(isDuplicate(same, ' 孙大鹏 ', '土豆片夹馍', undefined, '大都荟')).toBe(true)
    expect(isDuplicate(same, '孙大鹏', '土豆片夹馍', undefined, '其他地区')).toBe(false)
    expect(isDuplicate(same, '孙大鹏', '土豆片夹馍', 'a', '旺座')).toBe(false)
  })
  it('checks duplicate pairs after trimming', () => {
    expect(isDuplicate(meals, ' 店一 ', '饭')).toBe(true)
    expect(isDuplicate(meals, '店二', '饭')).toBe(false)
  })
  it('parses versioned storage and preserves optional area and note', () => {
    expect(parseMenu({ version: 1, items: [] })).toEqual([])
    expect(parseMenu({ version: 2, items: meals })).toBeNull()
    expect(parseMenu({ version: 1, items: SAMPLE_MEALS })?.[4].note).toContain('18 元')
  })
  it('drops invalid and repeated IDs', () => {
    const result = parseMenu({ version: 1, items: [meals[0], { ...meals[0], dish: '重复' }, { ...meals[1], enabled: 'yes' }, meals[2]] })
    expect(result?.map((item) => item.id)).toEqual(['a', 'c'])
  })
  it('seeds ten owner-provided choices across four areas', () => {
    expect(SAMPLE_MEALS).toHaveLength(10)
    expect(new Set(SAMPLE_MEALS.map((m) => m.area)).size).toBe(4)
    expect(SAMPLE_MEALS.every((m) => m.shop && m.dish && m.enabled)).toBe(true)
  })
  it('upgrades only an untouched legacy demo menu', () => {
    expect(migrateUntouchedDemoMenu(LEGACY_SAMPLE_MEALS)).toEqual(SAMPLE_MEALS)
    const edited = LEGACY_SAMPLE_MEALS.map(m => ({ ...m }))
    edited[0].enabled = false
    expect(migrateUntouchedDemoMenu(edited)).toEqual(edited)
    expect(migrateUntouchedDemoMenu([])).toEqual([])
    const custom = [SAMPLE_MEALS[0], { ...SAMPLE_MEALS[1], dish: '自定义菜品' }]
    expect(migrateUntouchedDemoMenu(custom)).toEqual(custom)
  })
})
