// Profanity filter for frontend validation
// Lista zakazanych słów/fraz (wulgaryzmy, obraźliwe treści)

const PROFANITY_LIST = [
  // Polskie wulgaryzmy
  'kurwa', 'kurw', 'chuj', 'chuja', 'chujek', 'chuju', 'pizda', 'pizdzie', 
  'pizdę', 'jebać', 'jebac', 'jebak', 'zajebisty', 'wpierdol', 'wypierdalaj',
  'spierdalaj', 'pieprzyć', 'pieprzony', 'pierdol', 'pierdolić', 'pierdolic',
  'dupek', 'dupa', 'skurwysyn', 'skurwiel', 'dziwka', 'szmata', 'ciota',
  'pedał', 'pedal', 'debil', 'idiota', 'kretyn', 'pojeb', 'pojebany',
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
 * Sprawdza obiekt pod kątem wulgaryzmów
 * @param {Object} obj - Obiekt do sprawdzenia
 * @returns {Object|null} - { field: string, value: string } jeśli znaleziono wulgaryzm, null w przeciwnym razie
 */
export const checkProfanityInObject = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object') return null
  
  for (const [key, value] of Object.entries(obj)) {
    const fieldPath = prefix ? `${prefix}.${key}` : key
    
    if (typeof value === 'string' && containsProfanity(value)) {
      return { field: fieldPath, value: value.substring(0, 50) }
    }
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nestedResult = checkProfanityInObject(value, fieldPath)
      if (nestedResult) return nestedResult
    }
    
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] === 'string' && containsProfanity(value[i])) {
          return { field: `${fieldPath}[${i}]`, value: value[i].substring(0, 50) }
        }
      }
    }
  }
  
  return null
}

/**
 * Zwraca przyjazną nazwę pola dla użytkownika
 */
export const getFieldLabel = (fieldPath) => {
  const labels = {
    'companyName': 'Nazwa firmy',
    'description': 'Opis',
    'detailedDescription': 'Szczegółowy opis',
    'promoTitle': 'Tytuł promocji',
    'promoDescription': 'Opis promocji',
    'luggageAdditionalInfo': 'Informacje o bagażu',
    'contact.phone': 'Telefon',
    'contact.email': 'Email',
    'contact.website': 'Strona www'
  }
  
  return labels[fieldPath] || fieldPath
}
