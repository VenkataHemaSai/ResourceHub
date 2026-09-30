import { createBrowserRouter, Outlet } from "react-router-dom";
import AppLayout from "@/layouts/AppLayout";
import PublicLayout from "@/layouts/PublicLayout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UiShowcase from "@/pages/UiShowcase";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "resources",
        element: <div className="p-4">Resources List (Coming Soon)</div>,
      },
    ],
  },
  {
    element: <PublicLayout />,
    children: [
      { path: "login", element: <LoginPage /> },
      {
        path: "register",
        element: (
          <div className="p-4 bg-card rounded border">
            Register Form (Coming Soon)
          </div>
        ),
      },
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
