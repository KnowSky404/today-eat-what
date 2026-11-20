export interface Meal {
  id: string
  shop: string
  dish: string
  enabled: boolean
  /** Store location / business district, e.g. 旺座 */
  area?: string
  /** Personal recommendation shown in the winner dialog */
  note?: string
}

export interface MenuEnvelope {
  version: 1
  items: Meal[]
}

export const MAX_ITEMS = 200
export const MAX_TEXT_LENGTH = 40
export const MAX_NOTE_LENGTH = 200

export function activeMeals(items: readonly Meal[]): Meal[] {
  return items.filter((item) => item.enabled)
}

/** Each enabled shop + dish + location entry has an equal chance. */
export function chooseMeal(items: readonly Meal[], random: () => number = Math.random): Meal | null {
  const eligible = activeMeals(items)
  if (eligible.length === 0) return null
  const value = random()
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(value, 1 - Number.EPSILON)) : 0
  return eligible[Math.floor(safe * eligible.length)]
}

/** ExcludeId precedes area to preserve the existing editing API. */
export function isDuplicate(items: readonly Meal[], shop: string, dish: string, excludeId?: string, area = ''): boolean {
  const normalize = (text: string) => text.trim().toLocaleLowerCase()
  return items.some((item) => item.id !== excludeId &&
    normalize(item.shop) === normalize(shop) &&
    normalize(item.dish) === normalize(dish) &&
    normalize(item.area ?? '') === normalize(area))
}

/** Returns null only for unsupported/corrupt payload; [] is valid user intent. */
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
    if (maybe.area !== undefined && (typeof maybe.area !== 'string' || maybe.area.length > MAX_TEXT_LENGTH)) continue
    if (maybe.note !== undefined && (typeof maybe.note !== 'string' || maybe.note.length > MAX_NOTE_LENGTH)) continue
    seen.add(maybe.id)
    const area = maybe.area?.trim()
    const note = maybe.note?.trim()
    valid.push({
      id: maybe.id,
      shop,
      dish,
      enabled: maybe.enabled,
      ...(area ? { area } : {}),
      ...(note ? { note } : {}),
    })
  }
  return valid
}
