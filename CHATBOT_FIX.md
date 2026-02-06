# 🤖 Naprawa Chatbota AI - Instrukcja krok po kroku

## ❗ Problem: Chat się zawiesza przy udzielaniu odpowiedzi

### Przyczyna:
Backend nie ma ustawionego klucza **OPENAI_API_KEY**, przez co chatbot nie może połączyć się z OpenAI API.

---

## ✅ ROZWIĄZANIE - Dodaj OPENAI_API_KEY do Render

### Krok 1: Uzyskaj klucz OpenAI API

1. **Wejdź na**: https://platform.openai.com/signup
2. **Zarejestruj się** lub zaloguj (możesz użyć konta Google/Microsoft)
3. **Przejdź do API Keys**: https://platform.openai.com/api-keys
4. **Kliknij**: "Create new secret key"
5. **Wypełnij formularz**:
   - Name: `MyBus Chatbot`
   - Permissions: `All` (lub tylko `Model capabilities`)
6. **Kliknij**: "Create secret key"
7. **SKOPIUJ KLUCZ** (zaczyna się od `sk-proj-...`)
   - ⚠️ **WAŻNE**: Zapisz go gdzieś bezpiecznie - nie zobaczysz go ponownie!

### Krok 2: Dodaj klucz do Render.com

1. **Wejdź na**: https://dashboard.render.com
2. **Znajdź swój backend service** (mybus-backend lub podobny)
3. **Kliknij na nazwę serwisu**
4. **Przejdź do zakładki**: "Environment"
5. **Kliknij**: "Add Environment Variable"
6. **Wypełnij**:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `sk-proj-...` (wklej skopiowany klucz)
7. **Kliknij**: "Save Changes"
8. **Poczekaj 2-3 minuty** - Render automatycznie zrestartuje backend

### Krok 3: Sprawdź czy działa

1. **Otwórz stronę**: https://my-bus.eu
2. **Kliknij ikonę czatu** (💬) w prawym dolnym rogu
3. **Napisz testową wiadomość**: "Szukam busa z Warszawy do Berlina w piątek"
4. **Sprawdź odpowiedź**:
   - ✅ **Działa**: Chatbot odpowiada i szuka przewoźników
   - ❌ **Nie działa**: Zobacz sekcję "Diagnostyka" poniżej

---

## 🔍 Diagnostyka problemów

### Problem 1: "Asystent jest tymczasowo niedostępny (błąd konfiguracji serwera)"

**Przyczyna**: Brak OPENAI_API_KEY lub nieprawidłowy klucz

**Rozwiązanie**:
1. Sprawdź logi Render:
   - https://dashboard.render.com → Twój service → Logs
   - Szukaj: `⚠️ OPENAI_API_KEY is missing`
2. Jeśli widzisz ten błąd - dodaj klucz (Krok 2 powyżej)
3. Jeśli klucz jest dodany, sprawdź czy jest prawidłowy:
   - Klucz musi zaczynać się od `sk-proj-` (nowe API keys)
   - Lub `sk-` (stare API keys)

### Problem 2: Chat się zawiesza (kółko ładowania bez końca)

**Przyczyny**:
- Timeout połączenia z OpenAI (sieć przeciążona)
- Limit rate dla darmowego konta OpenAI
- Błąd w logice backendu

**Rozwiązanie**:
1. **Sprawdź logi Render** (powinny pokazać konkretny błąd):
   ```
   AI Error: Rate limit exceeded
   AI Error: Timeout
   ```
2. **Jeśli "Rate limit exceeded"**:
   - Zużyłeś darmowy limit OpenAI
   - Dodaj kartę kredytową na https://platform.openai.com/account/billing
   - Lub poczekaj (limity resetują się co minutę/godzinę)
3. **Jeśli "Timeout"**:
   - Po prostu spróbuj ponownie
   - OpenAI może być tymczasowo przeciążone

### Problem 3: Chatbot odpowiada dziwnie lub nie znajduje przewoźników

**Przyczyna**: Model AI może źle interpretować pytania

**Rozwiązanie**:
1. Pisz bardziej konkretnie:
   - ✅ "Szukam busa z Warszawy do Berlina w piątek"
   - ❌ "Potrzebuję transportu"
2. Podaj kraj używając kodów:
   - Niemcy = DE
   - Holandia = NL
   - Belgia = BE
3. Sprawdź czy w bazie są przewoźnicy na tej trasie

---

## 💰 Koszty OpenAI

### Darmowy kredyt:
- Nowi użytkownicy: **5 USD** darmowego kredytu
- Wystarczy na: **~2000-5000 rozmów** z chatbotem

### Po wykorzystaniu kredytu:
- Model: **gpt-3.5-turbo**
- Koszt: **~$0.002 za 1000 tokenów** (~$0.50 za 1000 rozmów)
- Średnia rozmowa: ~500-1000 tokenów
- Musisz dodać kartę kredytową

### Monitorowanie zużycia:
1. Wejdź na: https://platform.openai.com/usage
2. Zobacz ile kredytu zostało
3. Ustaw limity wydatków (np. $10/miesiąc)

---

## 🔧 Kompletna lista zmiennych dla Render

Upewnij się, że masz **WSZYSTKIE** te zmienne w Environment settings:

```env
# Baza danych
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/przewoznicy

# Bezpieczeństwo
JWT_SECRET=twoj-losowy-secret-64-znaki
CORS_ORIGIN=https://my-bus.eu

# Płatności
MOLLIE_API_KEY=test_Jcz6NMzzwRnK9FnUvSu9gQR28sed5d
FRONTEND_URL=https://my-bus.eu
BACKEND_URL=https://mybus-backend-aygc.onrender.com

# Chatbot AI ⭐ NOWE!
OPENAI_API_KEY=sk-proj-TWOJ-KLUCZ-TUTAJ

# Inne
NODE_ENV=production
PORT=5000
```

---

## 🚨 Alternatywa: Wyłącz chatbot

Jeśli nie chcesz korzystać z OpenAI (lub nie chcesz płacić), chatbot ma bezpieczny fallback:

**Po prostu nie dodawaj OPENAI_API_KEY** - użytkownicy zobaczą:
> "Przepraszam, asystent jest tymczasowo niedostępny (błąd konfiguracji serwera)."

Możesz też **usunąć widget czatu** z frontendu:
1. Otwórz: `frontend/src/App.jsx`
2. Znajdź: `<ChatWidget />`
3. Usuń tę linię
4. Deploy frontend na nowo

---

## 📞 Wsparcie

Jeśli dalej nie działa:
1. Sprawdź logi Render szczegółowo
2. Przetestuj endpoint `/api/chat` bezpośrednio (Postman/curl)
3. Sprawdź czy inne funkcje backendu działają

**Test ręczny przez Postman:**
```http
POST https://mybus-backend-aygc.onrender.com/api/chat
Content-Type: application/json

{
  "message": "Szukam busa do Berlina",
  "history": []
}
```

Powinno zwrócić:
```json
{
  "reply": "Znalazłem przewoźników..."
}
```

Jeśli zwraca 500 - sprawdź logi!
