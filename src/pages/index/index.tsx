import { useEffect, useMemo, useRef, useState } from 'react'
import Taro from '@tarojs/taro'
import { Button, Input, Text, View } from '@tarojs/components'
import { MAX_ITEMS, MAX_TEXT_LENGTH, MAX_NOTE_LENGTH, activeMeals, chooseMeal, isDuplicate, type Meal } from '../../domain/menu'
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
  const [winnerOpen, setWinnerOpen] = useState(false)
  const [shop, setShop] = useState('')
  const [dish, setDish] = useState('')
  const [area, setArea] = useState('')
  const [note, setNote] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(true)
  const [fastSpin, setFastSpin] = useState(false)
  const [saved, setSaved] = useState(true)
  const [message, setMessage] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enabled = useMemo(() => activeMeals(meals), [meals])
  const shopCount = useMemo(() => new Set(meals.map((item) => (item.area ?? '') + '/' + item.shop)).size, [meals])
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
    setWinnerOpen(false)
    setResult(null)
    setSpinning(true)
    setRotation(rotation + (fastSpin ? 0 : 360 * 6) + offset)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setResult(picked)
      setSpinning(false)
      setWinnerOpen(true)
      timerRef.current = null
    }, fastSpin ? 30 : SPIN_MS)
  }

  function addMeal() {
    if (spinning) return
    const normalizedShop = shop.trim()
    const normalizedDish = dish.trim()
    const normalizedArea = area.trim()
    const normalizedNote = note.trim()
    if (!normalizedShop || !normalizedDish) {
      setMessage('请填写店铺名称和菜品名称。')
      return
    }
    if (normalizedShop.length > MAX_TEXT_LENGTH || normalizedDish.length > MAX_TEXT_LENGTH || normalizedArea.length > MAX_TEXT_LENGTH) {
      setMessage('店铺和菜品名称不能超过 ' + MAX_TEXT_LENGTH + ' 个字符。')
      return
    }
    if (normalizedNote.length > MAX_NOTE_LENGTH) {
      setMessage('推荐备注不能超过 ' + MAX_NOTE_LENGTH + ' 个字符。')
      return
    }
    if (!editingId && meals.length >= MAX_ITEMS) {
      setMessage('最多支持 ' + MAX_ITEMS + ' 个菜品组合。')
      return
    }
    if (isDuplicate(meals, normalizedShop, normalizedDish, editingId || undefined, normalizedArea)) {
      setMessage('这个店铺和菜品组合已经存在了。')
      return
    }
    if (editingId) {
      setMeals((previous) => previous.map((item) => item.id === editingId ? { ...item, shop: normalizedShop, dish: normalizedDish, area: normalizedArea, note: normalizedNote } : item))
      if (result?.id === editingId) setResult(null)
    } else {
      setMeals((previous) => [...previous, { id: createId(), shop: normalizedShop, dish: normalizedDish, area: normalizedArea, note: normalizedNote, enabled: true }])
    }
    setEditingId(null)
    setShop('')
    setDish('')
    setArea('')
    setNote('')
    setMessage(editingId ? '已更新菜品。' : '已添加，立即参与抽取。')
  }

  function beginEdit(item: Meal) {
    if (spinning) return
    setEditingId(item.id)
    setShop(item.shop)
    setDish(item.dish)
    setArea(item.area ?? '')
    setNote(item.note ?? '')
    setMessage('正在编辑：' + item.dish)
  }

  function cancelEdit() {
    setEditingId(null)
    setShop('')
    setDish('')
    setArea('')
    setNote('')
    setMessage('')
  }

  function toggleMeal(id: string) {
    if (spinning) return
    setMeals((previous) => previous.map((item) => item.id === id ? { ...item, enabled: !item.enabled } : item))
  }

  function removeMeal(id: string) {
    if (spinning) return
    setMeals((previous) => previous.filter((item) => item.id !== id))
    if (result?.id === id) {
      setResult(null)
      setWinnerOpen(false)
    }
    if (editingId === id) cancelEdit()
  }

  function resetSamples() {
    if (spinning) return
    Taro.showModal({
      title: '恢复推荐清单？',
      content: '你的本地菜单将被预设的 10 条餐厅推荐替换，此操作无法撤销。',
      confirmText: '确认恢复',
      success: ({ confirm }) => {
        if (!confirm) return
        setMeals(SAMPLE_MEALS.map((item) => ({ ...item })))
        setResult(null)
        setWinnerOpen(false)
        setEditingId(null)
        setShop('')
        setDish('')
        setArea('')
        setNote('')
        setMessage('已恢复 10 条推荐清单。')
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
              <Text className='result-subtitle'>{result && !spinning ? (result.area ? result.area + ' · ' : '') + result.shop : hasResults ? '按下按钮，随机选出一份午餐' : '在右侧添加或启用菜品后再试试'}</Text>
              <Button className={'primary-button' + (!hasResults || spinning ? ' is-disabled' : '')} onClick={spin} disabled={!hasResults || spinning ? true : undefined}>
                <Text className='button-sparkle'>✦</Text>
                <Text>{spinning ? '正在旋转…' : result ? '再转一次' : '开始随机选择'}</Text>
                <Text className='button-arrow'>↗</Text>
              </Button>
              <Button className={'mode-toggle' + (spinning ? ' is-disabled' : '')} onClick={() => { if (!spinning) setFastSpin((v) => !v) }} disabled={spinning ? true : undefined}>
                <View className={'mode-check' + (fastSpin ? ' is-on' : '')}><Text>{fastSpin ? '✓' : ''}</Text></View>
                <Text className='mode-label'>跳过旋转动画</Text>
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
              <Text className='list-description'>这是常吃的口袋清单，也可以添加你喜欢的店和菜。</Text>
              {editorOpen && (
                <View className='list-body'>
                  <View className='add-form'>
                    <Input className='meal-input' value={shop} maxlength={MAX_TEXT_LENGTH} placeholder='店铺名称，例如：楼下食堂' onInput={(event) => setShop(event.detail.value)} />
                    <Input className='meal-input' value={dish} maxlength={MAX_TEXT_LENGTH} placeholder='菜品名称，例如：鸡腿饭' onInput={(event) => setDish(event.detail.value)} onConfirm={addMeal} />
                    <Input className='meal-input' value={area} maxlength={MAX_TEXT_LENGTH} placeholder='所在区域（选填）' onInput={(event) => setArea(event.detail.value)} />
                    <Input className='meal-input meal-note-input' value={note} maxlength={MAX_NOTE_LENGTH} placeholder='推荐理由 / 价格 / 位置备注（选填）' onInput={(event) => setNote(event.detail.value)} />
                    <Button className={'add-button' + (spinning || (!editingId && meals.length >= MAX_ITEMS) ? ' is-disabled' : '')} onClick={addMeal} disabled={spinning || (!editingId && meals.length >= MAX_ITEMS) ? true : undefined}><Text>＋</Text> {editingId ? '保存修改' : '添加到清单'}</Button>
                    {editingId && <Button className='cancel-button' onClick={cancelEdit}>取消编辑</Button>}
                    {!!message && <Text className='form-message'>{message}</Text>}
                  </View>

                  <View className='list-meta'>
                    <Text>全部菜品 · {meals.length}</Text>
                    <Button className='reset-button' onClick={resetSamples} disabled={spinning ? true : undefined}><Text className='reset-label'>恢复推荐清单 ↺</Text></Button>
                  </View>
                  <View className='meal-list'>
                    {meals.map((item, index) => (
                      <View className={'meal-row' + (!item.enabled ? ' is-disabled' : '')} key={item.id}>
                        <View className='meal-index'><Text>{String(index + 1).padStart(2, '0')}</Text></View>
                        <View className='meal-details' onClick={() => beginEdit(item)}>
                          <Text className='meal-dish'>{item.dish}</Text>
                          <Text className='meal-shop'>{item.area ? item.area + ' · ' : ''}{item.shop} · 点击编辑</Text>
                        </View>
                        <Button
                          className={'toggle-button' + (item.enabled ? ' is-active' : '')}
                          onClick={() => toggleMeal(item.id)}
                          disabled={spinning ? true : undefined}
                        >
                          {item.enabled ? '参与' : '暂停'}
                        </Button>
                        <Button className='remove-button' onClick={() => removeMeal(item.id)} disabled={spinning ? true : undefined}><Text className='remove-glyph'>×</Text></Button>
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
      {winnerOpen && result && (
        <View className='winner-overlay' onClick={() => setWinnerOpen(false)}>
          <View className='winner-dialog' role='dialog' aria-label='随机选餐结果' onClick={(event) => event.stopPropagation()}>
            <View className='winner-graphic'>
              <View className='winner-halo' />
              <Text className='winner-star winner-star-a'>✦</Text>
              <Text className='winner-star winner-star-b'>✧</Text>
              <Text className='winner-star winner-star-c'>✦</Text>
              <View className='winner-medal'><Text>✳</Text></View>
            </View>
            <Text className='winner-eyebrow'>YOUR LUCKY PICK</Text>
            <Text className='winner-heading'>今天就吃它！</Text>
            <View className='winner-info'>
              <Text className='winner-dish'>{result.dish}</Text>
              <Text className='winner-shop'>{result.area ? result.area + ' · ' : ''}{result.shop}</Text>
              {!!result.note && <Text className='winner-note'>{result.note}</Text>}
            </View>
            <View className='winner-actions'>
              <Button className='winner-confirm' onClick={() => setWinnerOpen(false)}>好，就吃这个</Button>
              <Button className='winner-again' onClick={() => { setWinnerOpen(false); spin() }}>再抽一次 ↻</Button>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}
