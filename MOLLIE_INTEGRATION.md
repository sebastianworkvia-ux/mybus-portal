# Integracja Mollie - Instrukcja Konfiguracji

## 🔧 Konfiguracja Backend

### 1. Zmienne środowiskowe

Dodaj następujące zmienne do pliku `backend/.env`:

```env
# Mollie API Key (test lub produkcja)
MOLLIE_API_KEY=test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# URL frontnendu (do redirectów po płatności)
FRONTEND_URL=http://localhost:5173

# URL backendu (do webhooków Mollie)
BACKEND_URL=http://localhost:5000
```

### 2. Pozyskanie klucza API Mollie

1. Zarejestruj się na [https://www.mollie.com](https://www.mollie.com)
2. Przejdź do Dashboard → Developers → API keys
3. Skopiuj **Test API key** (zaczyna się od `test_`)
4. Dla produkcji użyj **Live API key** (zaczyna się od `live_`)

⚠️ **WAŻNE**: Nigdy nie commituj klucza API do repozytorium!

### 3. Instalacja zależności

```bash
cd backend
npm install
```

Package.json już zawiera `@mollie/api-client: ^4.0.0`

### 4. Webhook URL (dla produkcji)

Mollie wymaga publicznego URL do webhooków. Podczas developmentu możesz użyć:

- **ngrok**: `ngrok http 5000` → otrzymasz publiczny URL
- **localhost.run**: `ssh -R 80:localhost:5000 localhost.run`

Webhook URL: `https://your-domain.com/payments/webhook`

W `.env` ustaw:
```env
BACKEND_URL=https://your-ngrok-url.ngrok.io
```

## 🎨 Plany cenowe

Plany są zdefiniowane w `backend/src/controllers/paymentController.js`:

```javascript
const PRICING_PLANS = {
  premium: {
    amount: 29.99,    // Cena w EUR
    duration: 30,     // Dni
    description: 'Plan Premium - 30 dni'
  },
  business: {
    amount: 49.99,
    duration: 30,
    description: 'Plan Business - 30 dni'
  }
}
```

Możesz dostosować ceny i okres ważności według potrzeb.

## 🔄 Flow płatności

### 1. Użytkownik wybiera plan
- Przechodzi na `/pricing`
- Klika "Wybierz plan" (Premium lub Business)

### 2. Tworzenie płatności
```javascript
POST /payments/create
Body: {
  planType: 'premium',
  carrierId: '...'  // opcjonalnie
}
```

Zwraca:
```javascript
{
  paymentId: 'tr_xxxxx',
  checkoutUrl: 'https://www.mollie.com/checkout/...',
  status: 'open'
}
```

### 3. Redirect do Mollie
Użytkownik jest przekierowywany na `checkoutUrl` gdzie dokonuje płatności.

### 4. Webhook od Mollie
Po zmianie statusu płatności, Mollie wywołuje:
```
POST /payments/webhook
Body: { id: 'tr_xxxxx' }
```

Backend:
- Sprawdza status w Mollie
- Aktualizuje status w bazie
- Aktywuje subskrypcję przewoźnika (jeśli paid)

### 5. Redirect powrotny
Po płatności Mollie przekierowuje na:
```
/payment/success?paymentId=tr_xxxxx
```

Frontend sprawdza status i wyświetla komunikat.

## 📊 API Endpointy

### POST /payments/create
Tworzy nową płatność. Wymaga autoryzacji.

**Request:**
```json
{
  "planType": "premium",
  "carrierId": "6581234567890abcdef12345"
}
```

**Response:**
```json
{
  "paymentId": "tr_WDqYK6vllg",
  "checkoutUrl": "https://www.mollie.com/checkout/...",
  "status": "open"
}
```

### POST /payments/webhook
Webhook od Mollie. NIE wymaga autoryzacji.

**Request:**
```json
{
  "id": "tr_WDqYK6vllg"
}
```

**Response:**
```
200 OK
```

### GET /payments/:id/status
Pobiera status płatności. Publiczny endpoint.

**Response:**
```json
{
  "paymentId": "tr_WDqYK6vllg",
  "status": "paid",
  "planType": "premium",
  "amount": 29.99,
  "currency": "EUR",
  "paidAt": "2025-12-18T12:34:56.789Z"
}
```

### GET /payments/history
Historia płatności użytkownika. Wymaga autoryzacji.

**Response:**
```json
[
  {
    "_id": "...",
    "planType": "premium",
    "amount": 29.99,
    "status": "paid",
    "paidAt": "...",
    "carrierId": { "companyName": "..." }
  }
]
```

### DELETE /payments/:id/cancel
Anuluje płatność. Wymaga autoryzacji.

## 🗄️ Baza danych

### Payment Model
```javascript
{
  userId: ObjectId,
  carrierId: ObjectId,         // opcjonalnie
  planType: 'premium',
  amount: 29.99,
  currency: 'EUR',
  status: 'paid',              // pending | paid | failed | canceled | expired
  molliePaymentId: 'tr_xxx',
  mollieCheckoutUrl: 'https://...',
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Carrier Model (zaktualizowany)
Dodane pola:
```javascript
{
  subscriptionPlan: 'premium',    // free | premium | business
  subscriptionExpiry: Date,       // data wygaśnięcia
  isPremium: true                 // true dla premium/business
}
```

## 🧪 Testowanie

### Test API Key
Użyj test key z Mollie Dashboard. Płatności z test key NIE są prawdziwe.

### Testowe karty
Mollie udostępnia testowe karty:

- **Success**: `4543 4740 0224 9996`
- **Failed**: `4100 0000 0000 0019`

### Testowanie webhooka lokalnie

1. Uruchom ngrok:
```bash
ngrok http 5000
```

2. Skopiuj URL (np. `https://abc123.ngrok.io`)

3. Ustaw w `.env`:
```env
BACKEND_URL=https://abc123.ngrok.io
```

4. Utwórz płatność - webhook będzie działał!

## 🚀 Deployment

### Zmienne środowiskowe produkcyjne

```env
MOLLIE_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://przewoznicy.com
BACKEND_URL=https://api.przewoznicy.com
```

### Webhook URL
Upewnij się, że Twój serwer jest publicznie dostępny dla Mollie.

### Bezpieczeństwo
- ✅ Webhook nie wymaga autoryzacji (Mollie nie wysyła tokenów)
- ✅ Zawsze weryfikuj status w Mollie API (nie ufaj tylko webhookowi)
- ✅ Przechowuj API key w zmiennych środowiskowych
- ✅ Używaj HTTPS w produkcji

## 📝 Rozszerzenia

### Subskrypcje automatyczne
Mollie wspiera subskrypcje (recurring payments). Można rozszerzyć o:

```javascript
const subscription = await mollieClient.customers.createSubscription(customerId, {
  amount: { value: '29.99', currency: 'EUR' },
  interval: '1 month',
  description: 'Plan Premium'
})
```

### Refunds (zwroty)
```javascript
const refund = await mollieClient.payments.refund(paymentId, {
  amount: { value: '29.99', currency: 'EUR' }
})
```

### Metody płatności
Domyślnie Mollie pokazuje wszystkie dostępne metody. Możesz ograniczyć:

```javascript
const payment = await mollieClient.payments.create({
  // ...
  methods: ['creditcard', 'paypal', 'banktransfer']
})
```

## 🔍 Debugowanie

### Logi Mollie
Dashboard → Developers → API logs - wszystkie requesty do API

### Logi aplikacji
```javascript
console.log('Płatność utworzona:', payment.id)
console.log('Status:', payment.status)
```

### Typowe problemy

1. **Webhook nie działa**
   - Sprawdź czy URL jest publiczny
   - Sprawdź logi w Mollie Dashboard
   - Dodaj console.log w handleWebhook

2. **Płatność nie aktualizuje statusu**
   - Webhook może przychodzić z opóźnieniem (do 15 min)
   - Frontend sprawdza status co 3 sekundy przez 30 sekund

3. **Błąd autoryzacji**
   - Sprawdź MOLLIE_API_KEY w .env
   - Test key zaczyna się od `test_`
   - Live key zaczyna się od `live_`

## 📚 Dokumentacja Mollie

- [Mollie API Docs](https://docs.mollie.com/)
- [Node.js Client](https://github.com/mollie/mollie-api-node)
- [Dashboard](https://www.mollie.com/dashboard)

---

**Data utworzenia**: 2025-12-18
**Autor**: GitHub Copilot
