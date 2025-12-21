'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, AlertTriangle, Shield, Archive, CheckCircle2, Server, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<{
    activeReleases: number,
    criticalVulns: number,
    vexResolved: number,
    systemStatus: string,
    recentVex: any[],
    recentIngestions: any[]
  }>({
    activeReleases: 0,
    criticalVulns: 0,
    vexResolved: 0,
    systemStatus: 'OPERATIONAL',
    recentVex: [],
    recentIngestions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
           router.push('/login');
           return;
        }

        const response = await axios.get('http://localhost:3000/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [router]);

  if (stats.systemStatus === 'NO_ORGANIZATION') {
      return (
          <div className="flex h-[80vh] items-center justify-center">
              <Card className="w-full max-w-md bg-secondary/5 border-white/5 text-white">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-primary" />
                          Initialize Organization
                      </CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                          You are not currently part of any organization. Create a new one to get started.
                      </p>
                      <form onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const name = formData.get('name') as string;
                          try {
                              const token = localStorage.getItem('token');
                              const res = await axios.post('http://localhost:3000/organization', { name }, {
                                  headers: { Authorization: `Bearer ${token}` }
                              });
                              // Update Token with new Organization Claims
                              if (res.data.access_token) {
                                  localStorage.setItem('token', res.data.access_token);
                                  // Force reload to refresh context
                                  window.location.reload();
                              }
                          } catch(err) {
                              console.error(err);
                              alert('Failed to create organization');
                          }
                      }}>
                          <div className="space-y-4">
                              <div className="space-y-2">
                                  <label className="text-xs font-bold uppercase text-muted-foreground">Organization Name</label>
                                  <input name="name" required className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Acme Corp" />
                              </div>
                              <Button type="submit" className="w-full">
                                  Create Organization
                              </Button>
                          </div>
                      </form>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-8">
        <div className="flex justify-between items-end">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Command Center</h1>
                <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">System Overview & Security Posture</p>
            </div>
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-secondary/5 rounded-full border border-white/5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-mono font-bold text-emerald-500 tracking-widest">LIVE_CONNECTION</span>
            </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard 
                title="Active Releases" 
                value={stats.activeReleases.toString()} 
                icon={Archive} 
                trend={stats.recentIngestions.length > 0 && stats.recentIngestions[0].timestamp 
                    ? `Updated ${Math.floor((new Date().getTime() - new Date(stats.recentIngestions[0].timestamp).getTime()) / 60000) < 1 
                        ? 'just now' 
                        : `${Math.floor((new Date().getTime() - new Date(stats.recentIngestions[0].timestamp).getTime()) / 60000)} mins ago`}`
                    : 'No updates yet'} 
                decorationColor="text-blue-400" 
            />
            <StatsCard title="Critical Vulns" value={stats.criticalVulns.toString()} icon={AlertTriangle} variant="destructive" decorationColor="text-red-400" />
            <StatsCard title="VEX Resolved" value={stats.vexResolved.toString()} icon={Shield} decorationColor="text-secondary" />
            <StatsCard title="System Status" value={stats.systemStatus} icon={Activity} decorationColor="text-emerald-400" />
        </div>
        
        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-7">
            
            {/* Recent Activity / Vulnerabilties */}
            <Card className="col-span-1 md:col-span-4 bg-secondary/5 border-white/5 text-white shadow-none h-full">
                <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground">Recent Signals</CardTitle>
                        <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                         {stats.recentVex.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 text-sm font-mono">No recent signals detected.</div>
                         ) : (
                             stats.recentVex.map((item: any, i) => (
                                 <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                                    <div className="flex items-center gap-4 mb-2 md:mb-0">
                                        <div className={`w-1 h-8 rounded-full ${item.severity === 'CRITICAL' ? 'bg-red-500' : item.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                        <div>
                                            <div className="font-mono text-sm font-bold text-white group-hover:text-primary transition-colors">{item.id}</div>
                                            <div className="text-xs text-muted-foreground">{item.pkg}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-mono">
                                        <span className={`px-2 py-1 rounded bg-white/5 border border-white/5 ${item.status === 'Open' ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {item.status}
                                        </span>
                                    </div>
                                 </div>
                             ))
                         )}
                    </div>
                </CardContent>
            </Card>

            {/* System Health / Ingestion */}
            <Card className="col-span-1 md:col-span-3 bg-secondary/5 border-white/5 text-white shadow-none h-full">
                <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground">Ingestion Pipeline</CardTitle>
                        <Server className="w-4 h-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                   <div className="space-y-6">
                        {/* Visual Candy Users Like */}
                        <div className="relative">
                            <div className="flex justify-between text-xs font-mono mb-2 text-muted-foreground">
                                <span>Worker_Node_01</span>
                                <span className="text-emerald-400">IDLE</span>
                            </div>
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full w-0 bg-secondary" />
                            </div>
                        </div>

                        <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg mt-4">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                <div>
                                    <h4 className="text-sm font-bold text-emerald-400">Systems Operational</h4>
                                    <p className="text-xs text-emerald-500/60 mt-1">Ready for ingestion</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Ingestions List */}
                        {stats.recentIngestions.length > 0 && (
                            <div className="mt-6 border-t border-white/5 pt-4">
                                <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground mb-3">Recent Uploads</h4>
                                <div className="space-y-2">
                                    {stats.recentIngestions.map((ingest: any, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs font-mono p-2 bg-white/5 rounded border border-white/5">
                                            <span className="text-white">{ingest.product}</span>
                                            <span className="text-muted-foreground">{ingest.version}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                   </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

interface StatsCardProps {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: string;
    variant?: 'default' | 'destructive';
    decorationColor?: string;
}

function StatsCard({ title, value, icon: Icon, trend, variant = "default", decorationColor = "text-gray-500" }: StatsCardProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="bg-secondary/5 border-white/5 text-white shadow-none hover:bg-secondary/10 transition-colors group relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-20 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-xs font-mono font-bold uppercase tracking-widest text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${variant === 'destructive' ? 'text-red-400' : decorationColor} opacity-70 group-hover:opacity-100 transition-opacity`} />
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="text-3xl font-black tracking-tighter text-white">{value}</div>
                {trend && <p className="text-[10px] font-mono text-muted-foreground mt-2 uppercase tracking-wide">{trend}</p>}
            </CardContent>
        </Card>
        </motion.div>
    )
}

