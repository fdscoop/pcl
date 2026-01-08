'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast, ToastContainer } from '@/components/ui/toast'

interface ToastContextType {
 addToast: (toast: Omit<Toast, 'id'>) => void
 removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
 const [toasts, setToasts] = useState<Toast[]>([])

 const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
 const id = Math.random().toString(36).substr(2, 9)
 const newToast: Toast = {
 ...toast,
 id,
 duration: toast.duration ?? 4000
 }
 setToasts(prev => [...prev, newToast])
 }, [])

 const removeToast = useCallback((id: string) => {
 setToasts(prev => prev.filter(toast => toast.id !== id))
 }, [])

 return (
 <ToastContext.Provider value={{ addToast, removeToast }}>
 {children}
 <ToastContainer
 toasts={toasts}
 onDismiss={removeToast}
 />
 </ToastContext.Provider>
 )
}

export function useToast() {
 const context = useContext(ToastContext)
 if (!context) {
 throw new Error('useToast must be used within ToastProvider')
 }
 return context
}
