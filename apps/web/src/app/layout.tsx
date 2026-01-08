import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext'

export const metadata: Metadata = {
 title: 'Professional Club League - PCL',
 description: 'A comprehensive platform for organizing professional sports leagues and tournaments',
 icons: {
 icon: '/favicon.ico',
 apple: '/logo.png',
 },
};

export const viewport: Viewport = {
 width: 'device-width',
 initialScale: 1,
 maximumScale: 5,
 userScalable: true,
};

export default function RootLayout({
 children,
}: {
 children: React.ReactNode;
}) {
 return (
 <html lang="en" className="light">
 <head>
 <meta name="theme-color" content="#0d1b3e" />
 </head>
 <body className="w-full h-full min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100"
 style={{ colorScheme: 'light' }}
 >
 <ToastProvider>
 {children}
 </ToastProvider>
 </body>
 </html>
 );
}
