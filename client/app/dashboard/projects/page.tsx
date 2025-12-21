'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, Filter, ShieldAlert, Clock, ChevronRight, Archive } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';

interface Project {
    id: string;
    name: string;
    description: string;
    latestVersion: string;
    lastUpdated: string;
    riskCount: number;
}

export default function ProjectsPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const res = await axios.get('http://localhost:3000/portal/projects', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProjects(res.data);
            } catch (error) {
                console.error("Failed to fetch projects");
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Projects</h1>
                    <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">Manage & Monitor Applications</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="SEARCH PROJECTS..." 
                            className="bg-secondary/5 border border-white/10 rounded-md pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/50 w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                 <div className="grid gap-6 md:grid-cols-3">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-48 bg-white/5 animate-pulse rounded-xl" />
                    ))}
                 </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-20 bg-secondary/5 rounded-xl border border-white/5 border-dashed">
                    <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                    <h3 className="text-lg font-bold text-white">No Projects Found</h3>
                    <p className="text-muted-foreground text-sm mt-2">Upload an SBOM to get started.</p>
                    <Button 
                        className="mt-6 bg-primary text-black font-bold uppercase text-xs"
                        onClick={() => router.push('/dashboard/ingest')}
                    >
                        Go to Ingestion
                    </Button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProjects.map((project) => (
                        <Card 
                            key={project.id} 
                            className="bg-secondary/5 border-white/5 text-white shadow-none hover:bg-secondary/10 hover:border-primary/20 transition-all cursor-pointer group"
                            onClick={() => router.push(`/dashboard/projects/${project.name}`)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/5 mb-4 group-hover:scale-110 transition-transform">
                                        <Archive className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className={`px-2 py-1 rounded text-xs font-mono font-bold border ${project.riskCount > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                                        {project.riskCount > 0 ? `${project.riskCount} CRITICAL` : 'SECURE'}
                                    </div>
                                </div>
                                <CardTitle className="text-lg font-bold truncate pr-4">{project.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                                        <span className="text-muted-foreground font-mono text-xs uppercase">Recent Ver</span>
                                        <span className="font-bold font-mono">{project.latestVersion}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm pb-2">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span className="font-mono text-xs uppercase">Updated</span>
                                        </div>
                                        <span className="font-mono text-xs text-white">
                                            {formatDistanceToNow(new Date(project.lastUpdated))} ago
                                        </span>
                                    </div>
                                    
                                    <div className="pt-2 flex justify-end">
                                        <span className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 duration-300">
                                            VIEW DETAILS <ChevronRight className="w-3 h-3" />
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
