# StudySync — Full Project Documentation

## Academic Command Center

**Version:** 1.0  
**Last Updated:** February 25, 2026  
**Live URL:** [https://www.joshwebs.co.zw/study](https://www.joshwebs.co.zw/study)  
**Repository:** [github.com/monalisamaguruwada102-web/StudySync](https://github.com/monalisamaguruwada102-web/StudySync)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Architecture](#4-architecture)
5. [Frontend Documentation](#5-frontend-documentation)
6. [Backend Documentation](#6-backend-documentation)
7. [Database Schema](#7-database-schema)
8. [Authentication & Security](#8-authentication--security)
9. [Data Persistence & Sync](#9-data-persistence--sync)
10. [Gamification System](#10-gamification-system)
11. [Email Engagement System](#11-email-engagement-system)
12. [Chat & Collaboration](#12-chat--collaboration)
13. [AI Integration](#13-ai-integration)
14. [Deployment](#14-deployment)
15. [Mobile Application](#15-mobile-application)
16. [Desktop Application](#16-desktop-application)
17. [Configuration](#17-configuration)
18. [API Reference](#18-api-reference)
19. [Troubleshooting](#19-troubleshooting)

---

## 1. Project Overview

**StudySync** is a comprehensive academic management platform designed to help university students organize, track, and optimize their study activities. It combines module management, study logging, task tracking, note-taking, flashcard revision, real-time collaboration, analytics, and gamification into a single unified application.

### Key Highlights
- **Multi-Platform**: Web (React), Desktop (Electron), Mobile (Flutter)
- **Offline-First**: Local JSON database with automatic cloud sync
- **AI-Powered**: Google Gemini AI for study insights and predictions
- **Real-Time**: Live chat, presence indicators, and push notifications
- **Gamified**: XP, levels, badges, and study streaks
- **Automated**: Scheduled email reports, deadline alerts, and study reminders

---

## 2. Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2 | UI framework |
| **Vite** | 7.x | Build tool and dev server |
| **TailwindCSS** | 4.x | Utility-first CSS framework |
| **React Router DOM** | 7.x | Client-side routing |
| **Framer Motion** | 12.x | Animations and transitions |
| **Chart.js** + react-chartjs-2 | 4.x / 5.x | Data visualization |
| **Lucide React** | 0.563 | Icon library |
| **react-force-graph-2d** | 1.29 | Knowledge graph visualization |
| **react-markdown** | 10.x | Markdown rendering |
| **date-fns** | 4.x | Date utilities |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 22.x | Runtime environment |
| **Express** | 5.x | HTTP server framework |
| **Supabase JS** | 2.x | Database client and auth |
| **bcryptjs** | 3.x | Password hashing |
| **jsonwebtoken** | 9.x | JWT authentication |
| **Nodemailer** | 8.x | Email delivery |
| **node-cron** | 4.x | Job scheduling |
| **multer** | 2.x | File upload handling |
| **helmet** | 8.x | Security headers |
| **express-rate-limit** | 8.x | Rate limiting |
| **megajs** | 1.3 | MEGA cloud backup |
| **@google/generative-ai** | 0.24 | Google Gemini AI |

### Infrastructure
| Technology | Purpose |
|-----------|---------|
| **Supabase** | PostgreSQL database, authentication, storage, real-time |
| **Render** | Web hosting and deployment |
| **GitHub** | Source control |
| **Docker Compose** | Microservices orchestration |
| **Redis** | Caching and presence tracking |
| **Apache Kafka** | Message queue for microservices |

### Desktop & Mobile
| Technology | Purpose |
|-----------|---------|
| **Electron** | Desktop application wrapper |
| **Flutter / Dart** | Mobile application (Android/iOS) |

---

## 3. Project Structure

```
StudySync/
├── src/                          # Frontend source code
│   ├── App.jsx                   # Root component with routing
│   ├── main.jsx                  # Application entry point
│   ├── index.css                 # Global styles
│   ├── pages/                    # Page components (25 pages)
│   │   ├── Dashboard.jsx         # Main dashboard with analytics
│   │   ├── Modules.jsx           # Module management
│   │   ├── ModuleDetail.jsx      # Module detail view
│   │   ├── StudyLogs.jsx         # Study session logs
│   │   ├── Tasks.jsx             # Task management
│   │   ├── Notes.jsx             # Note-taking system
│   │   ├── Flashcards.jsx        # Flashcard revision
│   │   ├── Tutorials.jsx         # YouTube tutorial manager
│   │   ├── Calendar.jsx          # Academic calendar
│   │   ├── Kanban.jsx            # Kanban task board
│   │   ├── Grades.jsx            # Grade tracking
│   │   ├── Chat.jsx              # Real-time collaboration hub
│   │   ├── DeepFocus.jsx         # Focus mode with timers
│   │   ├── DeepAnalytics.jsx     # Advanced analytics
│   │   ├── KnowledgeGraph.jsx    # Visual knowledge map
│   │   ├── SQLVisualizer.jsx     # Database query visualizer
│   │   ├── Settings.jsx          # User preferences
│   │   ├── StudyGroups.jsx       # Study group management
│   │   ├── Login.jsx             # Authentication page
│   │   ├── PublicViewer.jsx      # Public shared resource viewer
│   │   ├── Articles.jsx          # Educational articles
│   │   ├── ArticleDetail.jsx     # Article detail view
│   │   ├── About.jsx             # About page
│   │   ├── Contact.jsx           # Contact page
│   │   └── PrivacyPolicy.jsx     # Privacy policy
│   ├── components/               # Reusable components
│   │   ├── layout/               # Layout components
│   │   │   ├── Layout.jsx        # Global page wrapper (sidebar + header)
│   │   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   │   ├── Header.jsx        # Page header
│   │   │   ├── MusicPlayer.jsx   # Ambient music player
│   │   │   └── BackgroundSlideshow.jsx  # Background effects
│   │   ├── ui/                   # UI primitives
│   │   │   ├── Button.jsx        # Button component
│   │   │   ├── Card.jsx          # Card component
│   │   │   ├── Input.jsx         # Input component
│   │   │   ├── Modal.jsx         # Modal dialog
│   │   │   ├── Toast.jsx         # Toast notifications
│   │   │   ├── AnimatedCard.jsx  # Animated card
│   │   │   ├── AnimatedBadge.jsx # Badge animations
│   │   │   ├── LoadingReactor.jsx# Loading animation
│   │   │   ├── QuizModal.jsx     # Flashcard quiz
│   │   │   ├── ShareToChatModal.jsx  # Share to chat dialog
│   │   │   └── NotificationDialog.jsx # Notification center
│   │   ├── chat/                 # Chat-specific components
│   │   ├── dashboard/            # Dashboard widgets
│   │   ├── analytics/            # Analytics components
│   │   ├── search/               # Search components
│   │   ├── help/                 # Help components
│   │   ├── onboarding/           # Onboarding flow
│   │   ├── PomodoroTimer.jsx     # Pomodoro timer
│   │   ├── TimerWidget.jsx       # Floating timer widget
│   │   ├── ConnectionStatus.jsx  # Network status indicator
│   │   ├── ProtectedRoute.jsx    # Route guard
│   │   └── ThemeSelector.jsx     # Theme switcher
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAnalytics.js       # Analytics calculations
│   │   ├── useChat.js            # Chat state management
│   │   ├── useFirestore.js       # Firestore operations
│   │   ├── useGamification.js    # XP, levels, badges
│   │   └── usePresence.js        # Online/offline presence
│   ├── context/                  # React context providers
│   │   ├── AuthContext.jsx       # Authentication state
│   │   ├── ThemeContext.jsx      # Dark/light theme
│   │   ├── TimerContext.jsx      # Timer state
│   │   └── NotificationContext.jsx  # Notifications
│   ├── services/                 # API and service layers
│   │   ├── api.js                # Axios HTTP client
│   │   ├── authService.js        # Auth API calls
│   │   ├── firestoreService.js   # Collection CRUD service
│   │   ├── aiService.js          # AI chat service
│   │   ├── supabase.js           # Supabase client init
│   │   └── firebase.js           # Firebase config (legacy)
│   ├── data/                     # Static data
│   │   ├── navigation.js         # Sidebar navigation config
│   │   └── articles.js           # Article content
│   ├── styles/                   # Additional stylesheets
│   └── utils/                    # Utility functions
├── server/                       # Backend server
│   ├── index.cjs                 # Main Express server (92KB)
│   ├── database.cjs              # Local JSON database engine
│   ├── supabasePersistence.cjs   # Supabase CRUD operations
│   ├── syncService.cjs           # Data sync and analytics
│   ├── emailService.cjs          # Email templates (9 types)
│   ├── scheduler_utf8.cjs        # Cron job scheduler
│   ├── megaPersistence.cjs       # MEGA cloud backup
│   ├── supabase_schema.sql       # Database schema
│   ├── db.json                   # Local JSON database file
│   └── uploads/                  # File upload directory
├── backend/                      # Microservices (Docker)
│   ├── api-gateway/              # API Gateway (port 8000)
│   ├── auth-service/             # Auth Service (port 8001)
│   ├── chat-service/             # Chat Service (port 8002)
│   ├── message-service/          # Message Service (port 8003)
│   ├── websocket-gateway/        # WebSocket Gateway (port 8004)
│   ├── presence-service/         # Presence Service (port 8005)
│   ├── notification-service/     # Notification Service (port 8006)
│   └── media-service/            # Media Service (port 8007)
├── mobile/                       # Flutter mobile app
│   └── study_sync_mobile/        # Mobile application source
├── electron/                     # Electron desktop wrapper
│   └── main.js                   # Electron main process
├── docker-compose.yml            # Docker orchestration
├── vite.config.js                # Vite build config
├── package.json                  # Dependencies and scripts
├── SRS.md                        # Software Requirements Specification
└── DOCUMENTATION.md              # This file
```

---

## 4. Architecture

### 4.1 High-Level Architecture

StudySync follows a **three-tier architecture**:

1. **Presentation Tier**: React SPA with TailwindCSS, served via Vite
2. **Application Tier**: Express.js monolithic server + Docker-based microservices
3. **Data Tier**: Supabase (PostgreSQL) as primary, local JSON as cache, MEGA as backup

### 4.2 Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  React App   │────▶│  Express API │────▶│   Supabase   │
│  (Frontend)  │◀────│  (Backend)   │◀────│  (Database)  │
└──────────────┘     └──────┬───────┘     └──────────────┘
                            │
                     ┌──────┴───────┐
                     │  Local JSON  │  (Offline fallback)
                     │   db.json    │
                     └──────────────┘
```

### 4.3 Key Design Patterns

- **Offline-First**: All writes save locally first, then sync to cloud
- **Lazy Loading**: All pages are code-split and loaded on demand
- **Context-Based State**: Auth, Theme, Timer, and Notifications use React Context
- **Custom Hooks**: Business logic is encapsulated in reusable hooks
- **Generic CRUD**: A single endpoint pattern handles all collection types
- **Auto-Mapping**: camelCase ↔ snake_case conversion between JS and SQL

---

## 5. Frontend Documentation

### 5.1 Application Shell

The application is wrapped in four nested context providers:

```jsx
<ThemeProvider>          // Dark/light mode
  <AuthProvider>         // User session
    <TimerProvider>      // Global timer state
      <NotificationProvider>  // Push notifications
        <Router basename="/study">
          <BackgroundSlideshow />
          <ConnectionStatus />
          <TimerWidget />
          <Routes>...</Routes>
        </Router>
      </NotificationProvider>
    </TimerProvider>
  </AuthProvider>
</ThemeProvider>
```

### 5.2 Page Components

| Page | Route | Description |
|------|-------|-------------|
| **Dashboard** | `/` | Main analytics dashboard with charts, stats, and study overview |
| **Modules** | `/modules` | CRUD management of academic modules |
| **Module Detail** | `/modules/:id` | Aggregated view of all data for a specific module |
| **Study Logs** | `/logs` | Study session history with CSV export |
| **Tasks** | `/tasks` | Task management with priority and status |
| **Notes** | `/notes` | Rich note-taking with PDF support and sharing |
| **Flashcards** | `/flashcards` | Deck management, card creation, quiz mode |
| **Tutorials** | `/tutorials` | YouTube video tutorial library |
| **Calendar** | `/calendar` | Academic event calendar |
| **Kanban** | `/kanban` | Visual task board with drag-and-drop |
| **Grades** | `/grades` | Grade recording and GPA tracking |
| **Chat** | `/chat` | Real-time messaging hub with voice notes |
| **Deep Focus** | `/focus` | Distraction-free timer with ambient music |
| **Deep Analytics** | `/deep-analytics` | Advanced charts and statistical breakdowns |
| **Knowledge Graph** | `/knowledge-graph` | Interactive force-directed graph of knowledge |
| **SQL Visualizer** | `/sql` | Database query visualization tool |
| **Settings** | `/settings` | User preferences and account management |
| **Study Groups** | `/study-groups` | Study group creation and management |
| **Articles** | `/articles` | Curated educational articles |
| **Article Detail** | `/articles/:id` | Full article reader |
| **About** | `/about` | Application information |
| **Contact** | `/contact` | Contact form |
| **Privacy** | `/privacy` | Privacy policy |
| **Login** | `/login` | Authentication page |
| **Public Viewer** | `/share/:type/:id` | Public shared resource viewer |

### 5.3 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAnalytics` | Calculates dashboard statistics: total hours, active modules, weekly trends, streaks |
| `useChat` | Manages chat state: conversations, messages, sending, real-time subscriptions |
| `useFirestore` | Provides CRUD operations for all collections |
| `useGamification` | Handles XP calculation, level progression, and badge awarding |
| `usePresence` | Tracks user online/offline status and "last seen" timestamps |

### 5.4 Layout System

Every protected page is wrapped in the `<Layout>` component, which provides:
- Responsive sidebar navigation with collapsible groups
- Page header with user info and theme toggle
- Consistent padding and max-width constraints
- Dark/light theme support

### 5.5 UI Component Library

The application includes a custom component library in `src/components/ui/`:

| Component | Description |
|-----------|-------------|
| `Button` | Themed button with variants (primary, secondary, danger) |
| `Card` | Content card with shadow and border styles |
| `Input` | Form input with label and validation |
| `Modal` | Dialog overlay with header, body, and footer slots |
| `Toast` | Auto-dismissing notification popup |
| `AnimatedCard` | Card with Framer Motion entrance animations |
| `AnimatedBadge` | Achievement badge with celebration animation |
| `LoadingReactor` | Nuclear reactor-themed loading animation |
| `QuizModal` | Interactive flashcard quiz interface |
| `ShareToChatModal` | Resource sharing dialog for chat |
| `NotificationDialog` | Notification center dropdown |

---

## 6. Backend Documentation

### 6.1 Server Entry Point

The main server (`server/index.cjs`) is a monolithic Express application that handles:

- **Authentication**: Registration, login, JWT token management
- **Generic CRUD**: Unified endpoints for all 13 collection types
- **File Upload**: Multer → Supabase Storage pipeline
- **AI Chat**: Google Gemini AI integration for study assistance
- **Static Serving**: Serves the built React app in production
- **Health Check**: System status endpoint

### 6.2 Server Modules

| Module | File | Responsibility |
|--------|------|----------------|
| **Main Server** | `index.cjs` | Express app, routes, middleware |
| **Database** | `database.cjs` | Local JSON read/write engine |
| **Supabase Persistence** | `supabasePersistence.cjs` | Supabase CRUD with field mapping |
| **Sync Service** | `syncService.cjs` | Live stats calculation, data aggregation |
| **Email Service** | `emailService.cjs` | 9 email template types via Nodemailer |
| **Scheduler** | `scheduler_utf8.cjs` | Cron jobs for automated emails |
| **MEGA Persistence** | `megaPersistence.cjs` | Cloud backup to MEGA |
| **Backup** | `backup.cjs` | Manual backup utility |

### 6.3 Middleware Stack

```
helmet (CSP headers)
  → cors (origin whitelist)
    → express.json (body parser)
      → cookie-parser (session cookies)
        → rate-limiter (100 req/15min)
          → authenticateToken (JWT verification)
            → route handler
```

### 6.4 Generic Collection System

The server uses a unified CRUD pattern for 13 collection types:

```javascript
const collections = [
  'modules', 'studyLogs', 'tasks', 'notes', 'grades',
  'flashcardDecks', 'flashcards', 'calendarEvents',
  'pomodoroSessions', 'tutorials', 'conversations',
  'messages', 'groups'
];

const tableMap = {
  'studyLogs': 'study_logs',
  'flashcardDecks': 'flashcard_decks',
  'calendarEvents': 'calendar_events',
  'pomodoroSessions': 'pomodoro_sessions',
  // ... single-name collections map to themselves
};
```

Each collection shares the same REST endpoints:
- `GET /api/:collection` — Fetch all user items
- `POST /api/:collection` — Create item
- `PUT /api/:collection/:id` — Update item
- `DELETE /api/:collection/:id` — Delete item

### 6.5 Docker Microservices

For advanced deployment, the application includes Docker-based microservices:

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| API Gateway | 8000 | Express | Request routing and auth validation |
| Auth Service | 8001 | Express + MongoDB | User authentication |
| Chat Service | 8002 | Express + MongoDB | Chat room management |
| Message Service | 8003 | Express + Kafka | Message persistence and delivery |
| WebSocket Gateway | 8004 | Socket.io + Redis | Real-time message broadcasting |
| Presence Service | 8005 | Express + Redis | Online status tracking |
| Notification Service | 8006 | Express + Kafka | Push notification management |
| Media Service | 8007 | Express + Multer | File upload and storage |

---

## 7. Database Schema

### 7.1 Supabase Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| `modules` | Academic subjects/courses | name, description, target_hours |
| `study_logs` | Study session records | module_id, hours, duration, date, activity |
| `tasks` | Todo items | module_id, title, priority, status, due_date |
| `notes` | Study notes | module_id, title, content, resource_link, pdf_path |
| `grades` | Assessment scores | module_id, type, score, weight, date |
| `flashcard_decks` | Card collections | module_id, name, description |
| `flashcards` | Individual cards | deck_id, question, answer, level |
| `calendar_events` | Schedule events | title, start_time, end_time, type, module_id |
| `pomodoro_sessions` | Focus sessions | module_id, duration, completed_at |
| `tutorials` | YouTube tutorials | module_id, title, url, video_id, topic |
| `conversations` | Chat conversations | type, participants (JSONB), last_message |
| `messages` | Chat messages | conversation_id, sender_id, content, type |
| `groups` | Study groups | name, description, members (JSONB) |
| `profiles` | User profiles | email, name, xp, level, badges (JSONB) |
| `users` | Legacy user table | email, name, password (hashed) |

### 7.2 Row-Level Security

All tables have RLS enabled with permissive policies for authenticated access. User isolation is enforced at the application layer via `user_id` filtering.

---

## 8. Authentication & Security

### 8.1 Authentication Flow

1. **Registration**: Email + password → bcrypt hash → Store in `users` table → Issue JWT
2. **Login**: Email + password → bcrypt.compare → Issue JWT (24h expiry) → Set cookie
3. **Authorization**: JWT extracted from `Authorization: Bearer <token>` header or cookie → Verified → User ID injected into `req.user`

### 8.2 Security Measures

| Measure | Implementation |
|---------|----------------|
| **Password Hashing** | bcrypt with 10 salt rounds |
| **JWT Tokens** | HS256 signed, configurable expiry |
| **CSP Headers** | Strict Content-Security-Policy via Helmet |
| **Rate Limiting** | 100 requests/15min (general), 5/10sec (auth) |
| **CORS** | Whitelist: localhost:5173, joshwebs.co.zw |
| **Input Validation** | File type/size validation on uploads |
| **HTTP-Only Cookies** | Session tokens in production mode |

---

## 9. Data Persistence & Sync

### 9.1 Three-Layer Strategy

```
Layer 1: Local JSON (db.json)     → Immediate writes, offline support
Layer 2: Supabase (PostgreSQL)    → Primary cloud storage, real-time
Layer 3: MEGA Cloud               → Scheduled backup redundancy
```

### 9.2 Sync Flow

1. User action triggers local write to `db.json`
2. Background async call upserts to Supabase via `supabasePersistence.cjs`
3. On failure, item is marked `local-only` and retried on next sync
4. Data fetch prioritizes Supabase, falls back to local JSON

### 9.3 Field Mapping

The `mapToTable()` function auto-converts JavaScript camelCase to PostgreSQL snake_case:

```
moduleId → module_id
createdAt → created_at
flashcardDecks → flashcard_decks
```

The inverse `mapRow()` converts back on reads.

---

## 10. Gamification System

### 10.1 XP Calculation

| Action | XP Earned |
|--------|-----------|
| Study 1 hour | 100 XP |
| Complete a task | 150 XP |
| Maintain daily streak | 200 XP per day |
| Complete a Pomodoro | Based on duration × 100 |

### 10.2 Level Progression

- **Formula**: `Level = floor(totalXP / 1000) + 1`
- Level 1: 0–999 XP
- Level 2: 1000–1999 XP
- Level 3: 2000–2999 XP
- And so on...

### 10.3 Badges

| Badge | Requirement | Icon |
|-------|-------------|------|
| **Persistence** | 3-day study streak | 🔥 Flame |
| **Scholar** | 10+ total study hours | 🎯 Target |
| **Focus King** | 5+ completed tasks | 🏆 Award |

Badges are persisted in the `profiles.badges` JSONB column and displayed in the user's dashboard.

---

## 11. Email Engagement System

### 11.1 Email Types

| Email | Trigger | Content |
|-------|---------|---------|
| **Daily Study Report** | Cron: 7:00 AM daily | Hours studied, tasks completed, AI prediction |
| **Tutorial Guide** | Cron: Mondays 9:00 AM | Weekly learning resource recommendations |
| **Active Recall Snippet** | Cron: Daily (staggered) | Random flashcard for spaced repetition |
| **Deadline Alert** | Cron: Tasks due in 24h | Urgent task warning + AI study advice |
| **Milestone Reward** | On achievement | Celebration email for XP milestones |
| **Weekly Retrospective** | Cron: Sundays 8:00 PM | XP growth, content mastery, peak performance |
| **Unified Engagement** | Cron: consolidated | Combined stats, rewards, deadlines, recall |
| **Email Recovery** | On support request | Account recovery notification |
| **Service Restoration** | On system fix | Service restored notification |

### 11.2 Scheduler

The scheduler (`scheduler_utf8.cjs`) uses `node-cron` to trigger automated emails:

```javascript
// Daily report: every day at 07:00
cron.schedule('0 7 * * *', runDailyReports);

// Weekly tutorials: Mondays at 09:00
cron.schedule('0 9 * * 1', runWeeklyTutorials);

// Weekly retrospective: Sundays at 20:00
cron.schedule('0 20 * * 0', runWeeklyRetrospectives);
```

---

## 12. Chat & Collaboration

### 12.1 Features
- **Direct Messages**: 1-to-1 private conversations
- **Study Groups**: Multi-user group chat rooms
- **Chat Requests**: Opt-in system for privacy
- **Message Types**: Text, voice notes, file attachments, shared resources
- **Message Status**: Sent → Delivered → Read (color-coded indicators)
- **Presence**: Online/offline status, last seen timestamps
- **Reactions**: Emoji reactions on messages

### 12.2 Real-Time Architecture
- **Supabase Realtime**: WebSocket subscriptions for live message updates
- **Polling Fallback**: Periodic API polling for reliability
- **Optimistic Updates**: Messages appear instantly before server confirmation

### 12.3 Resource Sharing
Users can share tutorials, flashcards, and notes directly into chat conversations via the `ShareToChatModal` component. Shared resources render as rich preview cards within the chat.

---

## 13. AI Integration

### 13.1 Google Gemini AI

The application integrates Google Gemini (`gemini-2.0-flash`) for:

1. **Study Predictions**: AI-generated insights in daily email reports
2. **Study Advice**: Tailored advice for upcoming deadlines
3. **Chat Assistant**: In-app AI chat for study questions

### 13.2 Implementation

```javascript
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const result = await model.generateContent(prompt);
```

---

## 14. Deployment

### 14.1 Render Deployment

The application is deployed on Render with the following configuration:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install; npm run build` |
| **Start Command** | `npm start` (runs `node server/index.cjs`) |
| **Node Version** | 22.x (default) |
| **Environment** | Environment variables set in Render dashboard |

### 14.2 Production URL

The application is served at `https://www.joshwebs.co.zw/study` with the React Router `basename="/study"`.

### 14.3 Build Process

```bash
# Development
npm run dev          # Starts Vite + Express concurrently

# Production build
npm run build        # Vite builds to dist/

# Production start
npm start            # Express serves dist/ and API
```

---

## 15. Mobile Application

### 15.1 Flutter Mobile App

Located in `mobile/study_sync_mobile/`, the mobile app provides:

- Authentication (login/register via custom Supabase RPC)
- Real-time chat
- Study data viewing (synced from Supabase)
- Push notifications

### 15.2 Architecture

The mobile app uses **BLoC pattern** with:
- `lib/core/di/` — Dependency injection
- Data sources connecting to the same Supabase backend
- Repository pattern for data access

---

## 16. Desktop Application

### 16.1 Electron Wrapper

The Electron configuration in `electron/main.js` wraps the React web app for Windows deployment:

```json
{
  "appId": "com.studysync.desktop",
  "productName": "StudySync",
  "win": {
    "target": "nsis"
  }
}
```

### 16.2 Building

```bash
npm run electron:build    # Build for Windows
npm run electron:dev      # Development with hot reload
```

The installer is generated in `dist_electron/` and can be downloaded via the `/api/download/installer` endpoint.

---

## 17. Configuration

### 17.1 Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server
PORT=3001
JWT_SECRET=your-jwt-secret
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI
GEMINI_API_KEY=your-gemini-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# MEGA Backup
MEGA_EMAIL=your-mega-email
MEGA_PASSWORD=your-mega-password
```

### 17.2 NPM Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `concurrently dev:frontend dev:backend` | Full development mode |
| `dev:frontend` | `vite --host` | Vite dev server |
| `dev:backend` | `node server/index.cjs` | Express server |
| `build` | `vite build` | Production build |
| `start` | `node server/index.cjs` | Production start |
| `backup` | `node server/backup.cjs` | Manual data backup |

---

## 18. API Reference

### 18.1 Authentication

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/auth/register` | `{ email, password, name }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` |

### 18.2 Generic Collections

All endpoints require `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/:collection` | List all items for authenticated user |
| POST | `/api/:collection` | Create new item |
| PUT | `/api/:collection/:id` | Update item by ID |
| DELETE | `/api/:collection/:id` | Delete item by ID |

**Supported collections**: `modules`, `studyLogs`, `tasks`, `notes`, `grades`, `flashcardDecks`, `flashcards`, `calendarEvents`, `pomodoroSessions`, `tutorials`, `conversations`, `messages`, `groups`

### 18.3 Specialized Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server health check |
| POST | `/api/upload` | Upload file to Supabase Storage |
| GET | `/api/download/installer` | Download desktop installer |
| POST | `/api/ai/chat` | Send prompt to Gemini AI |
| PUT | `/api/heartbeat` | Update user's last seen timestamp |
| GET | `/api/public/shared/:type/:id` | Fetch publicly shared resource |
| POST | `/api/user/badges` | Persist earned badge |
| GET | `/api/user/profile` | Get user profile with XP data |

---

## 19. Troubleshooting

### 19.1 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Build fails with JSX errors | Mismatched tags or typos in `.jsx` files | Check Render build logs for exact line numbers |
| Sync fails with `PGRST204` | Missing column in Supabase schema | Run `ALTER TABLE ... ADD COLUMN` in SQL Editor |
| Emails not sending | Invalid SMTP credentials or network issues | Verify `SMTP_USER` and `SMTP_PASS` in `.env` |
| Chat messages not delivering | Supabase Realtime not configured | Enable Realtime on `messages` table in Supabase |
| 404 on page refresh | Missing basename or server config | Ensure `basename="/study"` in Router and server serves `index.html` for all routes |
| White screen on load | JS error in lazy-loaded component | Check browser console for import errors |

### 19.2 Useful Commands

```bash
# Check server health
curl https://www.joshwebs.co.zw/study/api/health

# Force sync all data
node server/force_sync_all.cjs

# Verify Supabase sync
node server/verify_supabase_sync.cjs

# Restore from Supabase
node server/restore_from_supabase.cjs

# Send test email
node server/debug_email_test.js

# Clean up test users
node server/cleanup_test_users.cjs
```

---

*This documentation is auto-generated and maintained alongside the codebase. For the Software Requirements Specification, see [SRS.md](SRS.md).*
