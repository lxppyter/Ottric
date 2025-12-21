'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Circle } from 'lucide-react';

export function FloatingNav() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        isScrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="glass-effect rounded-full px-8 py-3 flex items-center gap-8 warm-shadow border border-border/30">
        {/* Logo */}
        <Link href="/" className="text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors font-serif">
          Ottric Labs
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors font-bold">
            Login
          </Link>
          <Link href="/register" className="bg-primary text-foreground px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wide hover:bg-primary/80 transition-colors">
            Get Access
          </Link>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <Circle className="w-2 h-2 fill-primary text-primary animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Online</span>
        </div>
      </div>
    </nav>
  );
}
