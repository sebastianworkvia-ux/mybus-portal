import express from 'express'
import { handleChat } from '../services/aiService.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body
    
    // Walidacja
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Wiadomość jest wymagana' })
    }
    
    // Prosta walidacja (np. max 10 wiadomości historii)
    const recentHistory = history ? history.slice(-6) : []
    
    const response = await handleChat(message, recentHistory)
    res.json({ reply: response })
  } catch (error) {
    console.error('❌ Chat Error:', error)
    
    // Bardziej szczegółowe błędy dla diagnostyki
    if (error.message?.includes('API key')) {
      res.status(500).json({ 
        error: 'Chatbot wymaga konfiguracji klucza OpenAI. Skontaktuj się z administratorem.' 
      })
    } else if (error.message?.includes('Rate limit')) {
      res.status(429).json({ 
        error: 'Zbyt wiele żądań do chatbota. Spróbuj ponownie za chwilę.' 
      })
    } else {
      res.status(500).json({ error: 'Błąd przetwarzania wiadomości. Spróbuj ponownie.' })
    }
  }
})

export default router
