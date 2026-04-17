import type { Metadata } from 'next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n'
import TopBar from '@/components/TopBar'
import BottomNav from '@/components/BottomNav'
import HotlineBar from '@/components/HotlineBar'
import CrisisButton from '@/components/CrisisButton'
import Footer from '@/components/Footer'
import { getHotlines } from '@/lib/sheets'

export const metadata: Metadata = {
  title: 'Mental Health MENA',
  description: 'Find verified mental health NGOs, helplines, and clinics across 17 MENA countries.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const hotlines = await getHotlines()
  return (
    <html lang="en" dir="ltr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-warm-50 text-gray-900 min-h-screen">
        <I18nProvider>
          <HotlineBar hotlines={hotlines} />
          <TopBar />
          <main className="pb-safe">{children}</main>
          <Footer />
          <CrisisButton />
          <BottomNav />
        </I18nProvider>
      </body>
    </html>
  )
}
