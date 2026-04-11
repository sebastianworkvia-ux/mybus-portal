# MongoDB Query - Dodanie tagu 'laweta' do istniejących firm

## Problem
Skrypt timeout się bo MongoDB Atlas free tier jest zbyt wolny.

## Rozwiązanie
Wykonaj tę query bezpośrednio w MongoDB Atlas UI:

### Metoda 1: Aggregation Pipeline (MongoDB Compass/Atlas Shell)

```javascript
db.carriers.updateMany(
  {
    phone: {
      $in: [
        "+48601234567", "601234567", "48601234567",
        // ... reszta telefonów z CSV
      ]
    },
    services: { $ne: "laweta" }
  },
  {
    $addToSet: { services: "laweta" }
  }
)
```

### Metoda 2: Lista wszystkich telefonów z CSV

Wklej wszystkie telefony z carriers_format_admin.csv (109 firm) w format:

```javascript
const phonesFromCSV = [
  "511090094",
  "510909410",
  "603434144",
  // ... wszystkie 109 telefonów
];

// Wygeneruj warianty
const variants = [];
for (const phone of phonesFromCSV) {
  variants.push(phone);
  variants.push(`+48${phone.replace(/^48/, '')}`);
  variants.push(`48${phone.replace(/^\+48/, '')}`);
}

// Query
db.carriers.updateMany(
  {
    phone: { $in: variants },
    services: { $ne: "laweta" }
  },
  {
    $addToSet: { services: "laweta" }
  }
);
```

## Jak wykonać

1. Idź do https://cloud.mongodb.com
2. Kliknij "Connect" → "MongoDB Compass" lub "Atlas Shell"
3. W zakładce Shell wklej query
4. Enter

## Weryfikacja

Po wykonaniu sprawdź ile firm ma tag:

```javascript
db.carriers.countDocuments({ services: "laweta" })
```

Powinno zwrócić 53 (lub więcej, jeśli są dodatkowe firmy z tymi telefonami).
