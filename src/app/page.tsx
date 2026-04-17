import Link from 'next/link'
import { getResources, getHotlines } from '@/lib/sheets'
import { MENA_COUNTRIES, countryToSlug } from '@/lib/countries'
import Footer from '@/components/Footer'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'

export const revalidate = 3600

export default async function HomePage() {
  const [resources, hotlines] = await Promise.all([getResources(), getHotlines()])

  const countryCounts = MENA_COUNTRIES.reduce<Record<string, number>>((acc, c) => {
    acc[c] = resources.filter((r) => r.country === c).length
    return acc
  }, {})

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl font-bold text-teal-700 mb-4">
          Mental Health Resources Across MENA
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-6">
          Find verified mental health support in your country — NGOs, helplines, and clinics.
        </p>
        <Link
          href="/resources"
          className="inline-block bg-teal-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Browse All Resources
        </Link>
      </section>

      <section className="grid grid-cols-3 gap-4 mb-12">
        {[
          { label: 'Resources Listed', value: resources.length },
          { label: 'Countries Covered', value: MENA_COUNTRIES.length },
          { label: 'Crisis Hotlines', value: hotlines.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-4 text-center shadow-sm border border-gray-100">
            <div className="text-3xl font-bold text-teal-600">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Browse by Country</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {MENA_COUNTRIES.map((country) => (
            <Link
              key={country}
              href={`/countries/${countryToSlug(country)}`}
              className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow text-center"
            >
              <div className="font-medium text-gray-800 text-sm">{country}</div>
              <div className="text-xs text-teal-600 mt-1">
                {countryCounts[country] ?? 0} resources
              </div>
            </Link>
          ))}
        </div>
      </section>

      <CrisisDisclaimer />
      <Footer />
    </div>
  )
}
