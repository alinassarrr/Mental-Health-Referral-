// scraper/clean-sheet.js
// Fetches current resources from Google Sheet, validates each row by:
//   1. Lat/Lng inside the country's bounding box  (primary)
//   2. Phone country code match                   (secondary, if no coords)
// Outputs:
//   resources-clean.csv   → import this into the sheet (replaces current)
//   resources-flagged.csv → review manually, add back anything wrongly removed
//
// Run: node clean-sheet.js

require('dotenv').config({ path: '../.env' })
const { writeFileSync } = require('fs')
const https = require('https')

// Per-country bounding boxes [latMin, latMax, lngMin, lngMax]
const BOUNDS = {
  Algeria:      [19.0, 37.1, -8.7,  12.0],
  Egypt:        [22.0, 31.7, 24.7,  36.9],
  Iran:         [25.0, 39.8, 44.0,  63.3],
  Iraq:         [29.1, 37.4, 38.8,  48.6],
  Palestine:    [31.2, 32.6, 34.2,  35.7],
  Jordan:       [29.2, 33.4, 35.0,  39.3],
  Kuwait:       [28.5, 30.1, 46.5,  48.5],
  Lebanon:      [33.1, 34.7, 35.1,  36.6],
  Libya:        [19.5, 33.2,  9.4,  25.2],
  Morocco:      [27.7, 35.9,-13.2,  -0.9],
  Oman:         [16.6, 26.4, 51.9,  59.8],
  Qatar:        [24.5, 26.2, 50.7,  51.7],
  'Saudi Arabia':[16.4,32.2, 34.5,  55.7],
  Syria:        [32.3, 37.3, 35.7,  42.4],
  Tunisia:      [30.2, 37.5,  7.5,  11.6],
  UAE:          [22.6, 26.1, 51.6,  56.4],
  Yemen:        [12.1, 19.0, 42.5,  55.0],
}

// Country dial codes (leading digits after +)
const PHONE_CODES = {
  Algeria: ['213'],
  Egypt: ['20'],
  Iran: ['98'],
  Iraq: ['964'],
  Palestine: ['970', '972'],
  Jordan: ['962'],
  Kuwait: ['965'],
  Lebanon: ['961'],
  Libya: ['218'],
  Morocco: ['212'],
  Oman: ['968'],
  Qatar: ['974'],
  'Saudi Arabia': ['966'],
  Syria: ['963'],
  Tunisia: ['216'],
  UAE: ['971'],
  Yemen: ['967'],
}

function inBounds(lat, lng, country) {
  const b = BOUNDS[country]
  if (!b) return null // unknown country, can't judge
  return lat >= b[0] && lat <= b[1] && lng >= b[2] && lng <= b[3]
}

function phoneMatchesCountry(phone, country) {
  if (!phone) return null
  const codes = PHONE_CODES[country]
  if (!codes) return null
  const digits = phone.replace(/\D/g, '')
  // Check if starts with any of the country codes
  if (codes.some(c => digits.startsWith(c))) return true
  // Check for clearly non-MENA codes (1=US/CA, 44=UK, 61=AU, 49=DE, 33=FR)
  const nonMena = ['1', '44', '61', '49', '33', '39', '34', '81', '82', '86']
  if (nonMena.some(c => digits.startsWith(c))) return false
  return null // ambiguous local number
}

function validate(row) {
  const lat = parseFloat(row.lat)
  const lng = parseFloat(row.lng)
  const hasCoords = !isNaN(lat) && !isNaN(lng)

  if (hasCoords) {
    const coordsOk = inBounds(lat, lng, row.country)
    if (coordsOk === true) return { keep: true, reason: 'coords_match' }
    if (coordsOk === false) return { keep: false, reason: `coords_outside_${row.country}` }
  }

  // No coords or unknown country — try phone
  const phoneOk = phoneMatchesCountry(row.phone, row.country)
  if (phoneOk === true) return { keep: true, reason: 'phone_match' }
  if (phoneOk === false) return { keep: false, reason: 'phone_wrong_country' }

  // No usable signal — keep but mark uncertain
  return { keep: true, reason: 'no_signal_kept' }
}

function parseCsv(text) {
  const lines = text.split('\n').filter(l => l.trim())
  const headers = parseLine(lines[0])
  return lines.slice(1).map(line => {
    const vals = parseLine(line)
    return Object.fromEntries(headers.map((h, i) => [h, vals[i] ?? '']))
  })
}

function parseLine(line) {
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

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      const mod = u.startsWith('https') ? https : require('http')
      mod.get(u, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location)
        }
        let data = ''
        res.on('data', chunk => data += chunk)
        res.on('end', () => resolve(data))
      }).on('error', reject)
    }
    get(url)
  })
}

async function main() {
  const url = process.env.NEXT_PUBLIC_RESOURCES_CSV_URL
  if (!url) { console.error('Missing NEXT_PUBLIC_RESOURCES_CSV_URL in .env'); process.exit(1) }

  console.log('Fetching sheet data...')
  const csv = await fetchUrl(url)
  const rows = parseCsv(csv)
  console.log(`Loaded ${rows.length} rows`)

  const clean = []
  const flagged = []

  rows.forEach(row => {
    const { keep, reason } = validate(row)
    if (keep) {
      clean.push(row)
    } else {
      flagged.push({ ...row, _flag_reason: reason })
    }
  })

  const headers = Object.keys(rows[0])
  const cleanCsv = [headers.join(','), ...clean.map(toCsvRow)].join('\n')
  const flaggedHeaders = [...headers, '_flag_reason']
  const flaggedCsv = [flaggedHeaders.join(','), ...flagged.map(toCsvRow)].join('\n')

  writeFileSync('./resources-clean.csv', cleanCsv)
  writeFileSync('./resources-flagged.csv', flaggedCsv)

  console.log(`\n✓ Clean:   ${clean.length} rows  → scraper/resources-clean.csv`)
  console.log(`✗ Flagged: ${flagged.length} rows  → scraper/resources-flagged.csv`)

  // Breakdown of flagged by country
  if (flagged.length > 0) {
    console.log('\nFlagged breakdown:')
    const byCountry = flagged.reduce((acc, r) => {
      acc[r.country] = (acc[r.country] || 0) + 1
      return acc
    }, {})
    Object.entries(byCountry).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`))
    console.log('\nReasons:')
    const byReason = flagged.reduce((acc, r) => {
      acc[r._flag_reason] = (acc[r._flag_reason] || 0) + 1
      return acc
    }, {})
    Object.entries(byReason).forEach(([r,n]) => console.log(`  ${r}: ${n}`))
  }

  console.log('\nNext steps:')
  console.log('  1. Open resources-flagged.csv — check if any should be kept')
  console.log('  2. Import resources-clean.csv into Google Sheet → File → Import → Replace current sheet')
}

main().catch(console.error)
