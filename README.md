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
- **Inne:** Axios, CORS, bcryptjs
- **Encoding:** Pełna obsługa UTF-8 (polskie znaki: ąćęłńóśźż)

## Features (TODO)

- [ ] Rejestracja/logowanie użytkowników
- [ ] Panel dla przewoźników (CRUD usług)
- [ ] Wyszukiwanie przewoźników
- [ ] Filtry (kraj, typ transportu)
- [ ] System ocen/recenzji
- [ ] Profil użytkownika
