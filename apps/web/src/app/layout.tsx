import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ToastProvider } from '@/context/ToastContext'
import CapacitorInit from '@/components/CapacitorInit'

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
 <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
 <meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com; frame-src 'self' https://api.razorpay.com; style-src 'self' 'unsafe-inline'" />
 </head>
 <body className="w-full h-full min-h-screen overflow-x-hidden bg-gradient-to-br from-slate-50 to-slate-100"
 style={{ colorScheme: 'light' }}
 >
 <CapacitorInit>
 <ToastProvider>
 {children}
 </ToastProvider>
 </CapacitorInit>
 </body>
 </html>
 );
}
