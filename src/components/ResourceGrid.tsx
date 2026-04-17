'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import type { Resource } from '@/lib/types'
import { useI18n } from '@/lib/i18n'
import SearchBar from './SearchBar'
import FilterPanel, { type Filters } from './FilterPanel'
import ResourceCard from './ResourceCard'

export default function ResourceGrid({ resources }: { resources: Resource[] }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(() => searchParams.get('q') ?? '')
  const [filters, setFilters] = useState<Filters>(() => ({
    country: searchParams.get('country') ?? '',
    type: searchParams.get('type') ?? '',
  }))

  const syncUrl = useCallback((s: string, f: Filters) => {
    const params = new URLSearchParams()
    if (s) params.set('q', s)
    if (f.country) params.set('country', f.country)
    if (f.type) params.set('type', f.type)
    const qs = params.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }, [pathname, router])

  useEffect(() => { syncUrl(search, filters) }, [search, filters, syncUrl])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return resources.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false
      if (filters.country && r.country !== filters.country) return false
      if (filters.type && r.type !== filters.type) return false
      return true
    })
  }, [resources, search, filters])

  const hasFilters = search || filters.country || filters.type
  const clear = () => { setSearch(''); setFilters({ country: '', type: '' }) }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3">
        <SearchBar value={search} onChange={setSearch} />
        <FilterPanel filters={filters} onChange={setFilters} />
        {hasFilters && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{filtered.length}</span> results
            </p>
            <button
              onClick={clear}
              className="text-xs text-green-600 hover:text-green-700 font-medium underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-gray-500 text-sm">{t('filter.noResults')}</p>
          <button onClick={clear} className="mt-3 text-xs text-green-600 underline">Clear filters</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((r) => <ResourceCard key={r.id} resource={r} />)}
        </div>
      )}
    </div>
  )
}
