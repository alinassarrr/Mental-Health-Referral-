'use client'
import { useI18n } from '@/lib/i18n'

export default function LanguageToggle() {
  const { t, locale, setLocale } = useI18n()
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
      className="border border-green-200 text-green-700 rounded-lg px-3 py-1 text-xs font-semibold hover:bg-green-50 transition-colors"
      aria-label="Switch language"
    >
      {t('lang.switch')}
    </button>
  )
}
