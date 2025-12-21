'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, FileText, Settings, LogOut, ShieldCheck, Upload, Building2, Archive, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PersonalNotifications } from '@/components/PersonalNotifications';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        router.push('/login');
    }
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
    { icon: Archive, label: 'Projects', href: '/dashboard/projects' }, 
    { icon: Upload, label: 'Ingestion', href: '/dashboard/ingest' },
    { icon: Building2, label: 'Organization', href: '/dashboard/organization' },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden relative">
      {/* Subtle Background Noise/Grid */}
      <div className="absolute inset-0 bg-cyberpunk-grid opacity-[0.01] pointer-events-none" />
      
      {/* Sidebar */}
      <aside className="w-64 bg-secondary/5 border-r border-white/5 hidden md:flex flex-col relative z-10 backdrop-blur-xl">
        <div className="h-20 flex items-center px-6 border-b border-white/5">
             <div className="p-2 bg-primary/10 rounded-lg mr-3">
                <ShieldCheck className="w-5 h-5 text-primary" />
             </div>
             <span className="font-bold text-lg text-white tracking-widest uppercase">Ottric</span>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {menuItems.map((item) => (
             <Link key={item.href} href={item.href}>
                <Button 
                    variant="ghost" 
                    className={cn(
                        "w-full justify-start h-12 text-sm uppercase tracking-wide font-medium", 
                        pathname === item.href 
                            ? "bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary" 
                            : "text-muted-foreground hover:text-white hover:bg-white/5"
                    )}
                >
                    <item.icon className="w-4 h-4 mr-3" />
                    {item.label}
                </Button>
             </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/5">
            <Button variant="ghost" className="w-full justify-start text-red-400/70 hover:text-red-400 hover:bg-red-500/10 uppercase tracking-widest text-xs h-12" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-3" />
                Disconnect
            </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative z-10">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
