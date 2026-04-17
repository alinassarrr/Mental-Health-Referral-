// scraper/candidates-to-resources.js
// Converts candidates.csv → resources.csv with all columns mapped
// Run: node candidates-to-resources.js

const { readFileSync, writeFileSync } = require('fs')
const { COUNTRIES } = require('./queries')

function slugify(country, name) {
  return [country, name]
    .join(' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function guessType(category = '', name = '') {
  const text = (category + ' ' + name).toLowerCase()
  if (/hotline|helpline|crisis|emergency|lifeline|خط/.test(text)) return 'Helpline'
  if (/ngo|non.?profit|charity|association|foundation|جمعية|منظمة/.test(text)) return 'NGO'
  if (/hospital|مستشفى/.test(text)) return 'Hospital'
  if (/primary|phcc|health center|مركز صحي/.test(text)) return 'PHCC'
  return 'Clinic'
}

function guessLanguages(country = '') {
  const maghreb = ['Algeria', 'Morocco', 'Tunisia', 'Libya']
  const gulf = ['UAE', 'Saudi Arabia', 'Kuwait', 'Qatar', 'Oman', 'Bahrain']
  if (maghreb.includes(country)) return 'ar,fr'
  if (gulf.includes(country)) return 'ar,en'
  return 'ar'
}

function parseCsvLine(line) {
  const values = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current); current = ''
    } else {
      current += char
    }
  }
  values.push(current)
  return values
}

function toCsvRow(obj) {
  return Object.values(obj)
    .map(v => `"${String(v ?? '').replace(/"/g, '""')}"`)
    .join(',')
}

function parseHours(raw = '') {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.join(', ')
  } catch {}
  return raw.replace(/[\[\]"]/g, '').trim()
}

const today = new Date().toISOString().split('T')[0]

const raw = readFileSync('./candidates.csv', 'utf-8')
const lines = raw.split('\n').filter(l => l.trim())
const headers = parseCsvLine(lines[0])

const candidates = lines.slice(1).map(line => {
  const vals = parseCsvLine(line)
  return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
})

console.log(`Read ${candidates.length} candidates`)

const seen = new Set()
const resources = candidates
  .filter(c => c.name && c.name.trim())
  .map(c => {
    const id = slugify(c.country, c.name)
    return {
      id: seen.has(id) ? `${id}-${Math.random().toString(36).slice(2,5)}` : (seen.add(id), id),
      name: c.name,
      country: c.country,
      type: guessType(c.category, c.name),
      description: '',
      phone: c.phone,
      email: c.email,
      website: c.website,
      address: c.address,
      google_maps_url: c.google_maps_url,
      lat: c.lat,
      lng: c.lng,
      services: '',
      languages: guessLanguages(c.country),
      session_type: 'Unknown',
      pricing: 'Unknown',
      stakeholders: '',
      hours: parseHours(c.hours),
      verified: 'FALSE',
      date_added: today,
    }
  })

const resourceHeaders = Object.keys(resources[0]).join(',')
const csv = [resourceHeaders, ...resources.map(toCsvRow)].join('\n')
writeFileSync('./resources.csv', csv)

console.log(`Written ${resources.length} rows to scraper/resources.csv`)
console.log(`Type breakdown:`)
const types = resources.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc }, {})
Object.entries(types).forEach(([t, n]) => console.log(`  ${t}: ${n}`))
console.log('\nNext: Import scraper/resources.csv into the Google Sheet "resources" tab.')
