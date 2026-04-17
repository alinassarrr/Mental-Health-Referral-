// scraper/push-to-sheets.js
const { readFileSync, writeFileSync } = require('fs')
const { COUNTRIES } = require('./queries')

function extractCountry(searchString) {
  if (!searchString) return ''
  return COUNTRIES.find((c) =>
    searchString.toLowerCase().includes(c.toLowerCase())
  ) || ''
}

function slugify(name, country) {
  return [country, name]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function flatten(item) {
  const country = extractCountry(item.searchString)
  return {
    scrape_id: item.placeId || '',
    query: item.searchString || '',
    country,
    name: item.title || '',
    category: item.categoryName || '',
    address: item.address || '',
    phone: item.phone || '',
    website: item.website || '',
    email: item.email || '',
    lat: item.location?.lat ?? '',
    lng: item.location?.lng ?? '',
    google_maps_url: item.url || '',
    rating: item.totalScore ?? '',
    reviews_count: item.reviewsCount ?? '',
    hours: JSON.stringify(item.openingHours || []),
    approved: '',
    notes: '',
  }
}

function toCsvRow(obj) {
  return Object.values(obj)
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(',')
}

const items = JSON.parse(readFileSync('./output.json', 'utf-8'))
const rows = items.map(flatten)
const headers = Object.keys(rows[0]).join(',')
const csv = [headers, ...rows.map(toCsvRow)].join('\n')
writeFileSync('./candidates.csv', csv)
console.log(`Written ${rows.length} rows to scraper/candidates.csv`)
console.log('Next step: import candidates.csv into the Google Sheet "candidates" tab.')
