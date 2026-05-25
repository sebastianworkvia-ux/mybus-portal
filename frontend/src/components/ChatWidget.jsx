import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import apiClient from '../services/apiClient'
import { useChatStore } from '../stores/chatStore'
import './ChatWidget.css'

// Parsuje markdown linki i nowe linie w odpowiedziach asystenta
function renderAssistantMessage(content) {
  // Zamień [tekst](/sciezka) na klikalne linki (wewnętrzne)
  const withLinks = content.replace(
    /\[([^\]]+)\]\((\/?[^)]+)\)/g,
    (match, text, url) => {
      const isExternal = url.startsWith('http')
      if (isExternal) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${text}</a>`
      }
      return `<a href="${url}" class="chat-link chat-link-internal" data-href="${url}">${text}</a>`
    }
  )
  // Zamień **tekst** na bold
  const withBold = withLinks.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  // Zamień nowe linie na <br>
  const withBreaks = withBold.replace(/\n/g, '<br>')
  return withBreaks
}

export default function ChatWidget() {
  const { isOpen, closeChat } = useChatStore()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Cześć! 👋 Jestem BusBot. Szukasz przewoźnika? Napisz skąd i dokąd chcesz jechać.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)

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
      
      console.log('🤖 Sending chat request to:', apiClient.defaults.baseURL + '/chat')
      
      const res = await apiClient.post('/chat', {
        message: userMsg.content,
        history
      })
      
      console.log('✅ Chat response:', res.data)

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch (err) {
      console.error('❌ Chat error:', err)
      
      // Wyświetl szczegółowy komunikat błędu
      let errorMessage = 'Ups, coś poszło nie tak. Spróbuj ponownie.'
      
      if (err.response?.status === 429) {
        errorMessage = 'Zbyt wiele żądań. Poczekaj chwilę i spróbuj ponownie.'
      } else if (err.response?.status === 500) {
        errorMessage = err.response?.data?.error || 'Błąd serwera. Chatbot może być tymczasowo niedostępny.'
      } else if (!navigator.onLine) {
        errorMessage = 'Brak połączenia z internetem. Sprawdź swoje połączenie.'
      }
      
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`chat-widget ${isOpen ? 'open' : ''}`}>
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-title">
              <span>🚌 BusBot</span>
            </div>
            <button className="chat-close-btn" onClick={closeChat}>✕</button>
          </div>

          <div className="chat-messages" ref={messagesContainerRef} onClick={(e) => {
              // Obsługa kliknięć w wewnętrzne linki chatbota
              const link = e.target.closest('.chat-link-internal')
              if (link) {
                e.preventDefault()
                const href = link.getAttribute('data-href')
                if (href) {
                  closeChat()
                  navigate(href)
                }
              }
            }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.role}`}>
                {msg.role === 'assistant' ? (
                  <div
                    className="message-bubble"
                    dangerouslySetInnerHTML={{ __html: renderAssistantMessage(msg.content) }}
                  />
                ) : (
                  <div className="message-bubble">{msg.content}</div>
                )}
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
