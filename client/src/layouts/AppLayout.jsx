import { useState } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LogOut, Menu, X, LayoutDashboard, Box, CalendarDays, Users, BookOpen, ShieldOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { RoleGate } from '@/components/shared/RoleGate';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-foreground underline underline-offset-4 decoration-primary decoration-2'
      : 'text-foreground/60 hover:text-foreground/80'
  }`;

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/dashboard/resources', label: 'Resources', icon: Box },
  { to: '/dashboard/reservations', label: 'Reservations', icon: CalendarDays },
];

const ADMIN_LINKS = [
  { to: '/dashboard/team', label: 'Team', icon: Users },
  { to: '/dashboard/admin/reservations', label: 'All Bookings', icon: BookOpen },
  { to: '/dashboard/admin/bans', label: 'Suspensions', icon: ShieldOff },
];

function MobileNav({ open, onClose }) {
  const { user, organization, logout, isLoggingOut } = useAuth();

  const mobileLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-foreground/70 hover:bg-muted hover:text-foreground'
    }`;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:hidden fixed inset-y-0 left-0 top-0 h-full w-72 max-w-full p-0 rounded-none border-r translate-x-0 data-[state=open]:translate-x-0 data-[state=closed]:-translate-x-full">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-5 border-b">
            <Link to="/dashboard" onClick={onClose}>
              <img src="/logo-cropped.png" alt="ResourceHub" className="h-8 w-auto object-contain" />
            </Link>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {NAV_LINKS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={mobileLinkClass} onClick={onClose}>
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </NavLink>
            ))}

            <RoleGate allowedRoles={['ADMIN']}>
              <div className="pt-3 pb-1 px-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Admin</p>
              </div>
              {ADMIN_LINKS.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to} className={mobileLinkClass} onClick={onClose}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              ))}
            </RoleGate>
          </nav>

          <div className="border-t px-4 py-4 space-y-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{organization?.name}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-2"
              onClick={() => { logout(); onClose(); }}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AppLayout() {
  const { user, organization, logout, isLoggingOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="flex items-center">
              <img
                src="/logo-cropped.png"
                alt="ResourceHub Logo"
                className="h-8 w-auto object-contain"
              />
            </Link>

            <nav className="hidden md:flex gap-6">
              {NAV_LINKS.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end} className={navLinkClass}>
                  {label}
                </NavLink>
              ))}
              <RoleGate allowedRoles={['ADMIN']}>
                {ADMIN_LINKS.map(({ to, label }) => (
                  <NavLink key={to} to={to} className={navLinkClass}>
                    {label}
                  </NavLink>
                ))}
              </RoleGate>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-medium leading-tight">{user?.name}</span>
              <span className="text-xs text-muted-foreground leading-tight">{organization?.name}</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="hidden md:flex gap-2"
              onClick={() => logout()}
              disabled={isLoggingOut}
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <main className="flex-1 container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
