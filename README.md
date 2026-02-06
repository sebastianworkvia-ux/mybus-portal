# Przewoźnicy - Portal dla Transportowców

Portal dla polskich firm transportowych działających w Niemczech, Holandii i krajach Europy Zachodniej, gdzie mogą się ogłaszać i szukać ich Polacy mieszkający za granicą.

## Struktura Projektu

```
.
├── frontend/              # React + Vite - interfejs użytkownika
│   ├── src/
│   │   ├── components/   # Komponenty React
│   │   ├── pages/        # Strony aplikacji
│   │   ├── services/     # API calls (axios)
│   │   └── utils/        # Narzęzia pomocnicze
│   ├── package.json
│   └── vite.config.js
├── backend/               # Node.js + Express - API
│   ├── src/
│   │   ├── routes/       # Definicje ścieżek API
│   │   ├── models/       # Modele MongoDB
│   │   ├── controllers/  # Logika biznesowa
│   │   └── middleware/   # Middleware (auth, validation)
│   ├── package.json
│   └── .env.example
└── .github/
    └── copilot-instructions.md
```

## Wymagania

- Node.js 18+
- MongoDB (lokalnie lub Atlas)
- npm lub yarn

## Instalacja i Uruchomienie

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edytuj .env i dodaj MongoDB URI
npm run dev
```

Backend uruchomi się na `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend uruchomi się na `http://localhost:5173`

## Technologie

- **Frontend:** React 18, Vite, Zustand (state management)
- **Backend:** Express.js, MongoDB/Mongoose, JWT
- **Płatności:** Mollie API (EUR)
- **AI Chatbot:** OpenAI GPT-3.5-turbo (opcjonalne)
- **Inne:** Axios, CORS, bcryptjs
- **Encoding:** Pełna obsługa UTF-8 (polskie znaki: ąćęłńóśźż)

## Features (TODO)

- [x] Rejestracja/logowanie użytkowników
- [x] Panel dla przewoźników (CRUD usług)
- [x] Wyszukiwanie przewoźników
- [x] Filtry (kraj, typ transportu, województwo)
- [x] System ocen/recenzji
- [x] Profil użytkownika
- [x] Płatności Premium (Mollie)
- [x] AI Chatbot (OpenAI) - wymaga konfiguracji klucza API
- [x] Analytics i statystyki
- [x] Panel administracyjny

## 🤖 Chatbot AI

Portal zawiera inteligentnego asystenta AI, który pomaga użytkownikom znaleźć odpowiedniego przewoźnika.

### Konfiguracja (opcjonalna)

1. **Uzyskaj klucz OpenAI**: https://platform.openai.com/api-keys
2. **Dodaj do `.env`**:
   ```env
   OPENAI_API_KEY=sk-proj-twoj-klucz-tutaj
   ```
3. **Test połączenia**:
   ```bash
   node test-openai.js
   ```

### Koszty

- Nowi użytkownicy OpenAI: **5 USD darmowego kredytu**
- Model GPT-3.5-turbo: **~$0.002 za 1000 tokenów**
- Średnia rozmowa: **~500 tokenów** (~$0.001/rozmowa)

**Bez klucza API chatbot jest automatycznie wyłączony** (bezpieczny fallback).

📖 **Szczegóły**: Zobacz [CHATBOT_FIX.md](CHATBOT_FIX.md)

## 📚 Dokumentacja

- [DEPLOYMENT.md](DEPLOYMENT.md) - Jak wdrożyć na Render + Vercel
- [RENDER_ENV_SETUP.md](RENDER_ENV_SETUP.md) - Konfiguracja zmiennych środowiskowych
- [MOLLIE_INTEGRATION.md](MOLLIE_INTEGRATION.md) - Integracja płatności
- [CHATBOT_FIX.md](CHATBOT_FIX.md) - Naprawa chatbota AI
- [RECAPTCHA_SETUP.md](RECAPTCHA_SETUP.md) - Ochrona przed botami
- [UTF8_FIX.md](UTF8_FIX.md) - Naprawy polskich znaków
