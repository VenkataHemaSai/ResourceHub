import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

function NavLink({ to, children, external }) {
  if (external) {
    return (
      <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="relative text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 group"
      >
        {children}
        <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
      </a>
    );
  }
  return (
    <Link
      to={to}
      className="relative text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-200 group"
    >
      {children}
      <span className="absolute -bottom-0.5 left-0 h-[1.5px] w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left" />
    </Link>
  );
}

export function Navbar() {
  const { isAuthenticated } = useAuth();

  return (
    <header className="border-b border-white/10 bg-[#09090b]/95 backdrop-blur supports-[backdrop-filter]:bg-[#09090b]/80 sticky top-0 z-50">
      <div className="max-w-screen-xl flex h-14 items-center justify-between px-6 mx-auto">
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="flex items-center shrink-0">
          <img
            src="/logo-cropped.png"
            alt="ResourceHub"
            className="h-10 w-auto object-contain"
          />
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/#features">Features</NavLink>
          <NavLink to="/#how-it-works">How It Works</NavLink>
          <NavLink to="/#pricing">Pricing</NavLink>
          {isAuthenticated && <NavLink to="/dashboard">Dashboard</NavLink>}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-5">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm" className="h-8 px-4 text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg shadow-primary/20">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <NavLink to="/login">Sign In</NavLink>
              <Link to="/register">
                <Button size="sm" className="h-8 px-4 text-xs font-bold uppercase tracking-wider rounded-sm shadow-lg shadow-primary/20">
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-8 bg-[#09090b]">
      <div className="max-w-screen-xl text-center text-xs text-muted-foreground px-6 mx-auto uppercase tracking-widest">
        &copy; {new Date().getFullYear()} ResourceHub. All rights reserved.
      </div>
    </footer>
  );
}
