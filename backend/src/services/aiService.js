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
Jesteś wirtualnym asystentem portalu transportowego "Przewoźnicy".
Twoim celem jest pomóc użytkownikom znaleźć odpowiedniego przewoźnika.

Masz do dyspozycji narzędzie "searchCarriers", które pozwala przeszukiwać bazę firm.
Jeśli użytkownik pyta o transport, ZAWSZE używaj tego narzędzia, wyciągając z jego pytania parametry:
- from: kraj wyjazdu (kod ISO: PL, DE, NL, BE, FR, AT, GB, SE, NO, DK)
- to: kraj docelowy (kod ISO)
- voivodeship: województwo (jeśli podano polskie miasto lub region)
- date: dzień tygodnia (poniedziałek, wtorek...)

Jeśli nie jesteś pewien parametrów, dopytaj użytkownika.
Odpowiadaj krótko, konkretnie i pomocnie.
Gdy znajdziesz przewoźników, wymień ich nazwy i zaproponuj sprawdzenie ich profili.
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
          description: "Wyszukaj firmy transportowe na podstawie kryteriów",
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
                description: "Typ usługi np. transport (osoby), paczki, laweta"
              },
              voivodeship: {
                type: "string",
                description: "Polskie województwo (np. Mazowieckie)"
              },
              day: {
                type: "string",
                description: "Dzień tygodnia"
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
          ? `Znaleziono ${carriers.length} firm: ${carriers.map(c => `${c.companyName} (Tel: ${c.phone})`).join(", ")}`
          : "Nie znaleziono żadnych firm spełniających te kryteria."

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
            max_tokens: 300,
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

  if (args.from && args.from !== 'PL') {
    query.operatingCountries = args.from
  }
  if (args.to && args.to !== 'PL') {
    query.operatingCountries = args.to
  }
  
  // Jeśli z Polski, spróbujmy dopasować województwo
  if (args.voivodeship) {
    // Proste dopasowanie (case insensitive regex)
    query.servedVoivodeships = { $regex: args.voivodeship, $options: 'i' }
  }

  if (args.service) {
     query.services = { $regex: args.service, $options: 'i' }
  }

  // Wyszukaj i zwróć max 5 wyników (żeby nie przeładować kontekstu AI)
  return await Carrier.find(query)
    .select('companyName phone servedVoivodeships operatingCountries')
    .sort('-isPremium')
    .limit(5)
    .lean()
}
