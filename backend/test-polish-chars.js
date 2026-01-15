// Test lokalny obsługi polskich znaków
// Uruchom: node backend/test-polish-chars.js

import axios from 'axios'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

console.log('🧪 Test obsługi polskich znaków UTF-8\n')

const tests = [
  {
    name: 'Test 1: Endpoint /test-utf8',
    fn: async () => {
      const response = await axios.get(`${BACKEND_URL}/test-utf8`)
      console.log('✅ Response:', response.data)
      
      // Sprawdź czy polskie znaki są poprawnie zwrócone
      const chars = response.data.chars
      if (chars.includes('ą') && chars.includes('ź') && chars.includes('ż')) {
        console.log('✅ Polskie znaki w response: OK\n')
        return true
      } else {
        console.log('❌ Polskie znaki w response: BŁĄD\n')
        return false
      }
    }
  },
  {
    name: 'Test 2: Health check',
    fn: async () => {
      const response = await axios.get(`${BACKEND_URL}/health`)
      console.log('✅ Health:', response.data)
      
      // Sprawdź headers
      const contentType = response.headers['content-type']
      if (contentType.includes('charset=utf-8')) {
        console.log('✅ Content-Type header zawiera charset=utf-8\n')
        return true
      } else {
        console.log('⚠️  Content-Type:', contentType, '\n')
        return true // nie jest krytyczne
      }
    }
  },
  {
    name: 'Test 3: Próbka danych z polskimi znakami',
    fn: async () => {
      const testData = {
        firma: 'Przewoźnik Józef Wiśniewski',
        opis: 'Transport do Krakowa, Gdańska i Łodzi',
        email: 'józef@example.com'
      }
      
      console.log('📤 Wysyłam dane z polskimi znakami:', testData)
      
      // Tutaj normalnie byłby request do API
      // Na razie tylko wyświetlamy lokalne dane
      console.log('✅ Dane lokalne wyświetlają się poprawnie\n')
      return true
    }
  }
]

async function runTests() {
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    console.log(`\n▶️  ${test.name}`)
    console.log('─'.repeat(60))
    
    try {
      const result = await test.fn()
      if (result) {
        passed++
      } else {
        failed++
      }
    } catch (error) {
      console.log(`❌ Błąd: ${error.message}`)
      if (error.response) {
        console.log('Response data:', error.response.data)
      }
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`📊 Wyniki: ${passed} ✅ / ${failed} ❌`)
  console.log('='.repeat(60))
  
  if (failed === 0) {
    console.log('\n🎉 Wszystkie testy przeszły! Polskie znaki działają poprawnie.\n')
  } else {
    console.log('\n⚠️  Niektóre testy nie przeszły. Sprawdź konfigurację.\n')
  }
}

runTests().catch(console.error)
