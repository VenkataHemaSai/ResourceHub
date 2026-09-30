import { createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import PublicLayout from "@/layouts/PublicLayout";
import LandingPage from "@/pages/landing/LandingPage";
import HomePage from "@/pages/dashboard/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import TeamPage from "@/pages/team/TeamPage";
import ResourcesPage from "@/pages/resources/ResourcesPage";
import ReservationsPage from "@/pages/reservations/ReservationsPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RoleGate } from "@/components/shared/RoleGate";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "resources", element: <ResourcesPage /> },
      { path: "reservations", element: <ReservationsPage /> },
      {
        path: "team",
        element: (
          <RoleGate allowedRoles={['ADMIN']}>
            <TeamPage />
          </RoleGate>
        ),
      },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
