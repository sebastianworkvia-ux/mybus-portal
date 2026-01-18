# Google reCAPTCHA Setup - Przewoźnicy

## 📋 Instrukcja konfiguracji

Aplikacja wymaga kluczy Google reCAPTCHA v2 do zabezpieczenia przed botami podczas rejestracji.

### 1. Uzyskanie kluczy reCAPTCHA

1. Przejdź na: https://www.google.com/recaptcha/admin/create
2. Zaloguj się na konto Google
3. Wypełnij formularz:
   - **Label**: Przewoźnicy - my-bus.eu
   - **reCAPTCHA type**: ✅ reCAPTCHA v2 → "I'm not a robot" Checkbox
   - **Domains**: 
     - `my-bus.eu`
     - `mybus-portal-4v5v.vercel.app`
     - `localhost` (tylko dla developmentu)
4. Kliknij **Submit**
5. Skopiuj oba klucze:
   - **Site Key** (klucz publiczny) - dla frontendu
   - **Secret Key** (klucz tajny) - dla backendu

### 2. Konfiguracja Frontendu (Vercel)

#### W pliku `RegisterPage.jsx` (JUŻ SKONFIGUROWANE):
```jsx
<ReCAPTCHA
  sitekey="TWÓJ_SITE_KEY_TUTAJ"  // <-- Zamień na swój klucz
  onChange={(token) => setRecaptchaToken(token)}
/>
```

**Aktualna wartość testowa**: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`  
⚠️ **TO JEST KLUCZ TESTOWY GOOGLE** - działa tylko lokalnie, **NIE NA PRODUKCJI**

**KROK DO WYKONANIA**:
1. Otwórz `frontend/src/pages/RegisterPage.jsx`
2. Znajdź linię 144: `sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"`
3. Zamień na swój **Site Key** z Google reCAPTCHA
4. Commit i push

### 3. Konfiguracja Backendu (Render)

#### Dodaj zmienną środowiskową na Render:

1. Wejdź na: https://dashboard.render.com
2. Wybierz swój backend service: **mybus-backend-aygc**
3. Przejdź do **Environment** → **Add Environment Variable**
4. Dodaj:
   ```
   Key:   RECAPTCHA_SECRET_KEY
   Value: TWÓJ_SECRET_KEY_TUTAJ
   ```
5. Kliknij **Save Changes**
6. Backend zrestartuje się automatycznie

**Aktualna wartość testowa**: `6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe`  
⚠️ **TO JEST KLUCZ TESTOWY GOOGLE** - działa tylko lokalnie, **NIE NA PRODUKCJI**

### 4. Development (lokalne testowanie)

Podczas developmentu możesz używać kluczy testowych Google:

#### Frontend `.env` (opcjonalnie):
```env
VITE_RECAPTCHA_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI
```

#### Backend `.env`:
```env
RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe
```

**Uwaga**: Klucze testowe zawsze zwracają sukces, więc NIE CHRONIĄ przed botami na produkcji!

---

## 🔒 Jak działa zabezpieczenie

### Frontend (RegisterPage.jsx)
1. Użytkownik wypełnia formularz rejestracji
2. Musi zaznaczyć checkbox "I'm not a robot"
3. Google weryfikuje czy to człowiek (analiza zachowania, kliknięcia, ruchy myszy)
4. Zwraca jednorazowy token
5. Token wysyłany do backendu w `req.body.recaptchaToken`

### Backend (authController.js)
1. Odbiera token z frontendu
2. Wysyła request do Google API: `https://www.google.com/recaptcha/api/siteverify`
3. Google odpowiada `{ success: true/false }`
4. Jeśli `false` → rejestracja odrzucona (prawdopodobnie bot)
5. Jeśli `true` → rejestracja kontynuowana

---

## ✅ Checklist wdrożenia

- [ ] Utworzono konto reCAPTCHA na google.com/recaptcha
- [ ] Dodano domeny: my-bus.eu, vercel app, localhost
- [ ] Skopiowano **Site Key** i **Secret Key**
- [ ] Zaktualizowano `RegisterPage.jsx` linię 144 (Site Key)
- [ ] Dodano `RECAPTCHA_SECRET_KEY` w Render Environment Variables
- [ ] Przetestowano rejestrację na localhost
- [ ] Przetestowano rejestrację na my-bus.eu
- [ ] Usunięto klucze testowe po wdrożeniu produkcyjnych

---

## 🐛 Troubleshooting

### "ERROR for site owner: Invalid site key"
- Sprawdź czy **Site Key** jest poprawny
- Sprawdź czy domena (np. my-bus.eu) jest dodana w ustawieniach reCAPTCHA

### "reCAPTCHA verification failed"
- Sprawdź czy **Secret Key** jest poprawny w Render
- Sprawdź logi backendu na Render: **Logs** tab
- Sprawdź czy backend ma dostęp do internetu (firewall)

### Checkbox nie pojawia się
- Sprawdź Console w przeglądarce (F12)
- Upewnij się że `react-google-recaptcha` jest zainstalowany
- Sprawdź czy Site Key nie ma spacji/literówek

### "reCAPTCHA verification required"
- Frontend nie wysyła tokenu
- Sprawdź Network tab (F12) → POST /api/auth/register
- Token powinien być w body: `{ recaptchaToken: "03..." }`

---

**Data ostatniej aktualizacji**: 2026-01-18
