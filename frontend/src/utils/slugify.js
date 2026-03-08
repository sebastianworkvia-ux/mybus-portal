/**
 * Convert city name to URL-friendly slug
 * Examples:
 * "Wrocław" -> "wroclaw"
 * "Warszawa" -> "warszawa"
 */
export function slugify(text) {
  if (!text) return ''
  
  const polishMap = {
    'ą': 'a', 'ć': 'c', 'ę': 'e', 'ł': 'l',
    'ń': 'n', 'ó': 'o', 'ś': 's', 'ź': 'z', 'ż': 'z',
    'Ą': 'a', 'Ć': 'c', 'Ę': 'e', 'Ł': 'l',
    'Ń': 'n', 'Ó': 'o', 'Ś': 's', 'Ź': 'z', 'Ż': 'z'
  }
  
  return text
    .split('')
    .map(char => polishMap[char] || char)
    .join('')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Reverse slug to city name with capital first letter
 * "wroclaw" -> "Wrocław"
 */
export function deslugify(slug) {
  if (!slug) return ''
  
  const cityMap = {
    'wroclaw': 'Wrocław',
    'warszawa': 'Warszawa',
    'krakow': 'Kraków',
    'gdansk': 'Gdańsk',
    'poznan': 'Poznań',
    'lodz': 'Łódź',
    'szczecin': 'Szczecin',
    'bydgoszcz': 'Bydgoszcz',
    'lublin': 'Lublin',
    'katowice': 'Katowice',
    'bialystok': 'Białystok',
    'gdynia': 'Gdynia',
    'czestochowa': 'Częstochowa',
    'radom': 'Radom',
    'torun': 'Toruń',
    'sosnowiec': 'Sosnowiec',
    'kielce': 'Kielce',
    'gliwice': 'Gliwice',
    'zabrze': 'Zabrze',
    'olsztyn': 'Olsztyn',
    'rzeszow': 'Rzeszów',
    'berlin': 'Berlin',
    'hamburg': 'Hamburg',
    'munich': 'Munich',
    'amsterdam': 'Amsterdam',
    'rotterdam': 'Rotterdam',
    'brussels': 'Brussels',
    'vienna': 'Vienna',
    'paris': 'Paris'
  }
  
  return cityMap[slug.toLowerCase()] || slug.charAt(0).toUpperCase() + slug.slice(1)
}
