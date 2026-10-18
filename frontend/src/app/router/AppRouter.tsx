import { createBrowserRouter, type RouteObject } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { DashboardLayout } from '@/app/layouts/DashboardLayout'
import { OverviewPage } from '@/features/doctors/pages/OverviewPage'
import { AIAssistantPage } from '@/features/assistant/pages/AIAssistantPage'
import { DoctorDetailsPage } from '@/features/doctors/pages/DoctorDetailsPage'
import { MyAppointmentsPage } from '@/features/appointments/pages/MyAppointmentsPage'
import { MyProfilePage } from '@/features/profile/pages/MyProfilePage'
import { SettingsPage } from '@/features/settings/pages/SettingsPage'
import { ForgotPasswordPage, LoginPage, RegisterPage } from '@/features/auth/pages/AuthPages'
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute'

const routes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: '/', element: <OverviewPage /> },
          { path: '/assistant', element: <AIAssistantPage /> },
          { path: '/doctors/:doctorId', element: <DoctorDetailsPage /> },
          { path: '/appointments', element: <MyAppointmentsPage /> },
          { path: '/profile', element: <MyProfilePage /> },
          { path: '/settings', element: <SettingsPage /> },
        ],
      },
      { path: '/admin', element: <h1>Admin Dashboard</h1> },
    ],
  },
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
]

const router = createBrowserRouter(routes)

export function AppRouter() {
  return <RouterProvider router={router} />
}

