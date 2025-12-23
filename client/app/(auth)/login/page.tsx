'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner"
import axios from 'axios';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Attempting login with:", { username: email, passwordLen: password.length }); // DEBUG
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });
      
      if (response.data && response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        toast.success("Login successful");
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
      let message = 'Access Denied';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            message = 'Invalid email identity or password sequence.';
        } else {
            message = error.response?.data?.message || message;
        }
      }
      
      toast.error("Authentication Failed", {
          description: message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden relative">
      
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 bg-cyberpunk-grid pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full diffusion-primary diffusion-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full diffusion-secondary diffusion-blob" />
      
      <div className="w-full max-w-md relative z-10 perspective-1000">
        
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-white/10 relative overflow-hidden group">
          
          {/* Decorative Glitch Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent opacity-50 rounded-bl-full pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary bg-primary/10 tracking-widest uppercase text-[10px] py-1 px-3 rounded-full backdrop-blur-sm">
              <Shield className="w-3 h-3 mr-1" />
              Secure Access
            </Badge>
            <h1 className="text-4xl font-black tracking-tighter mb-2 text-white text-glow">
              Welcome <span className="text-primary">Back</span>
            </h1>
            <p className="text-muted-foreground text-sm font-light tracking-wide">
              Enter the mainframe to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Email Field */}
            <div className="space-y-2 group/input">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-primary transition-colors">
                <Mail className="w-3 h-3" />
                Identity
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="name@corp.net"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-black/40 border-white/10 focus:border-primary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-primary/50 focus:shadow-[0_0_15px_rgba(255,0,255,0.15)]"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2 group/input">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-primary transition-colors">
                  <Lock className="w-3 h-3" />
                  Passcode
                </Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/40 border-white/10 focus:border-primary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-primary/50 focus:shadow-[0_0_15px_rgba(255,0,255,0.15)]"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-secondary to-primary text-black font-black uppercase tracking-widest hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(255,0,255,0.4)] transition-all duration-300 border-none relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? 'Authenticating...' : (
                  <>
                    Initialize
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </Button>

            {/* Lost Key Link - Positioned below Submit */}
            <div className="text-center mt-1">
               <Link href="/forgot-password" className="text-[10px] text-muted-foreground/60 hover:text-primary transition-colors uppercase tracking-widest font-bold">
                  Lost Key?
               </Link>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background/0 backdrop-blur-md px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Or Connect With
                </span>
              </div>
            </div>

            {/* Register Link */}
            <div className="text-center">
              <Link href="/register">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-primary hover:border-primary/30 text-muted-foreground transition-all duration-300 font-semibold tracking-wide"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  New User Registration
                </Button>
              </Link>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors tracking-widest uppercase">
            &lt; Return to Base /&gt;
          </Link>
        </div>
      </div>
    </div>
  );
}
