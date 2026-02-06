# 🔧 Konfiguracja zmiennych środowiskowych na Render.com

## ⚠️ WAŻNE - Sprawdź te zmienne!

Aby płatności Mollie i chatbot AI działały na produkcji, musisz ustawić następujące zmienne środowiskowe na Render.com:

### Instrukcja krok po kroku:

1. **Wejdź na https://dashboard.render.com**
2. **Kliknij na swój backend service** (mybus-backend)
3. **Przejdź do zakładki "Environment"**
4. **Sprawdź czy masz ustawione:**

```env
MOLLIE_API_KEY=test_Jcz6NMzzwRnK9FnUvSu9gQR28sed5d
FRONTEND_URL=https://my-bus.eu
BACKEND_URL=https://mybus-backend-aygc.onrender.com
MONGODB_URI=mongodb+srv://... (twój connection string)
JWT_SECRET=... (twój secret)
CORS_ORIGIN=https://my-bus.eu
NODE_ENV=production
OPENAI_API_KEY=sk-proj-... (twój klucz OpenAI)
```

### ❗ Jeśli brakuje którejś zmiennej:

1. Kliknij **"Add Environment Variable"**
2. Wpisz **Key** (np. `MOLLIE_API_KEY` lub `OPENAI_API_KEY`)
3. Wpisz **Value** (np. `test_Jcz6NMzzwRnK9FnUvSu9gQR28sed5d` lub `sk-proj-...`)
4. Kliknij **"Save Changes"**
5. **Backend automatycznie się zrestartuje** (займе ~2 minuty)

### 🤖 OPENAI_API_KEY - Jak uzyskać klucz:

**Chatbot AI wymaga klucza OpenAI API do działania!**

1. **Wejdź na**: https://platform.openai.com/signup
2. **Zarejestruj się** lub zaloguj (możesz użyć konta Google/Microsoft)
3. **Przejdź do**: https://platform.openai.com/api-keys
4. **Kliknij**: "Create new secret key"
5. **Nazwa**: "MyBus Chatbot"
6. **Permissions**: "All" (lub tylko "Model capabilities")
7. **Skopiuj klucz** (zaczyna się od `sk-proj-...`) - **ZAPISZ GO! Nie zobaczysz go ponownie**
8. **Dodaj klucz do Render**:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-proj-...` (wklej skopiowany klucz)

**💰 Koszty:**
- Nowi użytkownicy: **5$ darmowego kredytu** (wystarcza na ~2000-5000 rozmów z chatbotem)
- Model: gpt-3.5-turbo (~$0.002 za 1000 tokenów)
- Po wykorzystaniu kredytu musisz dodać kartę i płacić za użycie

**Alternatywa:** Jeśli nie chcesz korzystać z OpenAI, chatbot będzie wyłączony (bezpieczny fallback w kodzie)

### 🧪 Test lokalny przed produkcją:

Jeśli chcesz przetestować lokalnie:

```bash
# W folderze backend
cd backend
cp .env.production.example .env

# Edytuj .env i ustaw swoje wartości
# Uruchom backend
npm run dev
```

### 📝 Ważne uwagi:

- **MOLLIE_API_KEY**: Aktualnie używamy klucza testowego (`test_...`)
  - Do prawdziwych płatności musisz zmienić na klucz produkcyjny z Mollie dashboard
- **FRONTEND_URL**: Musi być dokładnie `https://my-bus.eu` (bez trailing slash)
- **BACKEND_URL**: Musi być dokładnie `https://mybus-backend-aygc.onrender.com` (bez trailing slash)

### 🔍 Jak sprawdzić czy działa:

**Płatności Mollie:**
1. Otwórz https://my-bus.eu i zaloguj się
2. Przejdź do Dashboard
3. Otwórz konsolę przeglądarki (F12)
4. Kliknij "Przejdź na Premium"
5. W konsoli powinny pojawić się logi:
   ```
   🚀 Rozpoczynam proces płatności Premium...
   ✅ Odpowiedź z serwera: { checkoutUrl: "https://www.mollie.com/...", ... }
   🔄 Przekierowanie do: https://www.mollie.com/...
   ```

**Chatbot AI:**
1. Otwórz https://my-bus.eu
2. Kliknij ikonę czatu (💬) w prawym dolnym rogu
3. Napisz: "Szukam busa z Warszawy do Berlina w piątek"
4. **Jeśli OPENAI_API_KEY jest ustawiony**: Chatbot odpowie i znajdzie przewoźników
5. **Jeśli BRAK klucza**: Zobaczysz: "Przepraszam, asystent jest tymczasowo niedostępny (błąd konfiguracji serwera)."

### ❌ Jeśli nie działa:

**Sprawdź w konsoli przeglądarki (F12):**
- **Błąd 500** przy płatności - Problem z backendem (brak MOLLIE_API_KEY)
- **Błąd 500** przy czacie - Prawdopodobnie brak OPENAI_API_KEY
- **Błąd 401** - Problem z tokenem JWT
- **Błąd CORS** - Problem z CORS_ORIGIN

**Sprawdź logi backendu na Render.com:**
1. Wejdź na dashboard.render.com
2. Kliknij na swój backend service
3. Zakładka "Logs"
4. Szukaj błędów:
   - `⚠️ OPENAI_API_KEY is missing` - **CHATBOT NIE DZIAŁA** - Dodaj klucz OpenAI
   - `Failed to initialize OpenAI:` - Nieprawidłowy klucz API
   - `MOLLIE_API_KEY` errors - Problem z płatnościami
   - `AI Error:` - Błędy podczas rozmowy z chatbotem

**Typowe problemy z chatbotem:**
1. **"Asystent jest tymczasowo niedostępny"** → Brak OPENAI_API_KEY
2. **Chat się zawiesza przy odpowiedzi** → Sprawdź logi Render (może limit OpenAI?)
3. **Chatbot odpowiada błędnie** → Model GPT-3.5-turbo może potrzebować lepszego promptu
4. **Timeout errors** → OpenAI API może być przeciążone - spróbuj ponownie
