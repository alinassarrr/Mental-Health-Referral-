'use client'
import { useI18n } from '@/lib/i18n'

export default function LanguageToggle() {
  const { t, locale, setLocale } = useI18n()
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="border border-white/40 rounded px-2 py-1 text-xs hover:bg-teal-600 transition-colors"
      aria-label="Switch language"
    >
      {t('lang.switch')}
    </button>
  )
}
