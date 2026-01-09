'use client'

import { ReactNode } from 'react'

interface PlayerLayoutProps {
 children: ReactNode
 params: Promise<{
 id: string
 }>
}

export default function PlayerLayout({ children }: PlayerLayoutProps) {
 return <>{children}</>
}
