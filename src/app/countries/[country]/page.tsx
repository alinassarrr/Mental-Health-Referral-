import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getResources, getHotlines } from '@/lib/sheets'
import { MENA_COUNTRIES, slugToCountry, COUNTRY_FLAGS } from '@/lib/countries'
import ResourceCard from '@/components/ResourceCard'
export const revalidate = 3600

export async function generateStaticParams() {
  return MENA_COUNTRIES.map((c) => ({
    country: c.toLowerCase().replace(/\s+/g, '-'),
  }))
}

export default async function CountryPage({
  params,
}: {
  params: Promise<{ country: string }>
}) {
  const { country: slug } = await params
  const countryName = slugToCountry(slug)

  if (!MENA_COUNTRIES.includes(countryName as typeof MENA_COUNTRIES[number])) {
    notFound()
  }

  const [allResources, allHotlines] = await Promise.all([getResources(), getHotlines()])

  const resources = allResources.filter(
    (r) => r.country.toLowerCase() === countryName.toLowerCase()
  )
  const hotlines = allHotlines.filter(
    (h) => h.country.toLowerCase() === countryName.toLowerCase()
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/countries" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-green-600 transition-colors mb-6">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" className="w-4 h-4">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        All countries
      </Link>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-4xl">{COUNTRY_FLAGS[countryName]}</span>
        <h1 className="text-3xl font-bold text-gray-900">{countryName}</h1>
      </div>
      <p className="text-gray-500 mb-6">
        {resources.length} resources · {hotlines.length} crisis hotlines
      </p>
      {hotlines.length > 0 && (
        <section className="mt-8 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Crisis Hotlines</h2>
          <div className="flex flex-col gap-2">
            {hotlines.map((h) => (
              <div key={h.number} className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900 text-sm">{h.name}</div>
                  {h.hours && <div className="text-xs text-gray-500">{h.hours}</div>}
                </div>
                <a href={`tel:${h.number}`} className="text-red-600 font-semibold text-sm hover:underline">
                  {h.number}
                </a>
              </div>
            ))}
          </div>
        </section>
      )}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Resources</h2>
        {resources.length === 0 ? (
          <p className="text-gray-400 text-sm">No resources found for this country yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resources.map((r) => <ResourceCard key={r.id} resource={r} />)}
          </div>
        )}
      </section>
    </div>
  )
}
