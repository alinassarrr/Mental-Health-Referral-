'use client'
import { useI18n } from '@/lib/i18n'
import { MENA_COUNTRIES } from '@/lib/countries'

export interface Filters { country: string; type: string; pricing: string; session: string }

const TYPES = ['NGO', 'Helpline', 'PHCC', 'Clinic', 'Hospital']
const PRICING = ['Free', 'Sliding', 'Paid', 'Unknown']
const SESSIONS = ['Individual', 'Group', 'Both']

export default function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const { t } = useI18n()
  const set = (key: keyof Filters) => (e: React.ChangeEvent<HTMLSelectElement>) =>
    onChange({ ...filters, [key]: e.target.value })
  return (
    <div className="flex flex-wrap gap-3">
      <select value={filters.country} onChange={set('country')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label={t('filter.country')}>
        <option value="">{t('filter.country')}: {t('filter.all')}</option>
        {MENA_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={filters.type} onChange={set('type')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label={t('filter.type')}>
        <option value="">{t('filter.type')}: {t('filter.all')}</option>
        {TYPES.map((tp) => <option key={tp} value={tp}>{tp}</option>)}
      </select>
      <select value={filters.pricing} onChange={set('pricing')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label={t('filter.pricing')}>
        <option value="">{t('filter.pricing')}: {t('filter.all')}</option>
        {PRICING.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select value={filters.session} onChange={set('session')} className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" aria-label={t('filter.session')}>
        <option value="">{t('filter.session')}: {t('filter.all')}</option>
        {SESSIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    </div>
  )
}
