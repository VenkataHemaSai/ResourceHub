import { Outlet, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { RoleGate } from "@/components/shared/RoleGate";

export default function AppLayout() {
  const { logout, isLoggingOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-20 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center">
              <img 
                src="/logo-cropped.png" 
                alt="ResourceHub Logo" 
                className="h-10 w-auto object-contain" 
              />
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link
                to="/dashboard"
                className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard/resources"
                className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Resources
              </Link>
              <Link
                to="/dashboard/reservations"
                className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Reservations
              </Link>
              <RoleGate allowedRoles={['ADMIN']}>
                <Link
                  to="/dashboard/team"
                  className="text-sm font-medium transition-colors hover:text-foreground/80 text-foreground/60"
                >
                  Team
                </Link>
              </RoleGate>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden md:inline">Profile</span>
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => logout()} disabled={isLoggingOut}>
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Log Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
