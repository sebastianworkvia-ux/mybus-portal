/**
 * Keep-Alive dla Render.com Free Tier
 * Pinguje backend co 14 minut aby serwer nie zasnął (Render usypia po 15 min)
 */

const PING_INTERVAL = 14 * 60 * 1000 // 14 minut w milisekundach
const BACKEND_URL = import.meta.env.VITE_API_URL || '/api'

let pingTimer = null

/**
 * Wysyła "ping" do backendu aby utrzymać go aktywnym
 */
async function pingBackend() {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000) // 10s timeout
    })
    
    if (response.ok) {
      console.log('[KeepAlive] ✓ Backend ping successful')
    } else {
      console.warn('[KeepAlive] ⚠ Backend ping failed:', response.status)
    }
  } catch (error) {
    // Ignoruj błędy - czasami użytkownik może być offline
    console.log('[KeepAlive] Ping failed (może być offline):', error.message)
  }
}

/**
 * Uruchamia automatyczne pingowanie backendu
 */
export function startKeepAlive() {
  if (pingTimer) {
    console.log('[KeepAlive] Already running')
    return
  }

  console.log('[KeepAlive] Started - ping every 14 minutes')
  
  // Pierwszy ping po 30 sekundach (użytkownik prawdopodobnie już załadował stronę)
  setTimeout(pingBackend, 30000)
  
  // Następne pingi co 14 minut
  pingTimer = setInterval(pingBackend, PING_INTERVAL)
}

/**
 * Zatrzymuje automatyczne pingowanie backendu
 */
export function stopKeepAlive() {
  if (pingTimer) {
    clearInterval(pingTimer)
    pingTimer = null
    console.log('[KeepAlive] Stopped')
  }
}
