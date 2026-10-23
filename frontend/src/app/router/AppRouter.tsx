import { createBrowserRouter, type RouteObject } from "react-router";
import { RouterProvider } from "react-router/dom";
import { DashboardLayout } from "@/app/layouts/DashboardLayout";
import { OverviewPage } from "@/features/doctors/pages/OverviewPage";
import { AllDoctorsPage } from "@/features/doctors/pages/AllDoctorsPage";
import { AIAssistantPage } from "@/features/assistant/pages/AIAssistantPage";
import { DoctorDetailsPage } from "@/features/doctors/pages/DoctorDetailsPage";
import { MyAppointmentsPage } from "@/features/appointments/pages/MyAppointmentsPage";
import { MyProfilePage } from "@/features/profile/pages/MyProfilePage";
import { SettingsPage } from "@/features/settings/pages/SettingsPage";
import { LoginPage, RegisterPage } from "@/features/auth/pages/AuthPages";
import { ForgotPasswordPage } from "@/features/auth/pages/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/pages/ResetPasswordPage";
import { resetPasswordLoader } from "@/features/auth/resetPasswordLoader";
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute";
import { VerifyEmailPage } from "@/features/auth/pages/VerifyEmailPage";
import { verificationLoader } from "@/features/auth/verificationLoader";
import { ConfirmEmailChangePage } from "@/features/auth/pages/ConfirmEmailChangePage";
import { emailChangeLoader } from "@/features/auth/emailChangeLoader";

const routes: RouteObject[] = [
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: "/", element: <OverviewPage /> },
          { path: "/doctors", element: <AllDoctorsPage /> },
          { path: "/assistant", element: <AIAssistantPage /> },
          { path: "/doctors/:doctorId", element: <DoctorDetailsPage /> },
          { path: "/appointments", element: <MyAppointmentsPage /> },
          { path: "/profile", element: <MyProfilePage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
      { path: "/admin", element: <h1>Admin Dashboard</h1> },
    ],
  },
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  {
    path: "/reset-password",
    loader: resetPasswordLoader,
    element: <ResetPasswordPage />,
  },
  {
    path: "/verify-email",
    loader: verificationLoader,
    element: <VerifyEmailPage />,
  },
  {
    path: "/confirm-email-change",
    loader: emailChangeLoader,
    element: <ConfirmEmailChangePage />,
  },
];

const router = createBrowserRouter(routes);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
