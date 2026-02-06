# ⚡ SZYBKA NAPRAWA - Chatbot się zawiesza

## Problem: Chat nie odpowiada / zawiesza się

### ✅ ROZWIĄZANIE W 3 KROKACH:

```
┌─────────────────────────────────────────────────────────┐
│  KROK 1: Uzyskaj klucz OpenAI                          │
│  https://platform.openai.com/api-keys                   │
│  → "Create new secret key"                              │
│  → Skopiuj: sk-proj-xxxxxxxxxxxxxxxxxxxxx               │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│  KROK 2: Dodaj do Render                                │
│  https://dashboard.render.com                           │
│  → Twój backend service → Environment                   │
│  → Add Environment Variable:                            │
│    Key:   OPENAI_API_KEY                                │
│    Value: sk-proj-xxxxxxxxxxxxxxxxxxxxx                 │
│  → Save Changes                                         │
└─────────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────────┐
│  KROK 3: Poczekaj 2-3 minuty                           │
│  Render automatycznie zrestartuje backend               │
│  → Otwórz https://my-bus.eu                            │
│  → Kliknij ikonę czatu 💬                              │
│  → Napisz: "Szukam busa do Berlina"                    │
│  → Powinno działać! ✅                                  │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Sprawdź czy działa:

### ✅ DZIAŁA:
```
Ty: "Szukam busa z Warszawy do Berlina"
Bot: "Znalazłem 3 firmy: TransBus (Tel: +48...), ..."
```

### ❌ NIE DZIAŁA:
```
Bot: "Przepraszam, asystent jest tymczasowo niedostępny"
→ Sprawdź logi Render (szukaj: "OPENAI_API_KEY is missing")
```

---

## 💡 Kompletna lista zmiennych dla Render:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/przewoznicy
JWT_SECRET=twoj-secret
CORS_ORIGIN=https://my-bus.eu
MOLLIE_API_KEY=test_Jcz6NMzzwRnK9FnUvSu9gQR28sed5d
FRONTEND_URL=https://my-bus.eu
BACKEND_URL=https://mybus-backend-aygc.onrender.com
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxx  ⬅️ TO JEST NOWE!
NODE_ENV=production
```

---

## 📖 Więcej info:

- **Szczegółowa instrukcja**: [CHATBOT_FIX.md](CHATBOT_FIX.md)
- **Wszystkie zmienne env**: [RENDER_ENV_SETUP.md](RENDER_ENV_SETUP.md)
- **Konfiguracja OpenAI**: https://platform.openai.com/api-keys

---

## 💰 Koszty OpenAI:

- **Darmowy kredyt**: 5 USD (~2000-5000 rozmów)
- **Potem**: ~$0.001 za rozmowę
- **Bez klucza**: Chatbot wyłączony (bez błędów)
