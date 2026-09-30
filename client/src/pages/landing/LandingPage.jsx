import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Shield, Zap, ArrowRight, Layers } from 'lucide-react';
import { Navbar, Footer } from '@/components/shared/Navbar';
import { useAuth } from '@/context/AuthContext';
import { FloatingDots } from '@/components/shared/FloatingDots';

export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  
  // Intentionally removed all automatic redirects. 
  // You will ALWAYS see this page when you visit /

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col font-sans selection:bg-primary/30">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Floating glowing dots */}
        <FloatingDots />

        {/* Dynamic Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] overflow-hidden pointer-events-none">
          <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/20 blur-[150px] rounded-[100%]" />
          <div className="absolute top-[20%] left-[20%] w-[400px] h-[400px] bg-orange-600/10 blur-[120px] rounded-full" />
          <div className="absolute top-[30%] right-[20%] w-[500px] h-[500px] bg-zinc-800/50 blur-[120px] rounded-full" />
        </div>
        
        <div className="container px-4 md:px-8 relative z-10 mx-auto pt-24 pb-32 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter max-w-5xl leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-1000">
            The modern operating system for your <span className="text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-orange-500">resources.</span>
          </h1>
          
          <p className="mt-8 text-xl text-muted-foreground max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            Ditch the spreadsheets. Book rooms, manage equipment, and eliminate overlapping schedules instantly with our beautiful, dark-themed platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-5 pt-12 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-2xl shadow-primary/30 rounded-xl group">
                  Go to Dashboard
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-2xl shadow-primary/30 rounded-xl group">
                    Start for free
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-white/10 hover:bg-white/5 rounded-xl backdrop-blur-sm">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Dashboard Mockup / Visual Break */}
        <div className="container mx-auto px-4 md:px-8 relative z-10 pb-32 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-700">
          <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-4 md:p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
            <div className="relative rounded-xl border border-white/5 bg-[#09090b] p-6 shadow-inner aspect-[21/9] flex flex-col justify-between">
              {/* Mockup Header */}
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                <div className="h-6 w-32 bg-white/10 rounded-md" />
                <div className="h-8 w-8 bg-primary/20 rounded-full" />
              </div>
              {/* Mockup Content */}
              <div className="grid grid-cols-3 gap-6 h-full">
                <div className="col-span-2 space-y-4">
                  <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                  <div className="h-32 bg-white/5 rounded-xl border border-white/5" />
                </div>
                <div className="col-span-1 space-y-4">
                  <div className="h-full bg-primary/5 rounded-xl border border-primary/10" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="border-t border-white/5 bg-black/40 relative z-10">
          <div className="container mx-auto px-4 md:px-8 py-32">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Designed for speed & clarity.</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to manage your organization, wrapped in an interface you'll actually love using.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <Calendar className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Bulletproof Bookings</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Powered by PostgreSQL GiST exclusion constraints. Overlapping bookings are literally impossible at the database level.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <Layers className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Multi-Tenant Isolation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Enterprise-grade architecture guarantees your data never crosses paths with other organizations. Complete peace of mind.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center mb-6 shadow-xl">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">Role-Based Access</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Built-in Admin and User roles. Keep tight control over who can create resources, invite team members, and modify settings.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
