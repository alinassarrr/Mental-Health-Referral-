'use client'
import { useI18n } from '@/lib/i18n'

export default function CrisisDisclaimer() {
  const { t } = useI18n()
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800" role="alert">
      {t('disclaimer.text')}
    </div>
  )
}
