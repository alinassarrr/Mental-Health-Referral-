'use client'
import { useI18n } from '@/lib/i18n'

export default function StatsGrid({ resourceCount, countryCount, hotlineCount }: { resourceCount: number; countryCount: number; hotlineCount: number }) {
  const { t } = useI18n()
  return (
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: t('home.stats.resources'), value: resourceCount },
        { label: t('home.stats.countries'), value: countryCount },
        { label: t('home.stats.hotlines'), value: hotlineCount },
      ].map(({ label, value }) => (
        <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
          <div className="text-3xl font-bold text-teal-600">{value}</div>
          <div className="text-sm text-gray-500 mt-1">{label}</div>
        </div>
      ))}
    </div>
  )
}
