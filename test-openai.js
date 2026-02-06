/**
 * Test OpenAI API connection
 * Uruchom: node backend/test-openai.js
 * 
 * Wymaga: OPENAI_API_KEY w pliku backend/.env
 */

import dotenv from 'dotenv'
import OpenAI from 'openai'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Załaduj .env z folderu backend
dotenv.config({ path: join(__dirname, 'backend', '.env') })

console.log('🧪 Test połączenia z OpenAI API\n')

// Sprawdź czy klucz istnieje
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ BŁĄD: Brak OPENAI_API_KEY w pliku backend/.env')
  console.log('\n📝 Dodaj do backend/.env:')
  console.log('OPENAI_API_KEY=sk-proj-twoj-klucz-tutaj\n')
  process.exit(1)
}

console.log('✅ OPENAI_API_KEY znaleziony:', process.env.OPENAI_API_KEY.substring(0, 20) + '...')

// Test połączenia
async function testOpenAI() {
  try {
    console.log('\n🔄 Łączenie z OpenAI API...')
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    console.log('✅ Klient OpenAI utworzony pomyślnie')
    console.log('\n🤖 Wysyłam testową wiadomość do GPT-3.5-turbo...')

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "Jesteś pomocnym asystentem." },
        { role: "user", content: "Powiedz 'Działa!' jeśli mnie słyszysz." }
      ],
      max_tokens: 50,
    })

    const response = completion.choices[0].message.content

    console.log('✅ Odpowiedź otrzymana!')
    console.log('📝 GPT-3.5:', response)
    console.log('\n💰 Użyte tokeny:', completion.usage.total_tokens)
    console.log('💵 Koszt (~$0.002 za 1000 tokenów):', (completion.usage.total_tokens / 1000 * 0.002).toFixed(6), 'USD')
    
    console.log('\n✨ SUKCES! OpenAI API działa prawidłowo.')
    console.log('👉 Możesz teraz wdrożyć chatbot na Render.')
    
  } catch (error) {
    console.error('\n❌ BŁĄD podczas łączenia z OpenAI:')
    console.error('Typ:', error.constructor.name)
    console.error('Wiadomość:', error.message)
    
    if (error.status === 401) {
      console.log('\n🔑 Problem z autoryzacją:')
      console.log('- Sprawdź czy OPENAI_API_KEY jest prawidłowy')
      console.log('- Wygeneruj nowy klucz na: https://platform.openai.com/api-keys')
    } else if (error.status === 429) {
      console.log('\n⏱️ Rate limit exceeded:')
      console.log('- Zbyt wiele żądań w krótkim czasie')
      console.log('- Poczekaj chwilę i spróbuj ponownie')
      console.log('- Sprawdź limity: https://platform.openai.com/usage')
    } else if (error.code === 'ENOTFOUND') {
      console.log('\n🌐 Problem z połączeniem internetowym:')
      console.log('- Sprawdź połączenie z internetem')
      console.log('- Sprawdź czy OpenAI.com jest dostępny')
    }
    
    process.exit(1)
  }
}

testOpenAI()
