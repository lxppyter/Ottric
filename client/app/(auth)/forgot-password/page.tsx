'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner"
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'email' | 'verify'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success("Recovery code sent.");
      setStep('verify');
    } catch (error) {
      console.error('Recovery failed:', error);
      let message = 'Recovery failed';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
            message = 'Service endpoint not found (Backend 404)';
        } else {
            message = error.response?.data?.message || message;
        }
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 8) {
      toast.error("Please enter the full 8-digit code");
      return;
    }
    setLoading(true);
    // Mock Verification
    setTimeout(() => {
        setLoading(false);
        toast.info("This is a mock interface. Integration pending.");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 bg-cyberpunk-grid pointer-events-none" />
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full diffusion-primary diffusion-blob opacity-20" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full diffusion-secondary diffusion-blob opacity-20" />
      
      <div className="w-full max-w-md relative z-10 perspective-1000">
        
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden group">
          
          {/* Decorative Glitch Element */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-transparent opacity-50 rounded-br-full pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <Badge variant="outline" className="mb-4 border-red-500/50 text-red-400 bg-red-500/10 tracking-widest uppercase text-[10px] py-1 px-3 rounded-full backdrop-blur-sm">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Recovery Protocol
            </Badge>
            <h1 className="text-3xl font-black tracking-tighter mb-2 text-white text-glow">
              {step === 'email' ? (
                <>Access <span className="text-red-500">Lost?</span></>
              ) : (
                <>Verify <span className="text-red-500">Identity</span></>
              )}
            </h1>
            <p className="text-muted-foreground text-sm font-light tracking-wide">
              {step === 'email' ? 'Initiate identity verification sequence' : 'Enter the 8-digit secure code sent to your device'}
            </p>
          </div>

          {step === 'email' ? (
            /* Step 1: Email Form */
            <form onSubmit={handleEmailSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2 group/input">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-red-400 transition-colors">
                  <Mail className="w-3 h-3" />
                  Identity (Email)
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@corp.net"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-black/40 border-white/10 focus:border-red-500/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-red-500/50 focus:shadow-[0_0_15px_rgba(255,0,0,0.15)]"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all duration-300 border-none relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {loading ? 'Processing...' : (
                    <>
                      Send Recovery Link
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </span>
              </Button>
            </form>
          ) : (
             /* Step 2: OTP Form */
             <form onSubmit={handleVerifySubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center justify-center gap-2">
                         Security Code
                    </Label>
                    <div className="flex justify-center">
                        <Input 
                            type="text" 
                            maxLength={8}
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="00000000"
                            className="w-full text-center text-3xl font-mono tracking-[0.5em] h-16 bg-black/40 border-red-500/30 focus:border-red-500 text-white placeholder:text-white/10 rounded-xl focus:shadow-[0_0_20px_rgba(255,0,0,0.2)] transition-all"
                            autoFocus
                        />
                    </div>
                    <p className="text-[10px] text-center text-muted-foreground">
                        Enter the 8-digit numeric code
                    </p>
                </div>

                <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,0,0,0.4)] transition-all duration-300 border-none relative overflow-hidden"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                        {loading ? 'Verifying...' : 'Authenticate'}
                    </span>
                </Button>
             </form>
          )}

          {/* Back to Login */}
          <div className="text-center mt-6">
            <Link href="/login" className="text-[10px] text-muted-foreground hover:text-white transition-colors uppercase tracking-widest font-bold">
                &lt; Abort Sequence / Return to Login
            </Link>
          </div>
        </div>
        
      </div>
    </div>
  );
}
