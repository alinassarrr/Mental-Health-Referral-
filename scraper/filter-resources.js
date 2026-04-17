// scraper/filter-resources.js
// Removes non-MENA results from resources.csv using lat/lng bounds
// Run: node filter-resources.js

const { readFileSync, writeFileSync } = require('fs')

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

// Generous MENA bounding box (covers all 17 countries)
const MENA_BOUNDS = { latMin: 8, latMax: 42, lngMin: -18, lngMax: 65 }

function isInMena(lat, lng) {
  const la = parseFloat(lat)
  const lo = parseFloat(lng)
  if (isNaN(la) || isNaN(lo)) return false
  return la >= MENA_BOUNDS.latMin && la <= MENA_BOUNDS.latMax &&
         lo >= MENA_BOUNDS.lngMin && lo <= MENA_BOUNDS.lngMax
}

const raw = readFileSync('./resources.csv', 'utf-8')
const lines = raw.split('\n').filter(l => l.trim())
const headers = parseCsvLine(lines[0])

const all = lines.slice(1).map(line => {
  const vals = parseCsvLine(line)
  return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
})

const kept = all.filter(r => isInMena(r.lat, r.lng))
const removed = all.length - kept.length

const csv = [headers.join(','), ...kept.map(toCsvRow)].join('\n')
writeFileSync('./resources.csv', csv)

console.log(`Total: ${all.length} → Kept: ${kept.length} (removed ${removed} non-MENA rows)`)

const byCountry = kept.reduce((acc, r) => { acc[r.country] = (acc[r.country] || 0) + 1; return acc }, {})
console.log('\nBreakdown by country:')
Object.entries(byCountry).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`))
