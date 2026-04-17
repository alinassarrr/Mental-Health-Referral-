'use client'
import { useI18n } from '@/lib/i18n'

export default function CrisisDisclaimer() {
  const { t } = useI18n()
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed" role="alert">
      <span className="font-bold">⚠️ Important: </span>{t('disclaimer.text')}
    </div>
  )
}
