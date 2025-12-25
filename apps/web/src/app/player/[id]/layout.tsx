'use client'

import { ReactNode } from 'react'

interface PlayerLayoutProps {
  children: ReactNode
  params: {
    id: string
  }
}

export default function PlayerLayout({ children }: PlayerLayoutProps) {
  return <>{children}</>
}
