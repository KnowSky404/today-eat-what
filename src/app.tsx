import type { PropsWithChildren } from 'react'
import './app.css'

export default function App({ children }: PropsWithChildren) {
  console.log('[diagnostic] App rendered', Boolean(children))
  return children
}
