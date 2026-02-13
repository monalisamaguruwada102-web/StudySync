import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TimerProvider } from './context/TimerContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import ConnectionStatus from './components/ConnectionStatus';
import TimerWidget from './components/TimerWidget';

import BackgroundSlideshow from './components/layout/BackgroundSlideshow';

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
const ModuleDetail = React.lazy(() => import('./pages/ModuleDetail'));
const Tutorials = React.lazy(() => import('./pages/Tutorials'));
const Chat = React.lazy(() => import('./pages/Chat'));
const PublicViewer = React.lazy(() => import('./pages/PublicViewer'));

// Loading Screen Component
const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
  </div>
);

function App() {


  return (
    <ThemeProvider>
      <AuthProvider>
        <TimerProvider>
          <NotificationProvider>
            <Router>
              {/* Global Background */}
              <BackgroundSlideshow />

              {/* App Content */}
              <div className="relative z-10 min-h-screen">
                <ConnectionStatus />
                <TimerWidget />
                <React.Suspense fallback={<LoadingScreen />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />

                    {/* Public Sharing Routes */}
                    <Route path="/share/tutorials/:id" element={<PublicViewer />} />
                    <Route path="/share/flashcards/:id" element={<PublicViewer />} />

                    <Route element={<ProtectedRoute />}>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/modules" element={<Modules />} />
                      <Route path="/tutorials" element={<Tutorials />} />
                      <Route path="/tutorials/shared/:id" element={<Tutorials />} />
                      <Route path="/notes" element={<Notes />} />
                      <Route path="/notes/shared/:id" element={<Notes />} />
                      <Route path="/logs" element={<StudyLogs />} />
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/grades" element={<Grades />} />
                      <Route path="/flashcards" element={<Flashcards />} />
                      <Route path="/calendar" element={<Calendar />} />
                      <Route path="/kanban" element={<Kanban />} />
                      <Route path="/sql" element={<SQLVisualizer />} />
                      <Route path="/deep-analytics" element={<DeepAnalytics />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/focus" element={<DeepFocus />} />
                      <Route path="/chat" element={<Chat />} />
                      {/* Analytics link points to dashboard as it contains the main charts */}
                      <Route path="/analytics" element={<Dashboard />} />
                    </Route>
                  </Routes>
                </React.Suspense>
              </div>
            </Router>
          </NotificationProvider>
        </TimerProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
