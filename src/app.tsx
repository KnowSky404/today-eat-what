import type { PropsWithChildren } from 'react'
import { useLaunch } from '@tarojs/taro'
import { initWeappUpdates } from './services/weapp-version'
import './app.css'

export default function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    if (process.env.TARO_ENV === 'weapp') initWeappUpdates()
  })

  return children
}
