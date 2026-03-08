# Google Maps Crawler - Extended Transport Services

## 📊 Zakres zbierania danych

Crawler zbiera firmy transportowe świadczące następujące usługi:

### Rodzaje usług:
1. **Przewóz osób** - busy międzynarodowe, transport pasażerski
2. **Transfery lotniskowe** - przewóz na lotniska
3. **Paczki** - transport paczek, kurier międzynarodowy
4. **Wycieczki autokarowe** - wynajem autokarów, przewozy turystyczne
5. **Lawety** - transport pojazdów, pomoc drogowa
6. **Transport zwierząt** - przewóz zwierząt domowych
7. **Przeprowadzki** - krajowe i międzynarodowe
8. **Przejazdy służbowe** - transport pracowników

### Kierunki:
- Niemcy, Holandia, Belgia, Francja, Austria
- Dania, Norwegia, Szwecja, Szwajcaria
- Anglia, Włochy, Hiszpania

## 🚀 Workflow

### Krok 1: Uruchom crawlera
```bash
cd backend/google-maps-crawler
node index.js
```
**Czas:** ~2-3 godziny dla 1000+ firm
**Output:** `transport_companies_full.csv`

### Krok 2: Konwersja do formatu importu
```bash
node convert-with-services.js
```
**Output:** `carriers_for_import.csv` (z inteligentnym wykrywaniem usług)

### Krok 3: Import do MongoDB
```bash
node import-admin-csv.js
```
**Czas:** ~20-30 minut (małe batche dla MongoDB Atlas free tier)

### Krok 4: Usuń duplikaty
```bash
node remove-duplicates.js
```
**Zasada:** Ta sama nazwa fir my + to samo miasto = duplikat (zachowuje najstarszy wpis)

## 📁 Pliki

- `index.js` - Główny crawler (32 słowa kluczowe)
- `convert-with-services.js` - Konwersja + wykrywanie usług
- `import-admin-csv.js` - Import do MongoDB (batch 5 firms / 10s)
- `remove-duplicates.js` - Usuwanie duplikatów
- `check-database.js` - Sprawdzanie stanu bazy
- `verify-import.js` - Weryfikacja importu

## 🎯 Inteligentne wykrywanie usług

Skrypt `convert-with-services.js` automatycznie wykrywa rodzaj usług z nazwy firmy:

```javascript
"Busy Polska-Niemcy Transfer Lotniskowy"
→ Oferowane usługi: "Przewóz osób, Transfery lotniskowe"

"Transport Zwierząt i Przeprowadzki Międzynarodowe"
→ Oferowane usługi: "Transport zwierząt, Przeprowadzki"

"Laweta 24h Pomoc Drogowa"
→ Oferowane usługi: "Lawety"
```

## 📊 Statystyki

Po uruchomieniu crawlera:
```
📊 Target: ~1600 companies (32 keywords × 50 per keyword)
📁 Output: transport_companies_full.csv
```

Po konwersji zobaczysz statystyki usług:
```
📊 Services detected:
   Przewóz osób: 850 companies
   Paczki: 420 companies
   Transfery lotniskowe: 250 companies
   ...
```

## ⚠️ Uwagi

- Crawler używa `headless: false` - możesz zamknąć okno Chrome ale nie zamykaj całego procesu
- MongoDB Atlas free tier jest wolny - importy mogą pokazywać timeouty ale dane się zapisują
- Duplikaty są usuwane według: normalized_name + city
- Firmy w wielu miastach = różne wpisy (to jest OK)
