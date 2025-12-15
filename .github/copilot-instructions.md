# AI Coding Instructions - Przewoźnicy

Instrukcje dla AI agentów pomagające w konsystentnym kodowaniu tego projektu. Focus: produktywność poprzez zrozumienie architekturi, patternów i workflow'ów.

## 📋 Przegląd Projektu

**Przewoźnicy** - Portal dla polskich firm transportowych w UE. Umożliwia właścicielom firm (przewoźnicy) rejestrację i zarządzanie usługami, zaś Polakom za granicą wyszukiwanie przewoźników z filtrowaniem po kraju (DE, NL, BE, FR, AT, PL) i typie usługi.

**Stack:** React 18 + Vite | Node.js + Express | MongoDB/Mongoose | JWT auth

## 🏗️ Architektura

### Full-Stack Data Flow
```
Frontend (React Router + Zustand)
    ↓
vite.config.js proxy: /api → http://localhost:5000
    ↓
Backend (Express middleware → routes → controllers)
    ↓
MongoDB (Mongoose models + validation)
```

### Frontend (`frontend/src/`)
- **components/** - Reusable UI (Header, SearchBar, CarrierCard)
- **pages/** - Routes: HomePage, SearchPage, LoginPage, RegisterPage
- **services/apiClient.js** - Axios instance (baseURL: '/api', JWT interceptors)
- **services/services.js** - Typed API wrappers (authService.login(), carrierService.getCarriers())
- **stores/authStore.js** - Zustand: user, token, login/logout/register actions
- **stores/carrierStore.js** - Zustand: carrier list state

### Backend (`backend/src/`)
- **routes/auth.js** - POST /register, /login; GET /profile (protected)
- **routes/carriers.js** - GET / (list), GET /:id, POST / (protected), PUT /, DELETE / (protected)
- **controllers/** - Business logic; always use `next(error)` for async errors
- **middleware/auth.js** - authMiddleware (Bearer token validation), errorHandler
- **models/User.js** - email, password (hashed), firstName, lastName, userType (enum: 'carrier'/'customer')
- **models/Carrier.js** - userId (ref), companyName, country (enum), services (array)

## 🔑 Critical Patterns

### Backend: Error Handling
```javascript
// Controllers always follow: try/catch + next(error)
export const getCarriers = async (req, res, next) => {
  try {
    const carriers = await Carrier.find()
    res.json(carriers)
  } catch (error) {
    next(error) // errorHandler middleware catches it
  }
}
```
**Response format:** `{ error: "message" }` with appropriate HTTP status (400, 401, 409, 500).

### Backend: Protected Routes
```javascript
// Routes: router.post('/protected', authMiddleware, controller)
// authMiddleware extracts Bearer token → req.user = { id, email }
// Always check req.user in controller if owner validation needed
```

### Frontend: API Calls
```javascript
// ALWAYS use apiClient (has JWT interceptor + 401 redirect)
import apiClient from '@/services/apiClient'

// Use service wrappers:
import { authService, carrierService } from '@/services/services'
const response = await carrierService.getCarriers({ country: 'DE' })

// Intercept 401 → auto-logout + redirect /login (in apiClient.js)
```

### Frontend: State Management (Zustand)
```javascript
// Store pattern: create(set) => ({ state, actions })
// authStore: user, token (from localStorage), loading, error
// Call set() to update; localStorage handled in register/login
// Use in components: const { user, login } = useAuthStore()
```

### Data Model: Dual User Profiles
```javascript
// Single User model, userType = 'carrier' or 'customer'
// Carrier profile data (companyName, country, services) stored in:
//  - User.carrierProfile (during registration), OR
//  - Separate Carrier document (userId reference)
// Note: Choose one approach project-wide to avoid duplication
```

## 💻 Development Workflow

### First Time Setup
```bash
cd backend && npm install && cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, CORS_ORIGIN
cd ../frontend && npm install
```

### Running Locally (2 terminals)
```bash
# Terminal 1: cd backend && npm run dev
# Backend: http://localhost:5000, watches src/ (--watch)

# Terminal 2: cd frontend && npm run dev
# Frontend: http://localhost:5173, auto-proxy /api requests
```

### Adding New Features
**New API endpoint:** Add to `routes/XXX.js` → create `controllers/XXXController.js` → add service wrapper in `frontend/services/services.js`

**New page:** Create `pages/XXXPage.jsx` → add Route in `App.jsx` → add Header link

**New component:** Create `components/XXXComponent.jsx` + `.css` → import in page/other component

## 📝 Code Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase files in folder | `components/CarrierCard/CarrierCard.jsx` |
| Functions | camelCase | `const fetchData = async () => {}` |
| Constants | UPPER_SNAKE_CASE | `const API_TIMEOUT = 5000` |
| Routes (API) | lowercase, plural | `/api/carriers`, `/api/auth` |
| MongoDB fields | camelCase | `companyName`, `userId` |
| Enums | Array of strings | `['carrier', 'customer']`, `['DE', 'NL', ...]` |

## 🔧 Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/przewoznicy
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
PORT=5000
```

### Frontend
- Uses `/api` proxy → no env needed (vite.config.js handles redirect)

## 📚 Key Files to Understand
- [backend/src/server.js](backend/src/server.js) - Express setup, middleware order
- [frontend/src/App.jsx](frontend/src/App.jsx) - React Router config
- [frontend/vite.config.js](frontend/vite.config.js) - API proxy definition
- [backend/src/middleware/auth.js](backend/src/middleware/auth.js) - JWT logic
- [frontend/src/services/apiClient.js](frontend/src/services/apiClient.js) - Interceptors
- [backend/src/models/User.js](backend/src/models/User.js), [Carrier.js](backend/src/models/Carrier.js) - Schemas

## ⚠️ Common Gotchas
1. **CORS errors** - Update `CORS_ORIGIN` in .env if changing frontend port
2. **JWT not attached** - Always use apiClient, not direct axios (services/apiClient.js has interceptor)
3. **401 redirects** - apiClient auto-clears token + redirects to /login on 401
4. **Dual profile data** - User.carrierProfile vs Carrier model; standardize approach
5. **MongoDB ref population** - Remember `.populate('userId')` when querying Carrier for user details

---

**Last updated:** 2025-12-14
