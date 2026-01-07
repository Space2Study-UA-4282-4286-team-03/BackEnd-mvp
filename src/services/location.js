const fetch = require('node-fetch')

const COUNTRIES_API = 'https://countriesnow.space/api/v0.1/countries'
async function fetchCountriesFromApi() {
  const response = await fetch(COUNTRIES_API)
  const json = await response.json()
  return json.data
}

function normalizeCountries(data) {
  const BLOCKED_COUNTRIES = ['russia', 'russian federation']
  return data
    .filter(({ country }) => !BLOCKED_COUNTRIES.includes(country.toLowerCase()))
    .map(({ country, cities }) => ({
      id: country.toLowerCase().replace(/\s/g, '-'),
      name: country,
      cities: cities.map((city) => ({
        id: city.toLowerCase().replace(/\s/g, '-'),
        name: city
      }))
    }))
}

module.exports = {
  fetchCountriesFromApi,
  normalizeCountries
}
