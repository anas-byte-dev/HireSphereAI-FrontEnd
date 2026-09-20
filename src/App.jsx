import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Jobs from './pages/Jobs';
import JobDetails from './pages/JobDetails';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Applications from './pages/Applications';
import SavedJobs from './pages/SavedJobs';
import Interviews from './pages/Interviews';
import Notifications from './pages/Notifications';
import AiInterview from './pages/AiInterview';

function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <Router>
          <ScrollToTop />
          <div className="app-layout">
            <Navbar />
            <main className="main-content">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/jobs" element={<Jobs />} />
                <Route path="/jobs/:id" element={<JobDetails />} />
                <Route path="/ai-coach" element={<AiInterview />} />
                <Route path="/interview-coach" element={<AiInterview />} />

              {/* Candidate Routes */}
              <Route
                path="/dashboard/candidate"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <CandidateDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/profile"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/applications"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved-jobs"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <SavedJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/saved-jobs"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <SavedJobs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/interviews"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <Interviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/candidate/notifications"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE']}>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Recruiter Routes */}
              <Route
                path="/dashboard/recruiter"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/jobs"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <RecruiterDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/profile"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <Profile initialTab="recruiter" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <Profile initialTab="company" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/company"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <Profile initialTab="company" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applicants"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/recruiter/applicants"
                element={
                  <ProtectedRoute allowedRoles={['RECRUITER']}>
                    <Applications />
                  </ProtectedRoute>
                }
              />

              {/* Admin Routes */}
              <Route
                path="/dashboard/admin"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard initialTab="users" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/jobs"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard initialTab="jobs" />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <ProtectedRoute allowedRoles={['ADMIN']}>
                    <AdminDashboard initialTab="applications" />
                  </ProtectedRoute>
                }
              />

              {/* Shared Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications"
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interviews"
                element={
                  <ProtectedRoute allowedRoles={['CANDIDATE', 'RECRUITER']}>
                    <Interviews />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
