import Footer from '@/components/Footer'
import CrisisDisclaimer from '@/components/CrisisDisclaimer'

export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-teal-700 mb-4">About This Directory</h1>
      <CrisisDisclaimer />
      <div className="mt-8 text-sm leading-relaxed text-gray-700 space-y-4">
        <p>
          This directory lists mental health NGOs, helplines, and primary health care centers
          across 17 countries in the MENA region: Algeria, Egypt, Iran, Iraq, Palestine,
          Jordan, Kuwait, Lebanon, Libya, Morocco, Oman, Qatar, Saudi Arabia, Syria, Tunisia,
          UAE, and Yemen.
        </p>
        <p>
          Data is sourced from public Google Maps listings and manually reviewed before
          publication. Always call ahead to confirm availability and services.
        </p>
      </div>
      <Footer />
    </div>
  )
}
