import type { Metadata } from 'next';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 to-slate-100">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
