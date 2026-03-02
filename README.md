# ImmoKredit Frontend - React + TypeScript

Modern, production-ready React application für ImmoKredit Finanzierungs-Management.

## 🚀 Features

✅ **Dashboard** mit Live-Stats
✅ **Pipeline** Management mit 6 Stages
✅ **Sidebar** Navigation
✅ **Modern Design** (Outfit Font, Clean UI)
✅ **TypeScript** für Type Safety
✅ **React Router** für Navigation
✅ **Responsive** Design
✅ **Component-based** Architecture

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm oder yarn

### Setup

```bash
# 1. In das Projektverzeichnis wechseln
cd immokredit-frontend

# 2. Dependencies installieren
npm install

# 3. Development Server starten
npm run dev

# App öffnet automatisch auf http://localhost:3000
```

## 🏗️ Projekt-Struktur

```
immokredit-frontend/
├── src/
│   ├── components/           # Wiederverwendbare Components
│   │   ├── Sidebar/         # Sidebar Navigation
│   │   ├── Dashboard/       # Dashboard Components
│   │   └── Pipeline/        # Pipeline Components
│   ├── pages/               # Page Components
│   │   └── Dashboard/       # Dashboard Page
│   ├── types/               # TypeScript Types
│   ├── styles/              # Global Styles
│   ├── App.tsx             # Main App Component
│   └── main.tsx            # Entry Point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── index.html
```

## 🎨 Components

### Sidebar
Linke Navigation mit Sections und Active States

```tsx
import { Sidebar } from '@/components/Sidebar/Sidebar';
```

### StatsCard
Statistics Card für Dashboard

```tsx
import { StatsCard } from '@/components/Dashboard/StatsCard';

<StatsCard
  icon="👥"
  iconBg="rgba(16, 185, 129, 0.1)"
  iconColor="var(--success)"
  value={47}
  label="Leads Total"
  trend={{ direction: 'up', value: '12%' }}
/>
```

### DealCard
Deal Card für Pipeline

```tsx
import { DealCard } from '@/components/Pipeline/DealCard';

<DealCard deal={deal} onClick={() => handleClick(deal)} />
```

### PipelineStage
Pipeline Stage mit Deals

```tsx
import { PipelineStage } from '@/components/Pipeline/PipelineStage';

<PipelineStage
  stage={DealStage.NEUER_LEAD}
  title="Neuer Lead"
  icon="📥"
  deals={deals}
  onDealClick={handleDealClick}
/>
```

## 🎯 Pages

### Dashboard
Haupt-Dashboard mit Stats, Pipeline Preview, Activity Feed

```tsx
import { Dashboard } from '@/pages/Dashboard/Dashboard';
```

## 🛠️ Development

### Scripts

```bash
# Development Server
npm run dev

# Build für Production
npm run build

# Preview Production Build
npm run preview

# Linting
npm run lint
```

### Environment Variables

Erstelle eine `.env` Datei:

```env
VITE_API_URL=http://localhost:4000/api
```

## 🔌 API Integration (Nächster Schritt)

Die App ist bereit für API-Integration. Erstelle Services in `src/services/`:

```typescript
// src/services/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// src/services/leads.service.ts
export const leadsService = {
  getAll: () => api.get('/leads'),
  create: (data) => api.post('/leads', data),
  // ...
};
```

## 📱 Responsive Breakpoints

```css
/* Desktop: Default */
/* Tablet: < 1024px */
/* Mobile: < 640px */
```

## 🎨 Design System

### Farben

```css
--primary: #1a4d8f
--accent: #00d4ff
--success: #10b981
--warning: #f59e0b
--danger: #ef4444
```

### Schriftarten

```
Haupt: Outfit (Google Fonts)
Mono: JetBrains Mono
```

### Border Radius

```css
--radius: 12px
--radius-lg: 16px
--radius-full: 9999px
```

## 🚀 Deployment

### Vercel (Empfohlen)

```bash
# 1. Vercel CLI installieren
npm i -g vercel

# 2. Deploy
vercel

# 3. Production Deploy
vercel --prod
```

### Netlify

```bash
# 1. Build erstellen
npm run build

# 2. dist/ Ordner deployen
```

### Eigener Server

```bash
# Build erstellen
npm run build

# dist/ Ordner auf Server kopieren
# Mit nginx oder anderem Webserver ausliefern
```

## ✅ Nächste Schritte

1. **Backend API erstellen** (siehe BACKEND_SETUP.md)
2. **API Services implementieren** (src/services/)
3. **State Management** mit Zustand einrichten
4. **Authentication** hinzufügen
5. **Weitere Pages** entwickeln:
   - Pipeline (full view)
   - Leads Management
   - Documents Upload
   - Workflows Dashboard
   - Settings

## 📚 Dependencies

### Core
- React 18.3
- React Router DOM 6.22
- TypeScript 5.2
- Vite 5.1

### UI
- lucide-react (Icons)
- clsx (Class Names)

### State & Data
- Zustand (State Management)
- React Query (API Caching)
- Axios (HTTP Client)

### Dev Tools
- ESLint
- TypeScript ESLint

## 🐛 Troubleshooting

### Port bereits belegt

```bash
# Port in vite.config.ts ändern
server: {
  port: 3001,
}
```

### Module not found

```bash
# Node modules neu installieren
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# TypeScript Cache löschen
rm -rf node_modules/.vite
npm run dev
```

## 📝 Lizenz

Private - ImmoKredit

## 👨‍💻 Autor

Matej - ImmoKredit

---

**Ready to rock! 🚀**

Für Fragen oder Probleme: [Kontakt]
