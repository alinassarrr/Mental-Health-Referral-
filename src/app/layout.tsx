import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import Navbar from '@/components/Navbar'
import HotlineBar from '@/components/HotlineBar'
import { getHotlines } from '@/lib/sheets'

export const metadata: Metadata = {
  title: 'MENA Mental Health Resources',
  description: 'Find verified mental health NGOs, helplines, and clinics across 17 MENA countries.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hotlines = await getHotlines()
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <I18nProvider>
          <HotlineBar hotlines={hotlines} />
          <Navbar />
          <main>{children}</main>
        </I18nProvider>
      </body>
    </html>
  )
}
