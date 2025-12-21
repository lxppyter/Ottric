'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function FloatingBadge() {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <Link
      href="#contact"
      className="fixed bottom-8 right-8 z-50 group cursor-pointer"
      aria-label="Beta Access"
    >
      <div className="relative w-32 h-32">
        {/* Rotating background circle */}
        <div
          className="absolute inset-0 bg-primary rounded-full warm-shadow-lg transition-transform duration-300 group-hover:scale-110"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        
        {/* Static text content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary-foreground">
              Enterprise
            </div>
            <div className="text-lg font-bold text-primary-foreground font-serif mt-1">
              Ready
            </div>
          </div>
        </div>

        {/* Subtle pulse effect */}
        <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
      </div>
    </Link>
  );
}
