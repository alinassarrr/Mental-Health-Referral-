'use client'
import { useState, useMemo } from 'react'
import type { Resource } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import SearchBar from './SearchBar'
import FilterPanel, { type Filters } from './FilterPanel'
import ResourceCard from './ResourceCard'

const EMPTY: Filters = { country: '', type: '', pricing: '', session: '' }

export default function ResourceGrid({ resources }: { resources: Resource[] }) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Filters>(EMPTY)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return resources.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q)) return false
      if (filters.country && r.country !== filters.country) return false
      if (filters.type && r.type !== filters.type) return false
      if (filters.pricing && r.pricing !== filters.pricing) return false
      if (filters.session && r.session_type !== filters.session) return false
      return true
    })
  }, [resources, search, filters])

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel filters={filters} onChange={setFilters} />
      </div>
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">{t('filter.noResults')}</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}
    </div>
  )
}
