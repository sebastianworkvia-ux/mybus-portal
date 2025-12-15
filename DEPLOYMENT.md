# 🚀 Instrukcja Deployment - MyBus Portal

## 📋 Wymagania wstępne
1. Konto GitHub (darmowe)
2. Kod projektu na GitHubie
3. Konta na platformach (wszystkie darmowe):
   - MongoDB Atlas
   - Render.com (backend)
   - Vercel.com (frontend)

---

## 1️⃣ MONGODB ATLAS (Baza Danych) - 100% DARMOWE

### Kroki:
1. **Rejestracja**: https://www.mongodb.com/cloud/atlas/register
2. **Utwórz Organization**: "MyBus" lub dowolna nazwa
3. **Utwórz Project**: "Przewoznicy Portal"
4. **Utwórz FREE Cluster**:
   - Wybierz: **M0 Sandbox (FREE FOREVER)**
   - Region: Frankfurt (eu-central-1) - najbliżej Polski
   - Nazwa: `Cluster0`
5. **Database Access** (użytkownik bazy):
   - Add New Database User
   - Username: `mybus_admin`
   - Password: **Wygeneruj mocne hasło** (zapisz!)
   - Database User Privileges: `Read and write to any database`
6. **Network Access** (dostęp z internetu):
   - Add IP Address
   - **Allow access from anywhere**: `0.0.0.0/0`
   - Confirm
7. **Connection String**:
   - Clusters → Connect → Connect your application
   - Driver: Node.js
   - Skopiuj string, np.:
     ```
     mongodb+srv://mybus_admin:<password>@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
     ```
   - Zamień `<password>` na prawdziwe hasło
   - Dodaj nazwę bazy przed `?`: `/przewoznicy?retryWrites=true...`

✅ **Gotowe! Connection string gotowy do użycia.**

---

## 2️⃣ RENDER.COM (Backend Node.js) - DARMOWY TIER

### Przygotowanie kodu:
1. **Push na GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - MyBus Portal"
   git branch -M main
   git remote add origin https://github.com/TWOJ_USERNAME/mybus-portal.git
   git push -u origin main
   ```

### Deployment na Render:
1. **Rejestracja**: https://render.com → Sign Up (użyj GitHub)
2. **New Web Service**:
   - Connect repository: wybierz `mybus-portal`
3. **Konfiguracja**:
   - **Name**: `mybus-backend`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** (0$/mies)
4. **Environment Variables** (kliknij "Advanced"):
   ```
   MONGODB_URI=mongodb+srv://mybus_admin:TWOJE_HASLO@cluster0.abc123.mongodb.net/przewoznicy?retryWrites=true&w=majority
   
   JWT_SECRET=wygeneruj-losowy-ciąg-32-znakow-tutaj
   
   CORS_ORIGIN=*
   
   NODE_ENV=production
   ```
   
   **Generowanie JWT_SECRET** (CMD/Terminal):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Skopiuj wynik jako `JWT_SECRET`

5. **Create Web Service** → Poczekaj 5-10 minut na build

✅ **Backend URL**: `https://mybus-backend.onrender.com`

### Test backendu:
Otwórz: `https://mybus-backend.onrender.com/health`
Powinno pokazać: `{"message":"Backend is running"}`

---

## 3️⃣ VERCEL (Frontend React) - UNLIMITED DARMOWY

### Przygotowanie frontendu:
1. **Zaktualizuj apiClient.js**:
   ```javascript
   // frontend/src/services/apiClient.js
   const apiClient = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'https://mybus-backend.onrender.com',
     // reszta kodu...
   })
   ```

### Deployment na Vercel:
1. **Rejestracja**: https://vercel.com → Sign Up (użyj GitHub)
2. **Import Project**:
   - Add New → Project
   - Import Git Repository: wybierz `mybus-portal`
3. **Konfiguracja**:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables**:
   ```
   VITE_API_URL=https://mybus-backend.onrender.com
   ```
5. **Deploy** → Poczekaj 2-3 minuty

✅ **Frontend URL**: `https://mybus-portal.vercel.app`

### Aktualizacja CORS_ORIGIN na Render:
1. Wróć do Render → mybus-backend → Environment
2. Zmień `CORS_ORIGIN` z `*` na:
   ```
   CORS_ORIGIN=https://mybus-portal.vercel.app
   ```
3. Save Changes (backend zrestartuje się automatycznie)

---

## 4️⃣ SEED DATABASE (Wypełnienie danymi testowymi)

### Sposób 1: Lokalnie (z połączeniem do Atlas):
1. Skopiuj `MONGODB_URI` z Render
2. Podmień w pliku `backend/.env`
3. Uruchom:
   ```bash
   cd backend
   node seed.js
   ```

### Sposób 2: Przez Render Shell:
1. Render Dashboard → mybus-backend
2. Shell (prawy górny róg)
3. W konsoli:
   ```bash
   node seed.js
   ```

✅ **10 testowych przewoźników dodanych do bazy!**

---

## 🎉 GOTOWE! Twoja aplikacja jest ONLINE!

### Adresy:
- **Frontend**: https://mybus-portal.vercel.app
- **Backend**: https://mybus-backend.onrender.com
- **Database**: MongoDB Atlas Cloud

### Test końcowy:
1. Otwórz frontend w przeglądarce
2. Zarejestruj się jako przewoźnik
3. Zaloguj się
4. Wyszukaj przewoźników
5. Kliknij "Więcej szczegółów"

---

## 🔒 BEZPIECZEŃSTWO

### Zaimplementowane zabezpieczenia:
✅ **Helmet** - Zabezpiecza HTTP headers (XSS, clickjacking)
✅ **Rate Limiting** - Max 100 req/15min z jednego IP (ochrona przed DDoS)
✅ **CORS** - Tylko frontend ma dostęp do API
✅ **JWT** - Bezpieczna autoryzacja z tokenami
✅ **bcryptjs** - Hasła hashowane (nie w plain text)
✅ **MongoDB Atlas** - Certyfikaty SSL/TLS, backupy automatyczne
✅ **HTTPS** - Vercel i Render automatycznie (darmowe certyfikaty)

### Dodatkowe zalecenia:
- Nie commituj plików `.env` na GitHub (jest w `.gitignore`)
- Regularnie zmieniaj `JWT_SECRET` (co 3-6 miesięcy)
- Monitoruj logi na Render (zakładka Logs)

---

## 💰 KOSZTY

| Usługa | Plan | Koszt |
|--------|------|-------|
| MongoDB Atlas | M0 Sandbox | **0 PLN** (500MB, 100 połączeń) |
| Render.com | Free Tier | **0 PLN** (750h/mies, sleep po 15min nieaktywności) |
| Vercel | Hobby | **0 PLN** (unlimited deployments) |
| **RAZEM** | | **0 PLN/miesiąc** |

### Limity darmowych planów:
- **MongoDB**: 500MB storage, 100 concurrent connections (wystarczy na 1000+ użytkowników)
- **Render**: Backend "zasypia" po 15 minutach bez ruchu (pierwsze żądanie budzi ~30sek)
- **Vercel**: Unlimited requests, 100GB bandwidth/mies

---

## 🆙 AKTUALIZACJE KODU

### Po zmianach w kodzie:
```bash
git add .
git commit -m "Opis zmian"
git push origin main
```

- **Vercel**: Deploy automatycznie w 2-3 minuty
- **Render**: Deploy automatycznie w 5-10 minut

---

## 🐛 TROUBLESHOOTING

### Problem: Backend 503 Service Unavailable
**Rozwiązanie**: Backend "zasnął" (Render Free). Odśwież stronę po 30 sekundach.

### Problem: CORS errors w konsoli
**Rozwiązanie**: Sprawdź `CORS_ORIGIN` w Render Environment Variables

### Problem: Nie mogę się zalogować
**Rozwiązanie**: Sprawdź czy seed.js został uruchomiony, albo zarejestruj nowe konto

### Problem: MongoDB connection error
**Rozwiązanie**: 
1. Sprawdź Network Access w Atlas (0.0.0.0/0)
2. Sprawdź Database User hasło
3. Sprawdź connection string w Render

---

## 📞 SUPPORT

Render Dashboard: https://dashboard.render.com
Vercel Dashboard: https://vercel.com/dashboard
MongoDB Atlas: https://cloud.mongodb.com

**Logi błędów**:
- Render: Dashboard → mybus-backend → Logs
- Vercel: Dashboard → mybus-portal → Deployments → View Function Logs
- Browser: F12 → Console
