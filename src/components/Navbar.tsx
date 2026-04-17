'use client'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n'
import LanguageToggle from './LanguageToggle'

export default function Navbar() {
  const { t } = useI18n()
  return (
    <nav className="bg-teal-700 text-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg tracking-tight">
        MENA Mind
      </Link>
      <div className="flex items-center gap-6 text-sm">
        <Link href="/" className="hover:text-teal-100">{t('nav.home')}</Link>
        <Link href="/resources" className="hover:text-teal-100">{t('nav.resources')}</Link>
        <Link href="/about" className="hover:text-teal-100">{t('nav.about')}</Link>
        <LanguageToggle />
      </div>
    </nav>
  )
}
