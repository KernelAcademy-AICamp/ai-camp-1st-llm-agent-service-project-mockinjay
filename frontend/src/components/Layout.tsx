import { ReactNode } from 'react'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen pb-16">
      {children}
      <BottomNav />
    </div>
  )
}
