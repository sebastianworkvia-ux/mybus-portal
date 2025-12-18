# 🔧 Konfiguracja zmiennych środowiskowych na Render.com

## ⚠️ WAŻNE - Sprawdź te zmienne!

Aby płatności Mollie działały na produkcji, musisz ustawić następujące zmienne środowiskowe na Render.com:

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
```

### ❗ Jeśli brakuje którejś zmiennej:

1. Kliknij **"Add Environment Variable"**
2. Wpisz **Key** (np. `MOLLIE_API_KEY`)
3. Wpisz **Value** (np. `test_Jcz6NMzzwRnK9FnUvSu9gQR28sed5d`)
4. Kliknij **"Save Changes"**
5. **Backend automatycznie się zrestartuje** (займе ~2 minuty)

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

### ❌ Jeśli nie działa:

Sprawdź w konsoli przeglądarki:
- **Błąd 500** - Problem z backendem (brak MOLLIE_API_KEY)
- **Błąd 401** - Problem z tokenem JWT
- **Błąd CORS** - Problem z CORS_ORIGIN

Sprawdź logi backendu na Render.com:
- Wejdź na dashboard.render.com
- Kliknij na swój backend service
- Zakładka "Logs"
- Szukaj błędów związanych z "MOLLIE_API_KEY" lub "payments"
