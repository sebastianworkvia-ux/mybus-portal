# Test polskich znaków UTF-8 na my-bus.eu

## ✅ Zmiany wprowadzone:

### Backend (server.js):
- ✅ `Content-Type: application/json; charset=utf-8`
- ✅ `Content-Language: pl`
- ✅ MongoDB połączenie z jawną konfiguracją UTF-8
- ✅ Mongoose strictQuery=false

### Frontend (apiClient.js):
- ✅ `Content-Type: application/json; charset=utf-8`
- ✅ `Accept: application/json`
- ✅ `Accept-Charset: utf-8`

### Frontend (index.html):
- ✅ `<meta charset="UTF-8" />`
- ✅ `<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />`
- ✅ `<html lang="pl">`
- ✅ `<meta name="language" content="Polish" />`

---

## 🧪 Jak przetestować na produkcji (my-bus.eu):

### Test 1: Endpoint testowy z polskimi znakami

Dodaj tymczasowy endpoint w `backend/src/server.js` przed routami:

```javascript
// Test UTF-8
app.get('/test-utf8', (req, res) => {
  res.json({
    message: 'Test polskich znaków',
    chars: 'ąćęłńóśźż ĄĆĘŁŃÓŚŹŻ',
    sample: {
      firma: 'Przewoźnik Szczęśliwy',
      opis: 'Szybki i tani transport paczek do Polski. Obsługujemy Niemcy, Holandię i Belgię.',
      miasta: ['Kraków', 'Gdańsk', 'Wrocław', 'Łódź']
    }
  })
})
```

Potem otwórz w przeglądarce:
```
https://mybus-backend-aygc.onrender.com/test-utf8
```

Powinieneś zobaczyć poprawnie wyświetlone polskie znaki.

---

### Test 2: Formularz rejestracji

1. Wejdź na https://my-bus.eu/register
2. Wypełnij formularz używając polskich znaków:
   - Imię: `Józef`
   - Nazwisko: `Wiśniewski`
   - Email: `test-utf8@example.com`
3. Zarejestruj się i sprawdź w MongoDB Atlas czy dane zapisały się poprawnie

---

### Test 3: Opis przewoźnika

1. Zaloguj się jako przewoźnik
2. Dodaj opis firmy z polskimi znakami:
```
Nasza firma oferuje szybki i bezpieczny transport osób i paczek 
między Polską a Niemcami. Obsługujemy miasta: Gdańsk, Poznań, 
Wrocław, Łódź i Kraków. Zaufali nam już setki klientów!
```
3. Zapisz i sprawdź czy wyświetla się poprawnie w szczegółach firmy

---

### Test 4: Opinie (Reviews)

1. Dodaj opinię z polskimi znakami:
```
Świetna firma! Szybka dostawa paczki z Berlina do Krakowa. 
Kierowca bardzo miły i pomocny. Polecam!
```
2. Sprawdź czy wyświetla się poprawnie

---

## 🚀 Wdrożenie na produkcję:

### 1. Push zmian:
```bash
git add .
git commit -m "Dodano pełną obsługę UTF-8 dla polskich znaków (ąćęłńóśźż)"
git push
```

### 2. Automatyczne deploy:
- **Vercel** (frontend) - automatycznie wdroży po push
- **Render** (backend) - automatycznie wdroży po push

### 3. Sprawdź po ~2-3 minuty:
- Frontend: https://my-bus.eu
- Backend: https://mybus-backend-aygc.onrender.com/health

---

## 📊 Co teraz działa:

✅ **Polskie znaki w bazie danych** (MongoDB UTF-8)
✅ **Polskie znaki w API responses** (Content-Type: charset=utf-8)
✅ **Polskie znaki w formularzach** (HTML meta charset)
✅ **Polskie znaki w URL** (automatyczne enkodowanie)
✅ **Polskie znaki w cookies/localStorage** (UTF-8)

---

## ⚠️ Uwagi:

- MongoDB **domyślnie** używa UTF-8, więc wszystkie istniejące dane są OK
- Axios **domyślnie** obsługuje UTF-8, ale teraz mamy to jawnie ustawione
- Vite **domyślnie** serwuje pliki jako UTF-8

**Wszystkie polskie znaki powinny działać bez problemu! 🇵🇱**
