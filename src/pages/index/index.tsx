import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import { MAX_ITEMS, MAX_TEXT_LENGTH, activeMeals, chooseMeal, isDuplicate, type Meal } from '../../domain/menu'
import { SAMPLE_MEALS } from '../../domain/sample'
import { readMenu, writeMenu } from '../../services/menu-storage'
import './index.css'

const SEGMENT_COLORS = ['#fbdcc5', '#fde9d5', '#e6ede1', '#dce8e8', '#e5e3f3', '#f4dce0']
const SPIN_MS = 4200

function createId(): string {
  return 'meal-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
}

export default function Index() {
  const [meals, setMeals] = useState<Meal[]>(readMenu)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<Meal | null>(null)
  const [shop, setShop] = useState('')
  const [dish, setDish] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(true)
  const [fastSpin, setFastSpin] = useState(false)
  const [saved, setSaved] = useState(true)
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enabled = useMemo(() => activeMeals(meals), [meals])
  const shopCount = useMemo(() => new Set(meals.map((item) => item.shop)).size, [meals])
  const segment = enabled.length ? 360 / enabled.length : 360
  const wheelGradient = useMemo(() => {
    if (enabled.length === 0) return 'none'
    const stops = enabled.map((_, index) =>
      SEGMENT_COLORS[index % SEGMENT_COLORS.length] + ' ' +
      (index * segment).toFixed(3) + 'deg ' +
      ((index + 1) * segment).toFixed(3) + 'deg'
    )
    return 'conic-gradient(from 0deg, ' + stops.join(', ') + ')'
  }, [enabled, segment])

  useEffect(() => {
    setSaved(writeMenu(meals))
  }, [meals])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function spin() {
    if (spinning || enabled.length === 0) return
    const picked = chooseMeal(enabled)
    if (!picked) return
    const index = enabled.findIndex((item) => item.id === picked.id)
    const phase = ((rotation % 360) + 360) % 360
    const desired = ((360 - (index + 0.5) * segment) % 360 + 360) % 360
    const offset = (desired - phase + 360) % 360
    setResult(null)
    setSpinning(true)
    setRotation(rotation + (fastSpin ? 0 : 360 * 6) + offset)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setResult(picked)
      setSpinning(false)
      timerRef.current = null
    }, fastSpin ? 30 : SPIN_MS)
  }

  function addMeal() {
    if (spinning) return
    const normalizedShop = shop.trim()
    const normalizedDish = dish.trim()
    if (!normalizedShop || !normalizedDish) {
      setMessage('请填写店铺名称和菜品名称。')
      return
    }
    if (normalizedShop.length > MAX_TEXT_LENGTH || normalizedDish.length > MAX_TEXT_LENGTH) {
      setMessage('店铺和菜品名称不能超过 ' + MAX_TEXT_LENGTH + ' 个字符。')
      return
    }
    if (!editingId && meals.length >= MAX_ITEMS) {
      setMessage('最多支持 ' + MAX_ITEMS + ' 个菜品组合。')
      return
    }
    if (isDuplicate(meals, normalizedShop, normalizedDish, editingId || undefined)) {
      setMessage('这个店铺和菜品组合已经存在了。')
      return
    }
    if (editingId) {
      setMeals((previous) => previous.map((item) => item.id === editingId ? { ...item, shop: normalizedShop, dish: normalizedDish } : item))
      if (result?.id === editingId) setResult(null)
    } else {
      setMeals((previous) => [...previous, { id: createId(), shop: normalizedShop, dish: normalizedDish, enabled: true }])
    }
    setEditingId(null)
    setShop('')
    setDish('')
    setMessage(editingId ? '已更新菜品。' : '已添加，立即参与抽取。')
  }

  function beginEdit(item: Meal) {
    if (spinning) return
    setEditingId(item.id)
    setShop(item.shop)
    setDish(item.dish)
    setMessage('正在编辑：' + item.dish)
  }

  function cancelEdit() {
    setEditingId(null)
    setShop('')
    setDish('')
    setMessage('')
  }

  function toggleMeal(id: string) {
    if (spinning) return
    setMeals((previous) => previous.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  function removeMeal(id: string) {
    if (spinning) return
    setMeals((previous) => previous.filter((item) => item.id !== id))
    if (result?.id === id) setResult(null)
    if (editingId === id) cancelEdit()
  }

  function resetSamples() {
    if (spinning) return
    Taro.showModal({
      title: '恢复演示菜单？',
      content: '你的本地菜单会被测试数据替换，此操作无法撤销。',
      confirmText: '确认恢复',
      success: ({ confirm }) => {
        if (!confirm) return
        setMeals(SAMPLE_MEALS.map((item) => ({ ...item })))
        setResult(null)
        setEditingId(null)
        setShop('')
        setDish('')
        setMessage('已恢复演示菜单。')
      },
    })
  }

  const hasResults = enabled.length > 0
  return (
    <View className='app-shell'>
      <View className='topbar'>
        <View className='brand'>
          <View className='brand-icon'><Text>✳</Text></View>
          <Text className='brand-name'>今天吃什么</Text>
          <Text className='brand-en'>TODAY EAT WHAT</Text>
        </View>
        <View className='topbar-status'>
          <View className='status-dot' />
          <Text>纯本地 · 不用登录</Text>
        </View>
      </View>

      <View className='page-container'>
        <View className='hero'>
          <View className='hero-copy'>
            <View className='eyebrow'><View className='eyebrow-dot' /> DAILY DECISION MAKER</View>
            <Text className='hero-title'>今天中午，<Text className='hero-accent'>吃点什么？</Text></Text>
            <Text className='hero-description'>不必再把时间花在纠结上。让一点随机，带来一点惊喜。</Text>
          </View>
          <View className='hero-stats'>
            <View className='stat'>
              <Text className='stat-number'>{shopCount < 10 ? '0' + shopCount : shopCount}</Text>
              <Text className='stat-caption'>家备选店铺</Text>
            </View>
            <View className='stat-divider' />
            <View className='stat'>
              <Text className='stat-number'>{enabled.length < 10 ? '0' + enabled.length : enabled.length}</Text>
              <Text className='stat-caption'>道候选菜品</Text>
            </View>
          </View>
        </View>

        <View className='dashboard'>
          <View className='wheel-card'>
            <View className='section-heading'>
              <View>
                <Text className='section-kicker'>THE LUCKY WHEEL</Text>
                <Text className='section-title'>交给命运决定</Text>
              </View>
              <View className='small-chip'><Text>公平随机</Text></View>
            </View>

            <View className='wheel-wrap'>
              <View className='wheel-glow' />
              <View className='wheel-pointer'><View className='pointer-triangle' /></View>
              <View className='wheel-rim'>
                <View
                  className={'wheel-disc' + (!hasResults ? ' wheel-empty' : '')}
                  style={{
                    backgroundImage: wheelGradient,
                    transform: 'rotate(' + rotation + 'deg)',
                    transitionDuration: fastSpin ? '0ms' : SPIN_MS + 'ms',
                  }}
                >
                  {enabled.length <= 16 && enabled.map((item, index) => {
                    const radians = (-90 + (index + 0.5) * segment) * Math.PI / 180
                    return (
                      <View
                        key={item.id}
                        className='wheel-label'
                        style={{
                          left: (50 + 34 * Math.cos(radians)) + '%',
                          top: (50 + 34 * Math.sin(radians)) + '%',
                        }}
                      >
                        <Text>{item.dish}</Text>
                      </View>
                    )
                  })}
                  {enabled.length > 16 && <View className='wheel-busy-label'><Text>{enabled.length} 道美味</Text></View>}
                </View>
                <View className='wheel-hub'><Text>✳</Text></View>
              </View>
            </View>

            <View className='result-area'>
              <Text className='result-label'>{spinning ? '正在为你挑选' : result ? '今天就吃这个' : '准备好了吗？'}</Text>
              <Text className='result-title'>{spinning ? '惊喜正在路上…' : result ? result.dish : hasResults ? '让转盘替你做决定' : '还没有参与抽取的菜品'}</Text>
              <Text className='result-subtitle'>{result && !spinning ? result.shop : hasResults ? '按下按钮，随机选出一份午餐' : '在右侧添加或启用菜品后再试试'}</Text>
              <Button className='primary-button' onClick={spin} disabled={!hasResults || spinning}>
                <Text className='button-sparkle'>✦</Text>
                <Text>{spinning ? '正在旋转…' : result ? '再转一次' : '开始随机选择'}</Text>
                <Text className='button-arrow'>↗</Text>
              </Button>
              <Button className='mode-toggle' onClick={() => { if (!spinning) setFastSpin((v) => !v) }} disabled={spinning}>
                <View className={'mode-check' + (fastSpin ? ' is-on' : '')}><Text>{fastSpin ? '✓' : ''}</Text></View>
                <Text>跳过旋转动画</Text>
              </Button>
            </View>
          </View>

          <View className='sidebar'>
            <View className='list-card'>
              <View className='section-heading list-heading'>
                <View>
                  <Text className='section-kicker'>YOUR FOOD LIST</Text>
                  <Text className='section-title'>我的候选清单</Text>
                </View>
                <Button className='text-button' onClick={() => setEditorOpen((open) => !open)}>
                  {editorOpen ? '收起' : '展开'}
                </Button>
              </View>
              <Text className='list-description'>先用演示数据试试，再把常吃的店和菜加进来。</Text>
              {editorOpen && (
                <View className='list-body'>
                  <View className='add-form'>
                    <Input className='meal-input' value={shop} maxlength={MAX_TEXT_LENGTH} placeholder='店铺名称，例如：楼下食堂' onInput={(event) => setShop(event.detail.value)} />
                    <Input className='meal-input' value={dish} maxlength={MAX_TEXT_LENGTH} placeholder='菜品名称，例如：鸡腿饭' onInput={(event) => setDish(event.detail.value)} onConfirm={addMeal} />
                    <Button className='add-button' onClick={addMeal} disabled={spinning || (!editingId && meals.length >= MAX_ITEMS)}><Text>＋</Text> {editingId ? '保存修改' : '添加到清单'}</Button>
                    {editingId && <Button className='cancel-button' onClick={cancelEdit}>取消编辑</Button>}
                    {!!message && <Text className='form-message'>{message}</Text>}
                  </View>

                  <View className='list-meta'>
                    <Text>全部菜品 · {meals.length}</Text>
                    <Button className='reset-button' onClick={resetSamples} disabled={spinning}>恢复演示数据 ↺</Button>
                  </View>
                  <View className='meal-list'>
                    {meals.map((item, index) => (
                      <View className={'meal-row' + (!item.enabled ? ' is-disabled' : '')} key={item.id}>
                        <View className='meal-index'><Text>{String(index + 1).padStart(2, '0')}</Text></View>
                        <View className='meal-details' onClick={() => beginEdit(item)}>
                          <Text className='meal-dish'>{item.dish}</Text>
                          <Text className='meal-shop'>{item.shop} · 点击编辑</Text>
                        </View>
                        <Button
                          className={'toggle-button' + (item.enabled ? ' is-active' : '')}
                          onClick={() => toggleMeal(item.id)}
                          disabled={spinning}
                        >
                          {item.enabled ? '参与' : '暂停'}
                        </Button>
                        <Button className='remove-button' onClick={() => removeMeal(item.id)} disabled={spinning}>×</Button>
                      </View>
                    ))}
                    {meals.length === 0 && <View className='empty-list'><Text>还没有菜品。添加第一道吧。</Text></View>}
                  </View>
                </View>
              )}
            </View>

            <View className='note-card'>
              <View className='note-symbol'><Text>◎</Text></View>
              <View className='note-content'>
                <Text className='note-title'>简单一点，快乐一点。</Text>
                <Text className='note-description'>每道启用的菜品机会相同。数据只保存在这台设备中，不会上传。</Text>
                <Text className='save-status'>{saved ? '✓ 已保存到本地' : '! 保存失败，请检查存储权限'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View className='page-footer'>
          <Text>做决定可以很简单。</Text>
          <Text>Today Eat What · Built for the indecisive.</Text>
        </View>
      </View>
    </View>
  )
}
