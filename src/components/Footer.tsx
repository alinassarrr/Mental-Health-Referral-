export default function Footer() {
  return (
    <footer className="mt-16 pb-24 md:pb-12 px-6 text-center">
      <div className="max-w-md mx-auto">
        <p className="text-base font-semibold text-gray-700 leading-relaxed mb-1">
          You are not alone.
        </p>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          Reaching out is the bravest thing you can do. Help exists, and it&apos;s closer than you think.
        </p>
        <div className="border-t border-gray-100 pt-5 text-xs text-gray-300 space-y-1">
          <p>
            A project by{' '}
            <a
              href="https://www.linkedin.com/in/farahhijazi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:text-green-700 font-semibold underline underline-offset-2 transition-colors"
            >
              Farah Hijazi
            </a>
{' '}because everyone in MENA deserves access to mental health support.
          </p>
          <p>Data sourced from public listings. Always verify before use.</p>
        </div>
      </div>
    </footer>
  )
}
