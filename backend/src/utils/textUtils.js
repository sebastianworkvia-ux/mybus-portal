// Utility do czyszczenia i normalizacji tekstu z polskimi znakami
// backend/src/utils/textUtils.js

/**
 * Naprawia błędne encoding UTF-8 w tekście
 * @param {string} text - Tekst do naprawy
 * @returns {string} - Naprawiony tekst
 */
export const fixEncoding = (text) => {
  if (!text || typeof text !== 'string') return text
  
  // Usuń replacement characters (� - U+FFFD)
  let fixed = text.replace(/\uFFFD/g, '').replace(/�/g, '')
  
  // Mapa wszystkich możliwych błędów encoding
  const charMap = {
    // Małe polskie znaki (różne warianty encoding)
    'Ä…': 'ą', '\u0105': 'ą',
    'Ä‡': 'ć', '\u0107': 'ć',
    'Ä™': 'ę', '\u0119': 'ę',
    'Ĺ‚': 'ł', '\u0142': 'ł',
    'Ĺ„': 'ń', '\u0144': 'ń',
    'Ăł': 'ó', '\u00f3': 'ó',
    'Ĺ›': 'ś', '\u015b': 'ś',
    'Ĺş': 'ź', '\u017a': 'ź',
    'ĹĽ': 'ż', '\u017c': 'ż',
    // Wielkie polskie znaki
    'Ä„': 'Ą', '\u0104': 'Ą',
    'Ä†': 'Ć', '\u0106': 'Ć',
    'Ä\u0098': 'Ę', '\u0118': 'Ę',
    'Ĺ\u0081': 'Ł', '\u0141': 'Ł',
    'Ĺ\u0083': 'Ń', '\u0143': 'Ń',
    'Ă"': 'Ó', '\u00d3': 'Ó',
    'Ĺš': 'Ś', '\u015a': 'Ś',
    'Ĺą': 'Ź', '\u0179': 'Ź',
    'Ĺ»': 'Ż', '\u017b': 'Ż'
  }
  
  // Zastosuj wszystkie zamiany znaków
  for (const [bad, good] of Object.entries(charMap)) {
    fixed = fixed.split(bad).join(good)
  }
  
  // Napraw częste słowa (po zamianie znaków mogły zostać częściowo naprawione)
  const wordFixes = {
    'Midzynarodowy': 'Międzynarodowy',
    'midzynarodowy': 'międzynarodowy',
    'Przewz': 'Przewóz',
    'przewz': 'przewóz',
    'Osb': 'Osób',
    'osb': 'osób',
    'Pasaerskie': 'Pasażerskie',
    'pasaerskie': 'pasażerskie',
    'Krakw': 'Kraków',
    'Gdask': 'Gdańsk',
    'Wrocaw': 'Wrocław',
    'dź': 'Łódź',
    'Pozna': 'Poznań',
    'ukasz': 'Łukasz',
    'Twj': 'Twój',
    'twj': 'twój',
    'Augustw': 'Augustów',
    'Bagaowy': 'Bagażowy',
    'bagaowy': 'bagażowy',
    'Ciarowy': 'Ciężarowy',
    'ciarowy': 'ciężarowy',
    'Suwaki': 'Suwałki',
    'Warmiski': 'Warmiński',
    'autokarw': 'autokarów',
    'Oga': 'Olga'
  }
  
  for (const [bad, good] of Object.entries(wordFixes)) {
    fixed = fixed.split(bad).join(good)
  }
  
  return fixed.trim()
}

/**
 * Czyści i normalizuje tekst
 * @param {string} text - Tekst do wyczyszczenia
 * @returns {string} - Wyczyszczony tekst
 */
export const cleanText = (text) => {
  if (!text || typeof text !== 'string') return text
  
  return text
    .trim()
    .replace(/\s+/g, ' ') // Usuń wielokrotne spacje
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Usuń znaki kontrolne
}

/**
 * Sanityzuje obiekt - naprawia encoding we wszystkich polach tekstowych
 * @param {object} obj - Obiekt do sanityzacji
 * @returns {object} - Sanityzowany obiekt
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj
  
  const sanitized = Array.isArray(obj) ? [] : {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = fixEncoding(cleanText(value))
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  
  return sanitized
}

/**
 * Middleware do automatycznej sanityzacji req.body
 */
export const sanitizeBodyMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body)
  }
  next()
}

/**
 * Lista zakazanych słów/fraz (wulgaryzmy, obraźliwe treści)
 * Zawiera polskie, angielskie i niemieckie wulgaryzmy
 */
const PROFANITY_LIST = [
  // Polskie wulgaryzmy
  'kurwa', 'kurw', 'chuj', 'chuja', 'chujek', 'chuju', 'pizda', 'pizdzie', 
  'pizdę', 'jebać', 'jebac', 'jebak', 'zajebisty', 'wpierdol', 'wypierdalaj',
  'spierdalaj', 'pieprzyć', 'pieprzony', 'pierdol', 'pierdolić', 'pierdolic',
  'dupek', 'dupa', 'skurwysyn', 'skurwiel', 'dziwka', 'szmata', 'ciota',
  'pedał', 'pedal', 'くそ野郎', 'debil', 'idiota', 'kretyn', 'pojeb', 'pojebany',
  'gnój', 'gnoj', 'gnida', 'śmieć', 'smiec', 'ścierwo', 'scierwo',
  'cwel', 'frajer', 'gówno', 'gowno', 'srać', 'srac', 'zasrany',
  // Angielskie wulgaryzmy
  'fuck', 'fucking', 'shit', 'bitch', 'asshole', 'bastard', 'cunt',
  'dick', 'cock', 'pussy', 'whore', 'slut', 'nigger', 'fag', 'faggot',
  // Niemieckie wulgaryzmy
  'scheiße', 'scheisse', 'fick', 'ficken', 'arschloch', 'hurensohn',
  'fotze', 'schwanz', 'wichser', 'schlampe', 'nutte'
]

/**
 * Sprawdza, czy tekst zawiera wulgarne/obraźliwe słowa
 * @param {string} text - Tekst do sprawdzenia
 * @returns {boolean} - true jeśli znaleziono wulgaryzmy
 */
export const containsProfanity = (text) => {
  if (!text || typeof text !== 'string') return false
  
  const normalizedText = text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Usuń akcenty
    .replace(/[^a-z0-9\s]/gi, ' ') // Zamień znaki specjalne na spacje
  
  return PROFANITY_LIST.some(word => {
    const normalizedWord = word.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    
    // Sprawdź czy słowo występuje jako całe słowo (word boundary)
    const regex = new RegExp(`\\b${normalizedWord}\\b`, 'i')
    return regex.test(normalizedText)
  })
}

/**
 * Sprawdza obiekt rekurencyjnie pod kątem wulgaryzmów
 * @param {Object} obj - Obiekt do sprawdzenia
 * @returns {string|null} - Nazwa pola zawierającego wulgaryzm lub null
 */
export const checkProfanityInObject = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object') return null
  
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'string' && containsProfanity(value)) {
      return fieldPath
    }
    
    if (typeof value === 'object' && value !== null) {
      const nestedResult = checkProfanityInObject(value, fieldPath)
      if (nestedResult) return nestedResult
    }
  }
  
  return null
}

export default {
  fixEncoding,
  cleanText,
  sanitizeObject,
  sanitizeBodyMiddleware,
  containsProfanity,
  checkProfanityInObject
}
