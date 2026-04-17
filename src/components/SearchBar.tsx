'use client'
import { useI18n } from '@/lib/i18n'

export default function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { t } = useI18n()
  return (
    <input
      role="searchbox"
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('search.placeholder')}
      className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
    />
  )
}
