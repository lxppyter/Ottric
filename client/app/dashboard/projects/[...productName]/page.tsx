'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, AlertTriangle, Shield, Download, Clock, Wrench, Package, FileCode, CheckCircle2, Radio, Github } from 'lucide-react';
import { ActivityFeed } from '@/components/ActivityFeed';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { GithubActionDialog } from '@/components/GithubActionDialog';
import { VexEditDialog } from '@/components/VexEditDialog';
import { ProjectOverview } from '@/components/ProjectOverview';
import { toast } from 'sonner';

export default function ProjectDetailsPage({ params }: { params: Promise<{ productName: string | string[] }> }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    
    // Handle catch-all route (array) or single string
    const rawName = Array.isArray(unwrappedParams.productName) 
        ? unwrappedParams.productName.join('/') 
        : unwrappedParams.productName;
    const productName = decodeURIComponent(rawName);
    
    const [loading, setLoading] = useState(true);
    const [product, setProduct] = useState<any>(null);
    const [versions, setVersions] = useState<any[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string>('');
    const [auditPack, setAuditPack] = useState<any>(null);

    // Bulk Update State
    const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
    const [bulkTargetStatus, setBulkTargetStatus] = useState<string>('');

    useEffect(() => {
        const fetchVersions = async () => {
            try {
                // 1. Fetch Product & Versions
                const res = await api.get(`/portal/${encodeURIComponent(productName)}/versions`);
                
                setProduct(res.data.product);
                setVersions(res.data.versions);
                
                if (res.data.versions.length > 0) {
                    setSelectedVersion(res.data.versions[0].version);
                } else {
                    setLoading(false); // No versions to load
                }
            } catch (error) {
                console.error("Failed to fetch product versions");
                setLoading(false);
            }
        };
        fetchVersions();
    }, [productName]);

    const fetchAuditPack = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            // 2. Fetch Audit Pack for specific version
            const res = await api.get(`/portal/${encodeURIComponent(productName)}/${selectedVersion}/audit-pack`);
            setAuditPack(res.data);
        } catch (e) {
            console.error("Failed to fetch audit pack");
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedVersion) return;
        fetchAuditPack();
    }, [selectedVersion, productName]);

    const calculateSummary = (vexs: any[]) => {
        const summary = {
            affected: 0,
            fixed: 0,
            underInvestigation: 0,
            notAffected: 0,
            totalVulnerabilities: vexs.length,
            totalComponents: auditPack.summary.totalComponents 
        };

        vexs.forEach(v => {
            switch (v.status) {
                case 'affected': summary.affected++; break;
                case 'fixed': summary.fixed++; break;
                case 'under_investigation': summary.underInvestigation++; break;
                case 'not_affected': summary.notAffected++; break;
            }
        });
        return summary;
    };

    const handleBulkUpdate = async () => {
        if (!bulkTargetStatus || !auditPack) return;
        const ids = auditPack.vex.map((v: any) => v.id);
        try {
            await api.patch('/vex/bulk-update', { ids, status: bulkTargetStatus });
            
            // Optimistic update
            const updatedVex = auditPack.vex.map((v: any) => ({
                ...v,
                status: bulkTargetStatus
            }));
            const newSummary = calculateSummary(updatedVex);
            setAuditPack({ ...auditPack, vex: updatedVex, summary: newSummary });
            
            setIsBulkDialogOpen(false);
            
            // Background refresh to ensure consistency
            fetchAuditPack();
        } catch (e) {
            console.error(e);
        }
    };


    if (loading && !auditPack) {
        return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading Analysis Data...</div>;
    }

    if (!product) return <div>Product Not Found</div>;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <Button variant="ghost" className="mb-4 pl-0 hover:bg-transparent text-muted-foreground hover:text-white" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
                </Button>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">{product.name}</h1>
                        <p className="text-muted-foreground text-sm font-mono max-w-xl">{product.description || 'No description provided.'}</p>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-secondary/10 p-2 rounded-lg border border-white/5">
                        <span className="text-xs font-mono uppercase text-muted-foreground font-bold pl-2">Version:</span>
                        <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                            <SelectTrigger className="w-[180px] bg-black/50 border-white/10 h-8 text-xs font-mono">
                                <SelectValue placeholder="Select Version" />
                            </SelectTrigger>
                            <SelectContent>
                                {versions.map(v => (
                                    <SelectItem key={v.id} value={v.version} className="text-xs font-mono">
                                        {v.version}
                                        <span className="ml-2 text-muted-foreground opacity-50">
                                            ({format(new Date(v.createdAt), 'MMM d')})
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end -mt-4 gap-2">
                 <Button 
                    onClick={() => {
                        if (!product?.id) return;
                        api.get(`/vex/export/${product.id}`).then((response) => {
                             const url = window.URL.createObjectURL(new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' }));
                             const link = document.createElement('a');
                             link.href = url;
                             link.setAttribute('download', `${productName}-vex.json`);
                             document.body.appendChild(link);
                             link.click();
                        }).catch(e => console.error(e));
                    }}
                    className="bg-secondary/10 hover:bg-secondary/20 border border-white/5 text-white font-mono uppercase text-xs gap-2"
                 >
                     <Download className="w-4 h-4" /> Export VEX (JSON)
                 </Button>
                 <Button 
                    disabled={!selectedVersion}
                    onClick={() => {
                        api.get(`/portal/${encodeURIComponent(productName)}/${selectedVersion}/report`, {
                            responseType: 'blob'
                        }).then((response) => {
                            const url = window.URL.createObjectURL(new Blob([response.data]));
                            const link = document.createElement('a');
                            link.href = url;
                            link.setAttribute('download', `${productName}-${selectedVersion}-report.pdf`);
                            document.body.appendChild(link);
                            link.click();
                        }).catch(e => console.error(e));
                    }}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono uppercase text-xs border-dashed gap-2"
                 >
                     <FileCode className="w-4 h-4" /> Download Security Report
                 </Button>
            </div>

            {auditPack && (
                <Tabs defaultValue="overview" className="w-full mt-8">
                    <TabsList className="bg-secondary/5 border border-white/5 w-full justify-start h-12 p-1 rounded-lg">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs font-bold uppercase tracking-wide h-9 px-6">Overview</TabsTrigger>
                        <TabsTrigger value="components" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs font-bold uppercase tracking-wide h-9 px-6"><Package className="w-3 h-3 mr-2"/> Components ({auditPack.summary.totalComponents})</TabsTrigger>
                        <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-destructive data-[state=active]:text-white text-xs font-bold uppercase tracking-wide h-9 px-6"><Shield className="w-3 h-3 mr-2" /> Vulnerabilities ({auditPack.summary.totalVulnerabilities})</TabsTrigger>
                        <TabsTrigger value="activity" className="data-[state=active]:bg-zinc-100 data-[state=active]:text-black text-xs font-bold uppercase tracking-wide h-9 px-6"><Radio className="w-3 h-3 mr-2"/> Activity Log</TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-xs font-bold uppercase tracking-wide h-9 px-6 ml-auto"><Wrench className="w-3 h-3 mr-2" /> Settings</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <ProjectOverview auditPack={auditPack} product={product} />
                    </TabsContent>

                    {/* COMPONENTS TAB */}
                    <TabsContent value="components" className="mt-6">
                        <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                            <div className="p-4 border-b border-white/5 flex text-xs font-mono font-bold uppercase text-muted-foreground">
                                <div className="flex-1">Name</div>
                                <div className="w-32">Version</div>
                                <div className="w-48">License</div>
                                <div className="w-32">Type</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {auditPack.sbom.components.map((comp: any, i: number) => (
                                    <div key={i} className="p-4 flex items-center text-sm hover:bg-white/5 transition-colors">
                                        <div className="flex-1 font-mono">{comp.name}</div>
                                        <div className="w-32 text-muted-foreground text-xs font-mono">{comp.version}</div>
                                        <div className="w-48 text-muted-foreground text-xs truncate">
                                            {comp.licenses && comp.licenses.length > 0 
                                                ? (comp.licenses[0].license?.id || comp.licenses[0].expression || 'Unknown') 
                                                : 'N/A'}
                                        </div>
                                         <div className="w-32 text-xs uppercase bg-white/5 px-2 py-1 rounded text-center text-muted-foreground">{comp.type}</div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* VULNERABILITIES TAB */}
                    <TabsContent value="vulnerabilities" className="mt-6">
                        {/* BULK ACTIONS */}
                        <div className="flex items-center gap-4 mb-4 justify-end">
                            <span className="text-xs font-mono uppercase text-muted-foreground font-bold">Bulk Update:</span>
                            <Select onValueChange={(val) => {
                                setBulkTargetStatus(val);
                                setIsBulkDialogOpen(true);
                            }}>
                                <SelectTrigger className="w-[180px] bg-secondary/10 border-white/10 h-8 text-xs font-mono">
                                    <SelectValue placeholder="Set All To..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="affected">Affected</SelectItem>
                                    <SelectItem value="not_affected">Not Affected</SelectItem>
                                    <SelectItem value="fixed">Fixed</SelectItem>
                                    <SelectItem value="under_investigation">Under Investigation</SelectItem>
                                </SelectContent>
                            </Select>

                            <AlertDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
                                <AlertDialogContent className="bg-zinc-950 border-white/10 text-white">
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                        This will update the status of {auditPack.vex.length} vulnerabilities to <span className="font-bold text-white uppercase">{bulkTargetStatus}</span>.
                                        This action cannot be undone efficiently.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white hover:text-white">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleBulkUpdate} className="bg-white text-black hover:bg-white/90">Confirm Update</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>

                        <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                            <div className="p-4 border-b border-white/5 flex text-xs font-mono font-bold uppercase text-muted-foreground">
                                <div className="w-32">ID</div>
                                <div className="w-32">Severity</div>
                                <div className="w-40">Status</div>
                                <div className="flex-1">Component</div>
                                <div className="flex-1">Justification</div>
                            </div>
                            <div className="divide-y divide-white/5">
                                {auditPack.vex.map((v: any, i: number) => (
                                    <div key={v.id || i} className="p-4 flex items-center text-sm hover:bg-white/5 transition-colors">
                                        <div className="w-32 font-bold font-mono text-red-400">{v.vulnerability.id}</div>
                                        <div className="w-32 flex flex-col gap-1">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit border ${
                                                v.vulnerability.severity === 'CRITICAL' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' :
                                                v.vulnerability.severity === 'HIGH' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                                                v.vulnerability.severity === 'MEDIUM' ? 'bg-orange-500/10 text-orange-400 border-orange-500/30' :
                                                v.vulnerability.severity === 'LOW' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                                                'bg-zinc-800 text-zinc-400 border-zinc-700'
                                            }`}>
                                                {v.vulnerability.severity}
                                            </span>
                                            
                                            {/* KEV Badge */}
                                            {v.vulnerability.isKev && (
                                                <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit bg-red-600 text-white border border-red-400 animate-pulse">
                                                    KEV / EXPLOITED
                                                </span>
                                            )}

                                            {/* EPSS Badge */}
                                            {v.vulnerability.epssScore > 0 && (
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-mono w-fit bg-zinc-800 border ${
                                                    v.vulnerability.epssScore > 0.1 ? 'text-red-400 border-red-900' : 'text-zinc-400 border-zinc-800'
                                                }`} title={`Percentile: ${(v.vulnerability.epssPercentile * 100).toFixed(1)}%`}>
                                                    EPSS: {(v.vulnerability.epssScore * 100).toFixed(2)}%
                                                </span>
                                            )}

                                            {/* Reachability Badge */}
                                            {v.reachability && v.reachability !== 'unknown' && (
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit border ${
                                                    v.reachability === 'direct' ? 'bg-red-900/30 text-red-500 border-red-500/50' : 
                                                    v.reachability === 'transitive' ? 'bg-orange-900/30 text-orange-500 border-orange-500/50' :
                                                    'bg-emerald-900/30 text-emerald-500 border-emerald-500/50'
                                                }`}>
                                                    {v.reachability.replace('_', ' ')}
                                                </span>
                                            )}
                                            {/* Fix Version Badge */}
                                            {v.vulnerability.hasFix && v.vulnerability.fixedIn && (
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase w-fit flex items-center gap-1 border ${
                                                    v.vulnerability.upgradeRisk === 'HIGH' ? 'bg-red-900/40 text-red-400 border-red-500/50' : 
                                                    v.vulnerability.upgradeRisk === 'MEDIUM' ? 'bg-orange-900/40 text-orange-400 border-orange-500/50' :
                                                    v.vulnerability.upgradeRisk === 'LOW' ? 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50' :
                                                    'bg-blue-900/40 text-blue-400 border-blue-500/50'
                                                }`}>
                                                    <Wrench className="w-3 h-3" />
                                                    FIX: {v.vulnerability.fixedIn}
                                                    {v.vulnerability.upgradeRisk && v.vulnerability.upgradeRisk !== 'UNKNOWN' && (
                                                        <span className="opacity-75 ml-1">
                                                            ({v.vulnerability.upgradeRisk} RISK)
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                        <div className="w-40 flex flex-col gap-1 items-start justify-center">
                                            <VexEditDialog 
                                                vex={v}
                                                onUpdate={(newStatus, newJustification, newExpiresAt) => {
                                                    // 1. Optimistic Update (Immediate Feedback)
                                                    const newVex = [...auditPack.vex];
                                                    newVex[i].status = newStatus;
                                                    newVex[i].justification = newJustification;
                                                    newVex[i].expiresAt = newExpiresAt;
                                                    const newSummary = calculateSummary(newVex);
                                                    setAuditPack({ ...auditPack, vex: newVex, summary: newSummary });

                                                    // 2. Background Refresh (Consistency & Calculations like Risk Score)
                                                    fetchAuditPack(false);
                                                }}
                                            >
                                                <Button variant="outline" className="w-[140px] h-7 text-[10px] border-white/5 bg-black/20 font-mono uppercase justify-between px-2 hover:bg-white/5 text-zinc-300">
                                                    {v.status.replace('_', ' ')}
                                                </Button>
                                            </VexEditDialog>

                                            <div className="mt-1">
                                                <GithubActionDialog 
                                                    productId={product.id}
                                                    vulnerability={v.vulnerability}
                                                    componentPurl={v.componentPurl}
                                                    trigger={
                                                        <Button variant="ghost" className="h-6 text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 px-1">
                                                            <Github className="w-3 h-3" /> Create Issue/PR
                                                        </Button>
                                                    }
                                                />
                                            </div>
                                            
                                            {v.expiresAt && new Date(v.expiresAt) < new Date() && (
                                                <span className="text-[9px] font-bold text-red-500 flex items-center gap-1 animate-pulse px-1">
                                                    <Clock className="w-3 h-3" /> EXPIRED
                                                </span>
                                            )}
                                            {v.expiresAt && new Date(v.expiresAt) >= new Date() && (
                                                <span className="text-[9px] text-muted-foreground flex items-center gap-1 opacity-70 px-1">
                                                    <Clock className="w-3 h-3" /> Until {format(new Date(v.expiresAt), 'MMM d')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 font-mono text-xs text-muted-foreground truncate pr-4" title={v.componentPurl}>{v.componentPurl}</div>
                                        <div className="flex-1 text-xs text-muted-foreground italic">{v.justification || '-'}</div>
                                    </div>
                                ))}
                                {auditPack.vex.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground text-sm">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                                        No vulnerabilities detected (or all resolved).
                                    </div>
                                )}
                            </div>
                        </Card>
                    </TabsContent>

                    {/* ACTIVITY TAB */}
                    <TabsContent value="activity" className="mt-6">
                         <Card className="bg-black/40 border-white/10 p-4">
                            <ActivityFeed productId={product.id} />
                        </Card>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="mt-6">
                        <Card className="bg-zinc-900 border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Github className="w-5 h-5 text-purple-400" />
                                    GitHub Integration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Repository URL</label>
                                        <input 
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="https://github.com/owner/repo"
                                            defaultValue={product.repositoryUrl || ''}
                                            id="repoUrl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Manifest File Path</label>
                                        <input 
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder="package.json"
                                            defaultValue={product.manifestFilePath || ''}
                                            id="manifestPath"
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Personal Access Token (PAT)</label>
                                        <input 
                                            type="password"
                                            className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                                            placeholder={product.githubToken ? "Token is set (hidden)" : "ghp_..."}
                                            id="githubToken"
                                        />
                                        <p className="text-[10px] text-muted-foreground">Token is encrypted. Required scopes: `repo` (for Private repos) or `public_repo`. Leave blank to keep existing.</p>
                                    </div>
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button 
                                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                        onClick={async () => {
                                            const repoUrl = (document.getElementById('repoUrl') as HTMLInputElement).value;
                                            const manifestPath = (document.getElementById('manifestPath') as HTMLInputElement).value;
                                            const token = (document.getElementById('githubToken') as HTMLInputElement).value;
                                            
                                            try {
                                                await api.patch(`/products/${product.id}/integrations`, {
                                                    repositoryUrl: repoUrl,
                                                    manifestFilePath: manifestPath,
                                                    githubToken: token || undefined
                                                });
                                                toast("Settings saved", { description: "GitHub integration updated." });
                                            } catch (e) {
                                                toast.error("Failed to save settings");
                                            }
                                        }}
                                    >
                                        Save Configuration
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}

