import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import VoterManagement from "./pages/VoterManagement";
import TaskManagement from "./pages/TaskManagement";
import NotificationModule from "./pages/NotificationModule";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import Layout from "./components/Layout";
import Village from './pages/Village';  ///....new added 
import Appointment from './pages/Appointment';  ///....new added
import Service from './pages/Service';  ///....new added

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/users" element={<UserManagement />} />
                      <Route path="/voters" element={<VoterManagement />} />
                      <Route path="/tasks" element={<TaskManagement />} />
                      <Route
                        path="/notifications"
                        element={<NotificationModule />}
                      />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/audit-logs" element={<AuditLogs />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/village" element={<Village />} /> {/* ///....new added */}
                      <Route path="/appointment" element={<Appointment />} /> {/* ///....new added */}
                      <Route path="/service" element={<Service />} /> {/* ///....new added */}
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
