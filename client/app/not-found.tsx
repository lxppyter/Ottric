import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05050A] text-white p-4">
      <div className="glass-panel p-12 rounded-2xl border border-white/10 flex flex-col items-center max-w-lg w-full text-center relative overflow-hidden">
        {/* Decorative Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-primary/20 blur-[60px] rounded-full pointer-events-none" />

        <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 z-10">
            <AlertTriangle className="w-8 h-8 text-primary" />
        </div>

        <h1 className="text-4xl font-bold mb-2 tracking-tighter">404</h1>
        <h2 className="text-xl font-mono text-muted-foreground mb-6 uppercase tracking-widest">Signal Lost</h2>
        
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          The requested coordinate does not exist in the known sector. It may have been redacted or never established.
        </p>

        <div className="flex gap-4 z-10">
          <Button asChild variant="outline" className="border-white/10 hover:bg-white/5">
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Return Base
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
