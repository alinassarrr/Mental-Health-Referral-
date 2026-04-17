import Link from 'next/link'
import { getResources } from '@/lib/sheets'
import { MENA_COUNTRIES, countryToSlug } from '@/lib/countries'
import Footer from '@/components/Footer'

export const revalidate = 3600

export default async function CountriesPage() {
  const resources = await getResources()
  const counts = MENA_COUNTRIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = resources.filter(r => r.country === c).length
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Countries</h1>
      <div className="grid grid-cols-2 gap-3">
        {MENA_COUNTRIES.map(country => (
          <Link
            key={country}
            href={`/countries/${countryToSlug(country)}`}
            className="bg-white rounded-2xl p-4 border border-green-100 hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="font-semibold text-gray-900 text-sm">{country}</div>
            <div className="text-xs text-green-600 mt-1">{counts[country] ?? 0} resources</div>
          </Link>
        ))}
      </div>
      <Footer />
    </div>
  )
}
