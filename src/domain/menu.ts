export interface Meal {
  id: string
  shop: string
  dish: string
  enabled: boolean
}

export interface MenuEnvelope {
  version: 1
  items: Meal[]
}

export const MAX_ITEMS = 200
export const MAX_TEXT_LENGTH = 40

export function activeMeals(items: readonly Meal[]): Meal[] {
  return items.filter((item) => item.enabled)
}

/** Uniformly choose one enabled shop+dish pair, not one shop first. */
export function chooseMeal(items: readonly Meal[], random: () => number = Math.random): Meal | null {
  const eligible = activeMeals(items)
  if (eligible.length === 0) return null
  const value = random()
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(value, 1 - Number.EPSILON)) : 0
  return eligible[Math.floor(safe * eligible.length)]
}

export function isDuplicate(items: readonly Meal[], shop: string, dish: string, excludeId?: string): boolean {
  return items.some((item) => item.id !== excludeId && item.shop.toLocaleLowerCase() === shop.trim().toLocaleLowerCase()
    && item.dish.toLocaleLowerCase() === dish.trim().toLocaleLowerCase())
}

/** Returns null when data is not a supported envelope. An intentional [] is valid. */
export function parseMenu(value: unknown): Meal[] | null {
  if (!value || typeof value !== 'object') return null
  const envelope = value as Partial<MenuEnvelope>
  if (envelope.version !== 1 || !Array.isArray(envelope.items)) return null
  const seen = new Set<string>()
  const valid: Meal[] = []
  for (const item of envelope.items.slice(0, MAX_ITEMS)) {
    if (!item || typeof item !== 'object') continue
    const maybe = item as Partial<Meal>
    if (typeof maybe.id !== 'string' || !maybe.id || seen.has(maybe.id)) continue
    if (typeof maybe.shop !== 'string' || typeof maybe.dish !== 'string') continue
    const shop = maybe.shop.trim()
    const dish = maybe.dish.trim()
    if (!shop || !dish || shop.length > MAX_TEXT_LENGTH || dish.length > MAX_TEXT_LENGTH) continue
    if (typeof maybe.enabled !== 'boolean') continue
    seen.add(maybe.id)
    valid.push({ id: maybe.id, shop, dish, enabled: maybe.enabled })
  }
  return valid
}
