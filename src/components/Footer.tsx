'use client'
import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()
  return (
    <footer className="mt-16 border-t border-gray-200 py-8 px-4 text-center text-xs text-gray-400">
      <p>{t('footer.source')}</p>
    </footer>
  )
}
