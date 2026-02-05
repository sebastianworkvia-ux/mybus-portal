import express from 'express'
import { handleChat } from '../services/aiService.js'

const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { message, history } = req.body
    
    // Prosta walidacja (np. max 10 wiadomości historii)
    const recentHistory = history ? history.slice(-6) : []
    
    const response = await handleChat(message, recentHistory)
    res.json({ reply: response })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'AI processing failed' })
  }
})

export default router
