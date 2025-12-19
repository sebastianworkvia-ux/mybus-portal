// Session tracking utility - generates and manages unique session IDs
// Prevents page refreshes from being counted as separate visits

export function getSessionId() {
  const SESSION_KEY = 'analytics_session_id'
  
  // Try to get existing session ID from localStorage
  let sessionId = localStorage.getItem(SESSION_KEY)
  
  // If no session ID exists, generate a new one
  if (!sessionId) {
    sessionId = generateUUID()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  
  return sessionId
}

// Generate a simple UUID v4
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Track page view - call this on every page load/navigation
export async function trackPageView(url) {
  try {
    const sessionId = getSessionId()
    const userAgent = navigator.userAgent
    const referrer = document.referrer
    
    // Don't track admin pages
    if (url.includes('/admin')) {
      return
    }
    
    // Send to backend
    await fetch('/api/analytics/track-view', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url,
        sessionId,
        userAgent,
        referrer
      })
    })
    
    // Don't throw error if tracking fails - fail silently
  } catch (error) {
    console.debug('Analytics tracking failed (non-critical):', error.message)
  }
}

// Clear session (call on logout if you want to count next visit as new session)
export function clearSession() {
  const SESSION_KEY = 'analytics_session_id'
  localStorage.removeItem(SESSION_KEY)
}
