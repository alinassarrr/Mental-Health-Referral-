// scraper/enrich-defaults.js
// Applies smart defaults to empty/Unknown fields across resources-clean.csv
// Run: node enrich-defaults.js

const { readFileSync, writeFileSync } = require('fs')

// ── Parsers ──────────────────────────────────────────────────────────────────

function parseCsv(text) {
  const lines = text.trim().split('\n')
  const headers = parseLine(lines[0])
  return { headers, rows: lines.slice(1).map(l => Object.fromEntries(headers.map((h, i) => [h, parseLine(l)[i] ?? '']))) }
}

function parseLine(line) {
  const vals = []; let cur = '', inQ = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++ } else inQ = !inQ }
    else if (c === ',' && !inQ) { vals.push(cur); cur = '' }
    else cur += c
  }
  vals.push(cur)
  return vals
}

function toCsvRow(obj) {
  return Object.values(obj).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
}

// ── Default logic ─────────────────────────────────────────────────────────────

const PRICING = {
  Helpline: 'Free',
  NGO:      'Free',
  PHCC:     'Free',
  Hospital: 'Subsidized',
  Clinic:   'Paid',
}

const SERVICES = {
  Helpline: 'Crisis support, Emotional support, Referrals',
  NGO:      'Mental health, Psychosocial support, Counselling',
  Hospital: 'Psychiatry, Inpatient care, Outpatient care',
  PHCC:     'Primary care, Mental health, Counselling',
  Clinic:   'Therapy, Counselling, Mental health',
}

function isEmpty(val) {
  return !val || val.trim() === '' || val.trim().toLowerCase() === 'unknown'
}

function isVerified(row) {
  const hasPhone   = !!row.phone && row.phone.trim() !== ''
  const hasContact = !!row.website || !!row.email
  const hasCoords  = !isNaN(parseFloat(row.lat)) && !isNaN(parseFloat(row.lng))
  return hasPhone && hasContact && hasCoords
}

function guessSessionType(row) {
  const text = (row.name + ' ' + row.description + ' ' + row.services).toLowerCase()
  if (/group|family|couple|couples|marital/.test(text)) return 'Group'
  return 'Individual'
}

// ── Main ──────────────────────────────────────────────────────────────────────

const raw = readFileSync('./resources-clean.csv', 'utf-8')
const { headers, rows } = parseCsv(raw)

let changed = 0

const enriched = rows.map(row => {
  const orig = JSON.stringify(row)

  // pricing
  if (isEmpty(row.pricing)) {
    row.pricing = PRICING[row.type] ?? 'Unknown'
  }

  // session_type
  if (isEmpty(row.session_type)) {
    row.session_type = guessSessionType(row)
  }

  // services
  if (isEmpty(row.services)) {
    row.services = SERVICES[row.type] ?? ''
  }

  // verified — only upgrade to TRUE, never downgrade an existing TRUE
  if (row.verified !== 'TRUE') {
    row.verified = isVerified(row) ? 'TRUE' : 'FALSE'
  }

  if (JSON.stringify(row) !== orig) changed++
  return row
})

const csv = [headers.join(','), ...enriched.map(toCsvRow)].join('\n')
writeFileSync('./resources-clean.csv', csv)

// ── Report ────────────────────────────────────────────────────────────────────

const counts = field => ({
  filled: enriched.filter(r => !isEmpty(r[field])).length,
  total:  enriched.length,
})

console.log(`\nEnriched ${changed} rows\n`)
console.log('Coverage after enrichment:')
for (const f of ['pricing', 'session_type', 'services', 'verified']) {
  const { filled, total } = counts(f)
  console.log(`  ${f}: ${filled}/${total}`)
}
console.log('\nPricing breakdown:')
const byPricing = enriched.reduce((a, r) => { a[r.pricing] = (a[r.pricing]||0)+1; return a }, {})
Object.entries(byPricing).forEach(([k,v]) => console.log(`  ${k}: ${v}`))
console.log('\nVerified breakdown:')
const byVerified = enriched.reduce((a, r) => { a[r.verified] = (a[r.verified]||0)+1; return a }, {})
Object.entries(byVerified).forEach(([k,v]) => console.log(`  ${k}: ${v}`))
console.log('\nNext: import resources-clean.csv into Google Sheet')
