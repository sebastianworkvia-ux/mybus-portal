import OpenAI from 'openai'
import Carrier from '../models/Carrier.js'

let openai
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  } else {
    console.warn("⚠️ OPENAI_API_KEY is missing. Chat features will be disabled.")
  }
} catch (err) {
  console.error("Failed to initialize OpenAI:", err)
}

const SYSTEM_PROMPT = `
Jesteś wirtualnym asystentem portalu "Przewoźnicy.eu" — bazy polskich firm transportowych działających w Europie.
Pomagasz użytkownikom znaleźć przewoźnika dopasowanego do ich trasy i potrzeb.

Masz narzędzie "searchCarriers" do przeszukiwania bazy firm. Używaj go gdy użytkownik pyta o transport, przewoźnika, busy, paczki, lawetę itp.
Z pytania użytkownika wyciągaj:
- from: kraj wyjazdu (kod ISO: PL, DE, NL, BE, FR, AT, GB, SE, NO, DK)
- to: kraj docelowy (kod ISO)
- service: typ usługi (transport, paczki, laweta, przeprowadzki, transfery-lotniskowe, zwierzeta)

ZASADY ODPOWIEDZI:
1. Gdy znajdziesz przewoźników, ZAWSZE podaj linki do ich profili w formacie: [Nazwa firmy](/carrier/SLUG)
2. Wymieniaj max 4-5 firm z krótkim opisem (telefon lub kraj obsługi)
3. Odpowiadaj po polsku, krótko i przyjaźnie
4. Jeśli nic nie znaleziono — zaproponuj wyszukanie z innymi parametrami lub wejście na /search
5. Nie pytaj o województwo — ten filtr nie jest używany
6. Jeśli pytanie nie dotyczy transportu, odpowiedz krótko i zaproponuj pomoc w szukaniu przewoźnika
`

export const handleChat = async (userMessage, history = []) => {
  if (!openai) {
    throw new Error("OpenAI API key not configured")
  }

  try {
    const tools = [
      {
        type: "function",
        function: {
          name: "searchCarriers",
          description: "Wyszukaj firmy transportowe na podstawie kryteriów trasy i usługi",
          parameters: {
            type: "object",
            properties: {
              from: {
                type: "string",
                enum: ['PL', 'DE', 'NL', 'BE', 'FR', 'AT', 'GB', 'SE', 'NO', 'DK'],
                description: "Kod kraju wyjazdu"
              },
              to: {
                type: "string",
                enum: ['PL', 'DE', 'NL', 'BE', 'FR', 'AT', 'GB', 'SE', 'NO', 'DK'],
                description: "Kod kraju docelowego"
              },
              service: {
                type: "string",
                description: "Typ usługi: transport, paczki, laweta, przeprowadzki, transfery-lotniskowe, zwierzeta, autokary"
              }
            }
          }
        }
      }
    ]

    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-6), // Tylko ostatnie 6 wiadomości
      { role: "user", content: userMessage }
    ]
    
    console.log('🤖 Sending to OpenAI:', { messageCount: messages.length })

    // Timeout promise (20 sekund)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI timeout')), 20000)
    )

    const completion = await Promise.race([
      openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
        tools: tools,
        tool_choice: "auto",
        max_tokens: 300, // Ogranicz długość odpowiedzi
      }),
      timeoutPromise
    ])
    
    console.log('✅ OpenAI responded')

    const responseMessage = completion.choices[0].message

    // Sprawdź czy AI chce użyć narzędzia (wyszukiwania)
    if (responseMessage.tool_calls) {
      const toolCall = responseMessage.tool_calls[0]
      if (toolCall.function.name === "searchCarriers") {
        const args = JSON.parse(toolCall.function.arguments)
        
        // Wykonaj faktyczne wyszukiwanie w bazie MongoDB
        const carriers = await searchCarriersInDb(args)
        
        // Sformatuj wyniki dla AI
        const searchResultContent = carriers.length > 0
          ? `Znaleziono ${carriers.length} firm (podaj linki do profili w odpowiedzi):\n` +
            carriers.map(c => `- ${c.companyName} | link: /carrier/${c.slug || c._id} | tel: ${c.phone || 'brak'} | kraje: ${(c.operatingCountries || []).join(', ')}`).join('\n')
          : "Nie znaleziono żadnych firm. Zaproponuj wejście na /search z szerszymi filtrami."

        // Wyślij wyniki z powrotem do AI, żeby ułożyło odpowiedź dla człowieka
        messages.push(responseMessage)
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          name: "searchCarriers",
          content: searchResultContent
        })

        const secondResponse = await Promise.race([
          openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            max_tokens: 600,
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('OpenAI timeout')), 15000))
        ])

        return secondResponse.choices[0].message.content
      }
    }

    return responseMessage.content

  } catch (error) {
    console.error("❌ AI Error:", error.message || error)
    
    if (error.message === 'OpenAI timeout') {
      throw new Error('Chatbot nie odpowiedział w czasie. Spróbuj ponownie.')
    }
    
    if (error.status === 401) {
      throw new Error('Błąd klucza API OpenAI')
    }
    
    if (error.status === 429) {
      throw new Error('Rate limit exceeded')
    }
    
    throw new Error('Błąd komunikacji z AI')
  }
}

// Funkcja pomocnicza przeszukująca DB
async function searchCarriersInDb(args) {
  const query = { isActive: true }

  console.log("🤖 AI Search Query:", args)

  // Zbierz kraje do filtrowania (oba kierunki)
  const countryCodes = []
  if (args.from) countryCodes.push(args.from.toUpperCase())
  if (args.to) countryCodes.push(args.to.toUpperCase())

  if (countryCodes.length > 0) {
    // Usuń PL z filtrowania po operatingCountries (większość firm jest z PL)
    const foreignCodes = countryCodes.filter(c => c !== 'PL')
    if (foreignCodes.length > 0) {
      // Wymagaj wszystkich zagranicznych krajów
      query.operatingCountries = { $all: foreignCodes }
    }
  }

  if (args.service) {
    query.services = { $regex: args.service, $options: 'i' }
  }

  // Sortuj: business > premium > free, zwróć max 5
  return await Carrier.find(query)
    .select('companyName phone operatingCountries slug subscriptionPlan')
    .sort({ subscriptionPlan: -1, isPremium: -1 })
    .limit(5)
    .lean()
}
