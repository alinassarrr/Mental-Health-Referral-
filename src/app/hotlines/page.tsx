import { getHotlines } from '@/lib/sheets'
import { MENA_COUNTRIES } from '@/lib/countries'
export const revalidate = 3600

export default async function HotlinesPage() {
  const hotlines = await getHotlines()

  const byCountry = MENA_COUNTRIES.reduce<Record<string, typeof hotlines>>((acc, c) => {
    const found = hotlines.filter(h => h.country === c)
    if (found.length > 0) acc[c] = found
    return acc
  }, {})

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Crisis Hotlines</h1>
      <p className="text-sm text-gray-500 mb-6">Immediate support lines across the MENA region</p>
      <div className="mt-6 flex flex-col gap-6">
        {Object.entries(byCountry).map(([country, lines]) => (
          <div key={country}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">{country}</h2>
            <div className="flex flex-col gap-2">
              {lines.map(h => (
                <div key={h.number} className="bg-white rounded-2xl p-4 border border-red-100 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{h.name}</div>
                    {h.hours && <div className="text-xs text-gray-400 mt-0.5">{h.hours}</div>}
                  </div>
                  <a
                    href={`tel:${h.number}`}
                    className="shrink-0 bg-red-500 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-red-600 transition-colors"
                  >
                    {h.number}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(byCountry).length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">No hotlines added yet.</p>
        )}
      </div>
    </div>
  )
}
