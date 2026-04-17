import Link from 'next/link'
import { getResources, getHotlines } from '@/lib/sheets'
import { MENA_COUNTRIES, countryToSlug } from '@/lib/countries'
export const revalidate = 3600

export default async function HomePage() {
  const [resources, hotlines] = await Promise.all([getResources(), getHotlines()])
  const counts = MENA_COUNTRIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = resources.filter(r => r.country === c).length
    return acc
  }, {})

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-b from-green-50 to-warm-50 px-4 pt-8 pb-10">
        <div className="max-w-lg mx-auto text-center">
          <span className="inline-block bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full mb-4">
            17 countries · Free to use
          </span>
          <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">
            Find mental health<br />support near you
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Verified NGOs, helplines, and clinics across the MENA region
          </p>
          <Link
            href="/resources"
            className="w-full flex items-center justify-center gap-2 bg-green-600 text-white font-semibold py-4 rounded-2xl text-sm hover:bg-green-700 transition-colors shadow-lg shadow-green-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round"/>
            </svg>
            Search all resources
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 -mt-4">
        <div className="max-w-lg mx-auto grid grid-cols-3 gap-3">
          {[
            { label: 'Resources', value: resources.length },
            { label: 'Countries', value: 17 },
            { label: 'Hotlines', value: hotlines.length },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-sm border border-green-50">
              <div className="text-2xl font-extrabold text-green-600">{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Countries */}
      <section className="px-4 mt-8 pb-8 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Browse by country</h2>
          <Link href="/countries" className="text-xs text-green-600 font-medium">See all</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {MENA_COUNTRIES.map(country => (
            <Link
              key={country}
              href={`/countries/${countryToSlug(country)}`}
              className="bg-white rounded-2xl p-4 border border-green-50 hover:border-green-200 hover:shadow-md transition-all active:scale-95"
            >
              <div className="font-semibold text-gray-900 text-sm">{country}</div>
              <div className="text-xs text-green-600 mt-1 font-medium">
                {counts[country] ?? 0} resources
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
