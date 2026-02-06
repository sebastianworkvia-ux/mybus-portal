# 🧪 Testy lokalne - Chatbot AI

## Test 1: Sprawdź czy OpenAI API działa

```bash
node test-openai.js
```

**Oczekiwany wynik:**
```
🧪 Test połączenia z OpenAI API

✅ OPENAI_API_KEY znaleziony: sk-proj-xxxxxxxxx...
🔄 Łączenie z OpenAI API...
✅ Klient OpenAI utworzony pomyślnie
🤖 Wysyłam testową wiadomość do GPT-3.5-turbo...
✅ Odpowiedź otrzymana!
📝 GPT-3.5: Działa!
💰 Użyte tokeny: 25
💵 Koszt (~$0.002 za 1000 tokenów): 0.000050 USD

✨ SUKCES! OpenAI API działa prawidłowo.
```

**Jeśli błąd:**
- `❌ BŁĄD: Brak OPENAI_API_KEY` → Dodaj klucz do `backend/.env`
- `401 Unauthorized` → Klucz jest nieprawidłowy
- `429 Rate limit` → Zbyt wiele requestów, poczekaj

---

## Test 2: Test backendu lokalnie

```bash
cd backend
npm run dev
```

**W drugim terminalu:**
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Szukam busa do Berlina", "history": []}'
```

**Oczekiwany wynik:**
```json
{
  "reply": "Szukasz transportu do Berlina! Mogę pomóc znaleźć odpowiedniego przewoźnika..."
}
```

---

## Test 3: Test przez Postman

1. **Otwórz Postman**
2. **Nowy request**:
   - Method: `POST`
   - URL: `http://localhost:5000/api/chat`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {
       "message": "Jadę z Warszawy do Berlina w piątek",
       "history": []
     }
     ```
3. **Send**

**Oczekiwana odpowiedź (200 OK):**
```json
{
  "reply": "Znalazłem przewoźników na trasie Warszawa-Berlin..."
}
```

---

## Test 4: Test frontendu lokalnie

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

1. Otwórz http://localhost:5173
2. Kliknij ikonę czatu (💬)
3. Napisz: "Szukam busa do Berlina"
4. Sprawdź odpowiedź

**Sprawdź w konsoli przeglądarki (F12):**
```
POST http://localhost:5173/api/chat 200 OK
```

---

## Test 5: Test produkcyjny na Render

**Przed testem upewnij się że:**
- Backend jest wdrożony na Render
- OPENAI_API_KEY jest dodany do Environment variables
- Service został zrestartowany (2-3 minuty)

**Test:**
```bash
curl -X POST https://mybus-backend-aygc.onrender.com/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Test", "history": []}'
```

**Oczekiwany wynik:**
```json
{
  "reply": "Cześć! Jak mogę Ci pomóc..."
}
```

**Jeśli błąd 500:**
- Sprawdź logi Render: https://dashboard.render.com → Service → Logs
- Szukaj: `OPENAI_API_KEY is missing`

---

## 🐛 Debugowanie

### Włącz szczegółowe logi w backendzie:

Edytuj `backend/src/services/aiService.js`:

```javascript
export const handleChat = async (userMessage, history = []) => {
  console.log('📩 Incoming message:', userMessage)
  console.log('📜 History length:', history.length)
  
  if (!openai) {
    console.error('❌ OpenAI client not initialized!')
    return "Przepraszam, asystent jest tymczasowo niedostępny (błąd konfiguracji serwera)."
  }

  try {
    console.log('🤖 Calling OpenAI API...')
    const completion = await openai.chat.completions.create({...})
    console.log('✅ OpenAI response received')
    console.log('💬 Reply:', completion.choices[0].message.content)
    
    // ... reszta kodu
  } catch (error) {
    console.error("❌ AI Error:", error.message)
    console.error("Full error:", error)
    // ...
  }
}
```

### Sprawdź logi w czasie rzeczywistym (Render):

```bash
# Otwórz dashboard.render.com
# → Twój service → Logs
# → Szukaj logów z emoji (📩, 🤖, ✅, ❌)
```

---

## ✅ Checklist przed wdrożeniem:

- [ ] `test-openai.js` działa lokalnie
- [ ] Backend odpowiada na `/api/chat` (localhost)
- [ ] Frontend pokazuje chatbota (localhost)
- [ ] Chatbot odpowiada lokalnie
- [ ] OPENAI_API_KEY dodany do Render
- [ ] Backend zrestartowany na Render
- [ ] Test curl na produkcji działa
- [ ] Chatbot działa na https://my-bus.eu

---

## 📊 Monitoring zużycia OpenAI:

https://platform.openai.com/usage

- Zobacz ile kredytu zostało
- Ustaw limity ($10/miesiąc recommended)
- Sprawdź historię użycia
