import { createBrowserRouter, Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import PublicLayout from "@/layouts/PublicLayout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UiShowcase from "@/pages/UiShowcase";
import TeamPage from "@/pages/TeamPage";
import ResourcesPage from "@/pages/ResourcesPage";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { RoleGate } from "@/components/shared/RoleGate";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "resources",
        element: <ResourcesPage />,
      },
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
  {
    path: "_ui",
    element: <UiShowcase />,
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
