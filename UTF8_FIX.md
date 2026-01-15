# 🔧 Naprawa polskich znaków (ą, ć, ę, ł, ń, ó, ś, ź, ż)

## Problem
Zamiast polskich znaków wyświetlają się:
- `�` (znak zapytania w rombie - U+FFFD)
- `MiÄ™dzynarodowy` zamiast `Międzynarodowy`
- `przewĂłz` zamiast `przewóz`
- `osĂłb` zamiast `osób`

## ✅ Rozwiązanie (automatyczne)

### 1. Napraw istniejące dane w MongoDB

```bash
cd backend
npm run fix-utf8
```

To uruchomi skrypt który:
- Przeskanuje wszystkie kolekcje (Users, Carriers, Reviews)
- Automatycznie naprawi błędne encoding
- Pokaże statystyki naprawy

### 2. Wdróż nową wersję

```bash
git add .
git commit -m "🔧 Naprawiono encoding UTF-8 - pełna obsługa polskich znaków"
git push
```

Automatyczny deploy na Vercel i Render (~3-5 min)

---

## 🛡️ Co zostało dodane (zapobiega przyszłym błędom):

### Backend:
✅ **Middleware sanityzacji** - automatycznie naprawia dane przy zapisie
✅ **Silniejsze wymuszenie UTF-8** - każdy response ma `charset=utf-8`
✅ **Skrypt naprawczy** - jednorazowo naprawia stare dane

### Frontend:
✅ **Meta tags UTF-8** - gwarantują prawidłowe wyświetlanie
✅ **Axios charset headers** - wymuszają UTF-8 w komunikacji

### MongoDB:
✅ **Jawna konfiguracja UTF-8** - baza wie że używamy polskich znaków

---

## 📋 Nowe dane (od teraz):

Wszystkie **nowe** zapisy będą automatycznie sanityzowane:

```javascript
// Użytkownik wpisuje w formularzu:
"Międzynarodowy przewóz osób"

// Middleware automatycznie:
1. Sprawdza encoding ✓
2. Naprawia jeśli potrzeba ✓
3. Zapisuje poprawnie do MongoDB ✓
4. Zwraca z prawidłowym charset=utf-8 ✓
```

---

## 🧪 Test po wdrożeniu:

### 1. Test endpointu:
```bash
curl https://mybus-backend-aygc.onrender.com/test-utf8
```

Powinno zwrócić poprawnie:
```json
{
  "chars": "ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ",
  "sample": {
    "firma": "Przewoźnik Szczęśliwy",
    "opis": "Szybki i tani transport paczek do Polski..."
  }
}
```

### 2. Test w przeglądarce:
1. Otwórz https://my-bus.eu
2. Znajdź przewoźnika (np. "Kowal-Bus")
3. Sprawdź czy **NIE MA** znaków `�` lub `Ä™`
4. Powinno być: `Międzynarodowy przewóz osób`

---

## 🚨 Jeśli nadal są błędy:

### Opcja 1: Uruchom skrypt ponownie
```bash
cd backend
npm run fix-utf8
```

### Opcja 2: Ręczna naprawa konkretnego przewoźnika

W MongoDB Compass lub Atlas:
1. Znajdź dokument
2. Edytuj pole `companyName` lub `description`
3. Wpisz poprawnie z polskimi znakami
4. Zapisz

### Opcja 3: Reimport danych

Jeśli masz plik CSV z oryginalnymi danymi:
1. Upewnij się że CSV jest w UTF-8 (nie Windows-1250!)
2. W panelu admin: Import CSV
3. Stare dane zostaną zastąpione poprawnymi

---

## 📝 Dla programistów:

### Użyj helpera do czyszczenia tekstu:

```javascript
import { fixEncoding, sanitizeObject } from './utils/textUtils.js'

// Pojedynczy string
const fixed = fixEncoding('MiÄ™dzynarodowy przewĂłz')
// → "Międzynarodowy przewóz"

// Cały obiekt
const data = {
  name: 'KrakĂłw',
  desc: 'Transport osĂłb'
}
const clean = sanitizeObject(data)
// → { name: 'Kraków', desc: 'Transport osób' }
```

### Middleware jest automatyczny:
```javascript
// req.body jest automatycznie czyszczony przed kontrolerem
app.post('/carriers', (req, res) => {
  // req.body.companyName już ma poprawne polskie znaki
})
```

---

## 🎯 Podsumowanie:

1. **Raz** uruchom: `npm run fix-utf8` (naprawi stare dane)
2. **Zawsze** push do GitHub (deploy z nowymi zabezpieczeniami)
3. **Już nigdy** nie będzie problemu z polskimi znakami! ✨

---

**Autor:** AI Assistant  
**Data:** 2026-01-15  
**Status:** ✅ Gotowe do użycia
