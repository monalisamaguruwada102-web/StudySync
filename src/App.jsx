import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionStatus from './components/ConnectionStatus';

// Assets
import bg1 from './assets/images/login-bg-1.png';
import bg2 from './assets/images/login-bg-2.png';
import bg3 from './assets/images/login-bg-3.jpg';

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
import Settings from './pages/Settings';
import StudyGroups from './pages/StudyGroups';
import DeepFocus from './pages/DeepFocus';

function App() {
  const [bgIndex, setBgIndex] = useState(0);
  const backgrounds = [bg1, bg2, bg3];

  // Background Slideshow
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % backgrounds.length);
    }, 5000); // Change image every 5 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {/* Global Background */}
          <div className="fixed inset-0 z-0">
            {backgrounds.map((bg, index) => (
              <div
                key={index}
                className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${index === bgIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                style={{ backgroundImage: `url(${bg})` }}
              />
            ))}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
          </div>

          {/* App Content */}
          <div className="relative z-10 min-h-screen">
            <ConnectionStatus />
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
                <Route path="/deep-analytics" element={<DeepAnalytics />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/focus" element={<DeepFocus />} />
                {/* Analytics link points to dashboard as it contains the main charts */}
                <Route path="/analytics" element={<Dashboard />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
