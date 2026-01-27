# StudySync - Personal Study Monitoring Website

A premium, web-based study monitoring tool designed for a single IT student to track modules, study sessions, tasks, and learning analytics. **Now powered by a local Node.js backend.**

## Features

- **Local Authentication**: Secure login with JWT and local database.
- **Dynamic Dashboard**: Overview of total study hours, active modules, pending tasks, and study streaks.
- **Module Management**: CRUD operations for academic modules with target hour tracking.
- **Study Log System**: Detailed tracking of study sessions including topic and time spent.
- **Task & Assignment Tracker**: Deadline management with status tracking and overdue highlighting.
- **Notes & Resources**: Quick capture of important notes and resource links grouped by module.
- **Learning Analytics**: Visual representation of study trends and module distribution using Chart.js.
- **Premium UI/UX**: Clean, responsive design with smooth animations and modern aesthetics.

## Tech Stack

- **Frontend**: React.js, Tailwind CSS (v4), Chart.js, Framer Motion, Lucide-react.
- **Backend**: Node.js, Express, JSON-based Persistence.
- **Tools**: Vite, Axios, JWT.

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Run the application**:
   ```bash
   npm run dev
   ```
   *This will start both the frontend ([http://localhost:5173](http://localhost:5173)) and the backend server ([http://localhost:3001](http://localhost:3001)) concurrently.*

3. **Login**:
   - Use the pre-filled credentials:
     - **Email**: `joshuamujakari15@gmail.com`
     - **Password**: `joshua#$#$`
   - The first login will automatically create your account and set you as the system owner.

## Project Structure

```text
src/
├── components/       # UI and Layout components
├── context/          # AuthContext
├── hooks/            # useFirestore, useAnalytics
├── pages/            # Login, Dashboard, Modules, StudyLogs, Tasks, Notes
└── services/         # API and Auth services
server/
├── index.js          # Express server
└── database.js       # JSON DB handler
└── db.json          # Local data storage (auto-generated)
```
