import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthContext";
import { LoadingState } from "@/components/shared/LoadingState";

export default function PublicLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingState fullScreen message="Loading..." />;
  }

  // If already logged in, redirect them away from the public layout (login/register)
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md mt-16">
        <div className="mb-16 flex justify-center">
          <img 
            src="/logo.png" 
            alt="ResourceHub Logo" 
            className="h-32 w-auto object-contain transform scale-[2.5]" 
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
