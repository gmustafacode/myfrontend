import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from '@/lib/auth'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import DashboardLayout from '@/layouts/DashboardLayout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Terms from '@/pages/Terms'
import FacebookPrivacy from '@/pages/FacebookPrivacy'
import Dashboard from '@/pages/dashboard/Dashboard'
import Composer from '@/pages/dashboard/Composer'
import Calendar from '@/pages/dashboard/Calendar'
import Analytics from '@/pages/dashboard/Analytics'
import Connect from '@/pages/dashboard/Connect'
import Queue from '@/pages/dashboard/Queue'
import Settings from '@/pages/dashboard/Settings'
import Automation from '@/pages/dashboard/Automation'
import AccountSeo from '@/pages/dashboard/AccountSeo'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          {/* Public routes */}
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/facebook/privacy" element={<FacebookPrivacy />} />

          {/* Protected dashboard routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="composer" element={<Composer />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="connect" element={<Connect />} />
            <Route path="queue" element={<Queue />} />
            <Route path="settings" element={<Settings />} />
            <Route path="automation" element={<Automation />} />
            <Route path="account-seo" element={<AccountSeo />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        <Toaster
          position="top-right"
          richColors
          expand={false}
          duration={4000}
        />
      </BrowserRouter>
    </AuthProvider>
  )
}
