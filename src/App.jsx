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

// Pages - Lazy Loaded
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Modules = React.lazy(() => import('./pages/Modules'));
const StudyLogs = React.lazy(() => import('./pages/StudyLogs'));
const Tasks = React.lazy(() => import('./pages/Tasks'));
const Notes = React.lazy(() => import('./pages/Notes'));
const Grades = React.lazy(() => import('./pages/Grades'));
const Flashcards = React.lazy(() => import('./pages/Flashcards'));
const Calendar = React.lazy(() => import('./pages/Calendar'));
const Kanban = React.lazy(() => import('./pages/Kanban'));
const SQLVisualizer = React.lazy(() => import('./pages/SQLVisualizer'));
const DeepAnalytics = React.lazy(() => import('./pages/DeepAnalytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const StudyGroups = React.lazy(() => import('./pages/StudyGroups'));
const DeepFocus = React.lazy(() => import('./pages/DeepFocus'));

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

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
            <React.Suspense fallback={<LoadingScreen />}>
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
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/focus" element={<DeepFocus />} />
                  {/* Analytics link points to dashboard as it contains the main charts */}
                  <Route path="/analytics" element={<Dashboard />} />
                </Route>
              </Routes>
            </React.Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
