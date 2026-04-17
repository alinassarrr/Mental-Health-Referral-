// scraper/queries.js
const COUNTRIES = [
  'Algeria', 'Egypt', 'Iran', 'Iraq', 'Palestine', 'Jordan', 'Kuwait',
  'Lebanon', 'Libya', 'Morocco', 'Oman', 'Qatar', 'Saudi Arabia',
  'Syria', 'Tunisia', 'UAE', 'Yemen',
]

const QUERY_TEMPLATES = [
  (c) => `mental health clinic ${c}`,
  (c) => `NGO mental health ${c}`,
  (c) => `psychological counseling center ${c}`,
  (c) => `mental health hotline crisis helpline ${c}`,
]

function buildQueries() {
  return COUNTRIES.flatMap((country) =>
    QUERY_TEMPLATES.map((tpl) => tpl(country))
  )
}

module.exports = { COUNTRIES, buildQueries }
