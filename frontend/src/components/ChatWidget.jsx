import { useState, useRef, useEffect } from 'react'
import apiClient from '../services/apiClient'
import './ChatWidget.css'

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! 👋 Jestem wirtualnym asystentem. Szukasz busa? Napisz skąd i dokąd chcesz jechać.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      // Wyślij tylko ostatnie interakcje jako kontekst
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      
      const res = await apiClient.post('/chat', {
        message: userMsg.content,
        history
      })

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      console.error(err)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Ups, coś poszło nie tak. Spróbuj ponownie.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      {!isOpen && (
        <button className="chat-toggle-btn" onClick={() => setIsOpen(true)}>
          💬
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span>🤖 Asystent Podróży</span>
            </div>
            <button className="chat-close-btn" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            {loading && (
              <div className="message assistant">
                <div className="message-bubble typing">...piszę</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-area" onSubmit={handleSend}>
            <input
              type="text"
              placeholder="Np. Jadę do Berlina w piątek..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading}>➤</button>
          </form>
        </div>
      )}
    </div>
  )
}
