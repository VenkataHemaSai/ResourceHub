import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LoadingState } from "@/components/shared/LoadingState";
import { Navbar, Footer } from "@/components/shared/Navbar";

export default function PublicLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState fullScreen message="Loading..." />;
  }

  // If already logged in, redirect them away from the public layout (login/register)
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md mt-4 mb-16">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
