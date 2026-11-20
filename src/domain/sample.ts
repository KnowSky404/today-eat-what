import type { Meal } from './menu'

/**
 * Personal recommendations supplied by the repository owner.
 * Prices, location descriptions and wait times are personal notes, not verified live listings.
 * Keep each row as one roulette choice. Do not invent a dish if none was specified.
 */
export const SAMPLE_MEALS: Meal[] = [
  { id: 'favorite-01', area: '旺座', shop: '佩奇的食堂', dish: '川渝快餐', enabled: true },
  { id: 'favorite-02', area: '旺座', shop: '佩奇的食堂', dish: '杨凌蘸水面', enabled: true },
  { id: 'favorite-03', area: '旺座', shop: '孙大鹏土豆片夹馍', dish: '土豆片夹馍', note: '佩奇的食堂旁边', enabled: true },
  { id: 'favorite-04', area: '大都荟', shop: '孙大鹏土豆片夹馍', dish: '土豆片夹馍', note: '公司对面', enabled: true },
  { id: 'favorite-05', area: '大都荟', shop: '金一德牛肉面', dish: '牛肉面（二细）', note: '18 元套餐：面 + 小吃 + 鸡蛋；面型推荐二细', enabled: true },
  { id: 'favorite-06', area: '大寨路', shop: '夏家味道', dish: '三合一 / 四合一', note: '推荐三合一和四合一；四合一好像多了剁椒', enabled: true },
  { id: 'favorite-07', area: '大寨路', shop: '拉斐尔鱼庄', dish: '双人餐', note: '66.9 元双人餐很超值，分量大，一个人可能吃不完；推荐多人去', enabled: true },
  { id: 'favorite-08', area: '高新四路', shop: '兰州牛肉面', dish: '大盘鸡拌面', note: '高科广场 D 座对面；各种拌面类都很好吃', enabled: true },
  { id: 'favorite-09', area: '高新四路', shop: '刀削面', dish: '刀削面', note: '高科广场 D 座对面；老板娘人很好，店内座位较少，中午可能要等位', enabled: true },
  { id: 'favorite-10', area: '高新四路', shop: '小谷姐姐麻辣烫', dish: '骨汤麻辣烫', note: '高科广场 D 座南边；推荐骨汤，小菜和蘸料很丰富', enabled: true },
]

/** Only migrate the untouched original demo list. Custom edits must never be overwritten. */
export const LEGACY_SAMPLE_MEALS: Meal[] = [
  { id: 'demo-01', shop: '楼下川味馆', dish: '宫保鸡丁盖饭', enabled: true },
  { id: 'demo-02', shop: '楼下川味馆', dish: '鱼香肉丝盖饭', enabled: true },
  { id: 'demo-03', shop: '街角面馆', dish: '油泼面', enabled: true },
  { id: 'demo-04', shop: '街角面馆', dish: '番茄鸡蛋面', enabled: true },
  { id: 'demo-05', shop: '隔壁米线铺', dish: '三鲜米线', enabled: true },
  { id: 'demo-06', shop: '隔壁米线铺', dish: '酸辣米线', enabled: true },
  { id: 'demo-07', shop: '巷口小食堂', dish: '黑椒鸡腿饭', enabled: true },
  { id: 'demo-08', shop: '巷口小食堂', dish: '照烧鸡肉饭', enabled: true },
  { id: 'demo-09', shop: '社区饺子馆', dish: '韭菜鸡蛋水饺', enabled: true },
  { id: 'demo-10', shop: '社区饺子馆', dish: '白菜猪肉水饺', enabled: true },
  { id: 'demo-11', shop: '咖喱研究所', dish: '日式咖喱猪排饭', enabled: true },
  { id: 'demo-12', shop: '咖喱研究所', dish: '咖喱鸡肉饭', enabled: true },
]

export function migrateUntouchedDemoMenu(items: Meal[]): Meal[] {
  if (items.length !== LEGACY_SAMPLE_MEALS.length) return items
  const unchanged = items.every((item, index) => {
    const old = LEGACY_SAMPLE_MEALS[index]
    return Object.keys(item).length === 4 &&
      item.id === old.id &&
      item.shop === old.shop &&
      item.dish === old.dish &&
      item.enabled === old.enabled
  })
  return unchanged ? SAMPLE_MEALS.map((item) => ({ ...item })) : items
}
