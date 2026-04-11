# Instrukcja Ręcznego Importu Firm Lawetowych

## 📁 Plik CSV
- **Lokalizacja:** `backend/google-maps-crawler/laweta_companies.csv`
- **Liczba firm:** 109
- **Format:** Company Name, Phone, Website, Address, Region

## 🏷️ WAŻNE - Tag Services

Przy dodawaniu każdej firmy **MUSISZ** ustawić tag:

```
services: ['laweta']
```

**NIE używaj:**
- ❌ `transport-pojazdów` (nie istnieje w enum)
- ❌ `pomoc-drogowa` (nie istnieje w enum)
- ❌ `towing` (angielski tag)

**Poprawny tag:**
- ✅ `laweta` - to jedyny dozwolony tag dla lawet w modelu Carrier

## 🔍 Jak Działa Filtrowanie

1. **Kafelek na stronie głównej:**
   - Ikona: 🚗
   - Nazwa: "Lawety" / "Pojazdy"
   - Link: `/search?service=laweta`

2. **Wyszukiwarka:**
   - Dropdown "Rodzaj usługi"
   - Opcja: "Lawety / Pojazdy"
   - Wartość: `laweta`

3. **Backend filtrowanie:**
   - Query: `{ services: 'laweta' }`
   - Znajduje wszystkie firmy z tagiem 'laweta' w arrayu services

## 📋 Mapowanie Pól CSV → Panel Admin

| CSV Column     | Panel Admin Field          | Notatki                                      |
|----------------|----------------------------|----------------------------------------------|
| Company Name   | Nazwa Firmy                | Wymagane                                     |
| Phone          | Telefon                    | Wymagane (format: +48...)                    |
| Website        | Strona WWW                 | Opcjonalne (91/109 firm ma webiste)          |
| Address        | Lokalizacja > Miasto       | Przeważnie puste, można pominąć              |
| Region         | Kraj                       | Poland → PL, Germany → DE, Unknown → PL      |

## ⚙️ Dodatkowe Pola Do Uzupełnienia

Przy ręcznym dodawaniu ustaw:

```javascript
{
  services: ['laweta'],  // WAŻNE!
  operatingCountries: ['PL', 'DE', 'NL', 'BE', 'FR', 'AT'], // Międzynarodowe holowanie
  subscriptionPlan: 'free',
  isPremium: false,
  isActive: true,
  isVerified: false,
  description: "Firma świadcząca usługi lawety i pomocy drogowej. Holowanie pojazdów, transport samochodów, pomoc drogowa 24h."
}
```

## 🎯 Przykładowa Firma

**Z CSV:**
```
Company Name: POMOC DROGOWA LAWETA HOLOWANIE NIEMCY ŚWIECKO SŁUBICE
Phone: +48604381555
Website: https://www.laweta-slubice.com.pl/
Region: Germany
```

**Do panelu admina:**
- **Nazwa firmy:** POMOC DROGOWA LAWETA HOLOWANIE NIEMCY ŚWIECKO SŁUBICE
- **Telefon:** +48604381555
- **Website:** www.laweta-slubice.com.pl (bez https://)
- **Kraj:** DE (Germany → DE)
- **Services:** `laweta` (dropdown lub checkbox)
- **Operating Countries:** PL, DE, NL, BE, FR, AT (multi-select)
- **Subscription Plan:** free
- **Opis:** Firma świadcząca usługi lawety i pomocy drogowej. Holowanie pojazdów, transport samochodów, pomoc drogowa 24h.

## ✅ Weryfikacja Po Imporcie

1. Wejdź na stronę główną → kliknij kafelek 🚗 "Lawety"
2. Powinieneś zobaczyć wszystkie 109 firm lawetowych
3. Sprawdź filtry w wyszukiwarce:
   - Wybierz "Lawety" w dropdown "Rodzaj usługi"
   - Wszystkie lawety powinny być widoczne

## 📊 Statystyki CSV

- **Total:** 109 firm
- **Z telefonem:** 109 (100%)
- **Z websitem:** 91 (83%)
- **Regiony:**
  - Poland: 43 firmy
  - Germany: 3 firmy
  - Belgium: 5 firm
  - Austria: 2 firmy
  - France: 1 firma
  - Unknown: 55 firm (prawdopodobnie też Polska)

## 🚨 Najczęstsze Błędy

1. ❌ **Źle wpisany tag** - musi być dokładnie `laweta` (małe litery)
2. ❌ **Brak tagu services** - firma się nie pojawi w filtrze
3. ❌ **Wielokrotne kropki w opisie** - używaj jednego stylu opisu
4. ❌ **Zły format telefonu** - zachowaj +48 prefix

---

**Pytania?** Sprawdź model: `backend/src/models/Carrier.js` → pole `services` enum
