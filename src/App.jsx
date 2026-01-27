import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Modules from './pages/Modules';
import StudyLogs from './pages/StudyLogs';
import Tasks from './pages/Tasks';
import Notes from './pages/Notes';
import Grades from './pages/Grades';
import Flashcards from './pages/Flashcards';
import Calendar from './pages/Calendar';
import Kanban from './pages/Kanban';
import SQLVisualizer from './pages/SQLVisualizer';
import DeepAnalytics from './pages/DeepAnalytics';
import Planner from './pages/Planner';
import Settings from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/modules" element={<Modules />} />
              <Route path="/logs" element={<StudyLogs />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/grades" element={<Grades />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/kanban" element={<Kanban />} />
              <Route path="/sql" element={<SQLVisualizer />} />
              <Route path="/deep-analytics" element={<DeepAnalytics />} />
              <Route path="/planner" element={<Planner />} />
              <Route path="/settings" element={<Settings />} />
              {/* Analytics link points to dashboard as it contains the main charts */}
              <Route path="/analytics" element={<Dashboard />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
