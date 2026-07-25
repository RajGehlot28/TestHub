import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { GuestRoute } from './components/GuestRoute.jsx';

import { LandingPage } from './pages/LandingPage.jsx';
import { LoginStudent } from './pages/LoginStudent.jsx';
import { RegisterStudent } from './pages/RegisterStudent.jsx';
import { LoginTeacher } from './pages/LoginTeacher.jsx';


import { TeacherDashboard } from './pages/TeacherDashboard.jsx';
import { CreateTestWizard } from './pages/CreateTestWizard.jsx';
import { TeacherTestResults } from './pages/TeacherTestResults.jsx';

import { StudentDashboard } from './pages/StudentDashboard.jsx';
import { StudentTestRunner } from './pages/StudentTestRunner.jsx';
import { StudentTestResultView } from './pages/StudentTestResultView.jsx';



export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Public / Guest-only Routes */}
              <Route path="/" element={<GuestRoute><LandingPage /></GuestRoute>} />
              <Route path="/login-student" element={<GuestRoute><LoginStudent /></GuestRoute>} />
              <Route path="/register-student" element={<GuestRoute><RegisterStudent /></GuestRoute>} />
              <Route path="/login-teacher" element={<GuestRoute><LoginTeacher /></GuestRoute>} />


              {/* Teacher Protected Routes */}
              <Route
                path="/teacher/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/create-test"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <CreateTestWizard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teacher/tests/:testId/results"
                element={
                  <ProtectedRoute allowedRoles={['teacher']}>
                    <TeacherTestResults />
                  </ProtectedRoute>
                }
              />

              {/* Student Protected Routes */}
              <Route
                path="/student/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/student/results/:resultId"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentTestResultView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/test/:testCode"
                element={
                  <ProtectedRoute allowedRoles={['student']}>
                    <StudentTestRunner />
                  </ProtectedRoute>
                }
              />


            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
