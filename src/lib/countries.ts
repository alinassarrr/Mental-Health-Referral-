export const MENA_COUNTRIES = [
  'Algeria', 'Egypt', 'Iran', 'Iraq', 'Palestine', 'Jordan', 'Kuwait',
  'Lebanon', 'Libya', 'Morocco', 'Oman', 'Qatar', 'Saudi Arabia',
  'Syria', 'Tunisia', 'UAE', 'Yemen',
] as const

export type MenaCountry = typeof MENA_COUNTRIES[number]

export function slugToCountry(slug: string): string {
  return MENA_COUNTRIES.find(
    (c) => c.toLowerCase().replace(/\s+/g, '-') === slug
  ) ?? slug
}

export function countryToSlug(country: string): string {
  return country.toLowerCase().replace(/\s+/g, '-')
}
