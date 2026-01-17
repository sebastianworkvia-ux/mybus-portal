import { useState, useEffect } from 'react'
import { messageService } from '../services/services'
import { useAuthStore } from '../stores/authStore'
import { useNavigate } from 'react-router-dom'
import './MessagesPage.css'

export default function MessagesPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchConversations()
  }, [user, navigate])

  const fetchConversations = async () => {
    try {
      setLoading(true)
      const response = await messageService.getConversations()
      setConversations(response.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd ładowania konwersacji')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation) => {
    try {
      setSelectedConversation(conversation)
      const response = await messageService.getMessages(conversation.otherUser._id)
      setMessages(response.data)
      
      // Oznacz jako przeczytane
      if (conversation.unreadCount > 0) {
        await messageService.markAsRead(conversation.otherUser._id)
        // Odśwież listę konwersacji
        fetchConversations()
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd ładowania wiadomości')
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      setSending(true)
      const response = await messageService.sendMessage({
        receiverId: selectedConversation.otherUser._id,
        content: newMessage.trim()
      })
      
      setMessages([...messages, response.data])
      setNewMessage('')
      
      // Odśwież listę konwersacji (zmieni się ostatnia wiadomość)
      fetchConversations()
    } catch (err) {
      setError(err.response?.data?.error || 'Błąd wysyłania wiadomości')
    } finally {
      setSending(false)
    }
  }

  const formatDate = (date) => {
    const d = new Date(date)
    const now = new Date()
    const diff = now - d
    
    if (diff < 60000) return 'przed chwilą'
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min temu`
    if (diff < 86400000) return d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
    if (diff < 604800000) return d.toLocaleDateString('pl-PL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    return d.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="messages-page">
        <div className="container">
          <p>Ładowanie wiadomości...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="messages-page">
      <div className="container">
        <h1>📬 Wiadomości</h1>

        {error && <div className="error-banner">{error}</div>}

        <div className="messages-container">
          {/* Lista konwersacji */}
          <div className="conversations-list">
            <h2>Konwersacje</h2>
            
            {conversations.length === 0 ? (
              <div className="empty-state">
                <p>Brak wiadomości</p>
                <p className="text-muted">Wyślij wiadomość do przewoźnika aby rozpocząć rozmowę</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.conversationId}
                  className={`conversation-item ${selectedConversation?.conversationId === conv.conversationId ? 'active' : ''}`}
                  onClick={() => selectConversation(conv)}
                >
                  <div className="conversation-header">
                    <div className="conversation-user">
                      <strong>
                        {conv.otherUser.firstName} {conv.otherUser.lastName}
                      </strong>
                      {conv.unreadCount > 0 && (
                        <span className="unread-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                    <span className="conversation-time">
                      {formatDate(conv.lastMessage.createdAt)}
                    </span>
                  </div>
                  <p className="conversation-preview">
                    {conv.lastMessage.content.substring(0, 60)}
                    {conv.lastMessage.content.length > 60 ? '...' : ''}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Okno rozmowy */}
          <div className="conversation-view">
            {!selectedConversation ? (
              <div className="empty-conversation">
                <p>👈 Wybierz konwersację aby zobaczyć wiadomości</p>
              </div>
            ) : (
              <>
                <div className="conversation-header-bar">
                  <h3>
                    {selectedConversation.otherUser.firstName} {selectedConversation.otherUser.lastName}
                  </h3>
                  <p className="text-muted">{selectedConversation.otherUser.email}</p>
                </div>

                <div className="messages-list">
                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      className={`message ${msg.senderId._id === user.id ? 'sent' : 'received'}`}
                    >
                      <div className="message-bubble">
                        <p>{msg.content}</p>
                        <span className="message-time">{formatDate(msg.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Wpisz wiadomość..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={sending}
                  />
                  <button type="submit" disabled={sending || !newMessage.trim()}>
                    {sending ? '...' : '📤 Wyślij'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
