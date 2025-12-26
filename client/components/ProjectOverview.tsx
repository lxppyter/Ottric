import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Zap, Target, Activity, CheckCircle2, AlertTriangle, FileCode, Server, Layers, Skull, Flame, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface ProjectOverviewProps {
    auditPack: any;
    product: any;
}

export function ProjectOverview({ auditPack, product }: ProjectOverviewProps) {
    const { summary, vex, riskScore } = auditPack; // Assume riskScore is passed or calculation logic
    
    // Calculate Stats
    const kevCount = vex.filter((v: any) => v.vulnerability.isKev).length;
    const reachableCount = vex.filter((v: any) => v.reachability === 'direct' || v.reachability === 'transitive').length;
    
    const score = riskScore || 0; 
    
    const getScoreColor = (s: number) => {
        if (s >= 90) return 'text-purple-500 border-purple-500';
        if (s >= 70) return 'text-red-500 border-red-500';
        if (s >= 40) return 'text-orange-500 border-orange-500';
        return 'text-emerald-500 border-emerald-500';
    };

    const getScoreLabel = (s: number) => {
        if (s >= 90) return 'CRITICAL';
        if (s >= 70) return 'HIGH';
        if (s >= 40) return 'MODERATE';
        return 'LOW';
    };

    const getRiskIcon = (s: number) => {
        if (s >= 90) return <Skull className="w-24 h-24 text-purple-500/20" />;
        if (s >= 70) return <Flame className="w-24 h-24 text-red-500/20" />;
        if (s >= 40) return <AlertTriangle className="w-24 h-24 text-orange-500/20" />;
        return <ShieldCheck className="w-24 h-24 text-emerald-500/20" />;
    };

    return (
        <div className="space-y-6">
            {/* TOP METRICS ROW */}
            <div className="grid gap-6 md:grid-cols-4">
                {/* RISK SCORE CARD */}
                <Card className="bg-gradient-to-br from-secondary/10 to-transparent border-white/5 text-white shadow-none md:col-span-1 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-100">{getRiskIcon(score)}</div>
                    <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase text-muted-foreground">Security Score</CardTitle></CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">

                        <div className={`relative flex items-center justify-center w-32 h-32 rounded-full border-4 ${getScoreColor(score)} bg-black/20`}>
                             <div className="text-4xl font-black tracking-tighter">{score}</div>
                             <div className={`absolute -bottom-3 px-3 py-1 bg-zinc-950 rounded border text-[10px] font-bold ${getScoreColor(score)}`}>
                                 {getScoreLabel(score)}
                             </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-4 text-center max-w-[200px]">
                            Calculated based on max severity, exploitability, and reachability.
                        </p>
                    </CardContent>
                </Card>

                {/* VITAL STATS */}
                <div className="md:col-span-3 grid gap-6 md:grid-cols-3">
                     {/* KEV STAT */}
                     <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Exploited (KEV)</CardTitle>
                            <Zap className={`w-4 h-4 ${kevCount > 0 ? 'text-red-500' : 'text-zinc-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">{kevCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Vulnerabilities with known active exploits in the wild.</p>
                        </CardContent>
                    </Card>

                    {/* REACHABILITY STAT */}
                    <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Reachable</CardTitle>
                            <Target className={`w-4 h-4 ${reachableCount > 0 ? 'text-orange-500' : 'text-zinc-500'}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">{reachableCount}</div>
                            <p className="text-xs text-muted-foreground mt-1">Confirmed executable paths in your codebase.</p>
                        </CardContent>
                    </Card>

                     {/* FIXABLE STAT (Mocking for now as summary.fixed is 'Fixed' status, not 'Fixable') */}
                     {/* Actually summary.fixed means 'Done'. We want 'Affected but has fix'. */}
                     {/* For now let's show 'Total' vs 'Affected' ratio */}
                     <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-xs font-mono uppercase text-muted-foreground">Affected / Total</CardTitle>
                            <Activity className="w-4 h-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-end gap-2">
                                <div className="text-3xl font-black text-white">{summary.affected}</div>
                                <div className="text-sm font-mono text-muted-foreground mb-2">/ {summary.totalVulnerabilities}</div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Active vulnerabilities requiring attention.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* SECOND ROW: BREAKDOWN & METADATA */}
            <div className="grid gap-6 md:grid-cols-3">
                 {/* SEVERITY BREAKDOWN */}
                 <Card className="bg-secondary/5 border-white/5 text-white shadow-none md:col-span-2">
                    <CardHeader><CardTitle className="text-sm font-mono uppercase">Severity Distribution</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { label: 'CRITICAL', count: vex.filter((v:any) => v.vulnerability.severity === 'CRITICAL').length, color: 'bg-purple-500', text: 'text-purple-500' },
                            { label: 'HIGH', count: vex.filter((v:any) => v.vulnerability.severity === 'HIGH').length, color: 'bg-red-500', text: 'text-red-500' },
                            { label: 'MEDIUM', count: vex.filter((v:any) => v.vulnerability.severity === 'MEDIUM').length, color: 'bg-orange-500', text: 'text-orange-500' },
                            { label: 'LOW', count: vex.filter((v:any) => v.vulnerability.severity === 'LOW').length, color: 'bg-blue-500', text: 'text-blue-500' },
                        ].map(item => (
                            <div key={item.label} className="grid grid-cols-12 gap-4 items-center">
                                <div className={`col-span-2 text-xs font-bold ${item.text}`}>{item.label}</div>
                                <div className="col-span-9 h-2 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${(item.count / (summary.totalVulnerabilities || 1)) * 100}%` }} />
                                </div>
                                <div className="col-span-1 text-xs font-mono text-right">{item.count}</div>
                            </div>
                        ))}
                    </CardContent>
                 </Card>

                 {/* PROJECT METADATA CARD */}
                 <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                    <CardHeader><CardTitle className="text-sm font-mono uppercase">Project Metadata</CardTitle></CardHeader>
                    <CardContent className="space-y-4 text-xs">
                        <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-muted-foreground">Version</span>
                            <span className="font-mono">{product.version}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-muted-foreground">Last Scan</span>
                            <span className="font-mono">{product.createdAt ? format(new Date(product.createdAt), 'MMM d, yyyy') : 'N/A'}</span>
                        </div>
                         <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-muted-foreground">Components</span>
                            <span className="font-mono">{summary.totalComponents}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-white/5">
                            <span className="text-muted-foreground">Environment</span>
                            <span className="font-mono bg-zinc-800 px-2 rounded">Production</span>
                        </div>
                         {/* License Summary could go here if calculated */}
                    </CardContent>
                 </Card>
            </div>
        </div>
    );
}
