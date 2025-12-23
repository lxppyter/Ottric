'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw, AlertOctagon } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#05050A] text-white p-4">
      <div className="glass-panel p-12 rounded-2xl border border-red-500/20 flex flex-col items-center max-w-lg w-full text-center relative overflow-hidden">
        
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
            <AlertOctagon className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2 tracking-tighter">System Malfunction</h1>
        <p className="text-sm text-gray-400 mb-8 leading-relaxed">
          A critical runtime error has been detected. The system has automatically halted to prevent data corruption.
        </p>

        <div className="bg-black/30 p-4 rounded-lg w-full mb-8 border border-white/5 text-left">
            <code className="text-xs text-red-400 font-mono break-all line-clamp-3">
                {error.message || "Unknown Error"}
            </code>
            {error.digest && (
                <p className="text-[10px] text-gray-500 mt-2 font-mono">Digest: {error.digest}</p>
            )}
        </div>

        <Button onClick={() => reset()} className="bg-red-600 hover:bg-red-700 text-white border-none">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Reboot System
        </Button>
      </div>
    </div>
  );
}
