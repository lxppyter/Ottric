'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, Mail, Lock, User, Building2, Sparkles, Shield, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from "sonner"
import axios from 'axios';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function RegisterPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [formData, setFormData] = useState({
    name: '', // Not used in backend yet
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
    invitationToken: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    setLoading(true);

    try {
      if (mode === 'create' && !formData.company) {
          toast.error("Organization name is required");
          setLoading(false);
          return;
      }
      if (mode === 'join' && !formData.invitationToken) {
          toast.error("Invitation Key is required");
          setLoading(false);
          return;
      }

      await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        organizationName: mode === 'create' ? formData.company : undefined,
        invitationToken: mode === 'join' ? formData.invitationToken : undefined
      });
      
      toast.success('Registration successful! Please login.');
      router.push('/login');
    } catch (error) {
      console.error('Registration failed', error);
      let message = 'Unknown error';
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error('Registration failed: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.id]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative py-10">
      
      {/* Cyberpunk Background Effects */}
      <div className="absolute inset-0 bg-cyberpunk-grid pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full diffusion-secondary diffusion-blob opacity-30" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full diffusion-primary diffusion-blob opacity-30" />

      <div className="w-full max-w-2xl relative z-10 perspective-1000">
        
        <div className="glass-panel p-8 md:p-12 rounded-3xl border border-white/10 relative overflow-hidden group">
          
          {/* Decorative Glitch Element */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-secondary/20 to-transparent opacity-50 rounded-br-full pointer-events-none" />
          
          {/* Header */}
          <div className="text-center mb-6 relative">
            <Badge variant="outline" className="mb-2 border-secondary/50 text-secondary bg-secondary/10 tracking-widest uppercase text-[10px] py-1 px-3 rounded-full backdrop-blur-sm">
              <Sparkles className="w-3 h-3 mr-1" />
              Join The Network
            </Badge>
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter mb-1 text-white text-glow">
              Get <span className="text-secondary">Connected.</span>
            </h1>
            <p className="text-muted-foreground text-xs font-light tracking-wide">
              Create your digital identity
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex justify-center mb-6">
              <div className="p-1 bg-black/40 rounded-full border border-white/10 flex">
                  <button 
                    onClick={() => setMode('create')}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${mode === 'create' ? 'bg-secondary text-black shadow-[0_0_15px_rgba(112,0,255,0.4)]' : 'text-muted-foreground hover:text-white'}`}
                  >
                      Create Org
                  </button>
                  <button 
                    onClick={() => setMode('join')}
                    className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${mode === 'join' ? 'bg-primary text-black shadow-[0_0_15px_rgba(255,0,255,0.4)]' : 'text-muted-foreground hover:text-white'}`}
                  >
                      Join via Key
                  </button>
              </div>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name Field - Visual Only for now */}
              <div className="space-y-2 group/input">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-secondary transition-colors">
                  <User className="w-3 h-3" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="bg-black/40 border-white/10 focus:border-secondary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(112,0,255,0.15)]"
                />
              </div>

               {/* Conditional Field: Company Name OR Invite Key */}
              {mode === 'create' ? (
                <div className="space-y-2 group/input animate-in fade-in slide-in-from-right-4 duration-300">
                    <Label htmlFor="company" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-secondary transition-colors">
                    <Building2 className="w-3 h-3" />
                    Organization Name
                    </Label>
                    <Input
                    id="company"
                    type="text"
                    placeholder="Acme Corp"
                    value={formData.company}
                    onChange={handleChange}
                    className="bg-black/40 border-white/10 focus:border-secondary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(112,0,255,0.15)]"
                    required
                    />
                </div>
              ) : (
                <div className="space-y-2 group/input animate-in fade-in slide-in-from-left-4 duration-300">
                    <Label htmlFor="invitationToken" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-primary transition-colors">
                    <Key className="w-3 h-3" />
                    Invitation Key
                    </Label>
                    <Input
                    id="invitationToken"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={formData.invitationToken}
                    onChange={handleChange}
                    className="bg-black/40 border-white/10 focus:border-primary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-primary/50 focus:shadow-[0_0_15px_rgba(255,0,255,0.15)] font-mono"
                    required
                    />
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2 group/input">
              <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-secondary transition-colors">
                <Mail className="w-3 h-3" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleChange}
                className="bg-black/40 border-white/10 focus:border-secondary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(112,0,255,0.15)]"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Password Field */}
              <div className="space-y-2 group/input">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-secondary transition-colors">
                  <Lock className="w-3 h-3" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-black/40 border-white/10 focus:border-secondary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(112,0,255,0.15)]"
                  required
                />
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2 group/input">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within/input:text-secondary transition-colors">
                  <Lock className="w-3 h-3" />
                  Confirm
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-black/40 border-white/10 focus:border-secondary/50 rounded-xl h-12 pl-4 text-white placeholder:text-white/20 transition-all duration-300 focus:ring-1 focus:ring-secondary/50 focus:shadow-[0_0_15px_rgba(112,0,255,0.15)]"
                  required
                />
              </div>
            </div>

            {/* Terms */}
            <div className="bg-secondary/5 border-l-2 border-secondary/50 p-4 rounded-r-lg backdrop-blur-sm">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-relaxed">
                By initializing this protocol, you agree to our <span className="text-secondary cursor-pointer hover:underline">Terms of Service</span> and <span className="text-secondary cursor-pointer hover:underline">Privacy Policy</span>.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-xl bg-gradient-to-r ${mode === 'create' ? 'from-primary to-secondary' : 'from-secondary to-primary'} text-black font-black uppercase tracking-widest hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(112,0,255,0.4)] transition-all duration-300 border-none relative overflow-hidden mt-4`}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                 {loading ? 'Registering...' : (
                  <>
                    {mode === 'create' ? 'Initialize Interface' : 'Join Interface'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </Button>

            {/* Divider */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background/0 backdrop-blur-md px-2 text-[10px] uppercase tracking-widest text-muted-foreground">
                  Or
                </span>
              </div>
            </div>

            {/* Login Link */}
            <div className="text-center">
              <Link href="/login">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 rounded-xl border-white/10 bg-white/5 hover:bg-white/10 hover:text-secondary hover:border-secondary/30 text-muted-foreground transition-all duration-300 font-semibold tracking-wide"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Access Existing Account
                </Button>
              </Link>
            </div>
          </form>
        </div>
        
        {/* Footer */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-xs font-medium text-muted-foreground hover:text-secondary transition-colors tracking-widest uppercase">
            &lt; Return to Base /&gt;
          </Link>
        </div>
      </div>
    </div>
  );
}
