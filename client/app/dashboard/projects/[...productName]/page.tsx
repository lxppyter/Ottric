'use client';

import { useState, useEffect, use } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Shield, Package, FileCode, AlertTriangle, CheckCircle2 } from 'lucide-react';
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

    const fetchAuditPack = async () => {
        setLoading(true);
        try {
            // 2. Fetch Audit Pack for specific version
            const res = await api.get(`/portal/${encodeURIComponent(productName)}/${selectedVersion}/audit-pack`);
            setAuditPack(res.data);
        } catch (e) {
            console.error("Failed to fetch audit pack");
        } finally {
            setLoading(false);
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

            <div className="flex justify-end -mt-4">
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
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="bg-secondary/5 border border-white/5 w-full justify-start h-12 p-1 rounded-lg">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs font-bold uppercase tracking-wide h-9 px-6">Overview</TabsTrigger>
                        <TabsTrigger value="components" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs font-bold uppercase tracking-wide h-9 px-6"><Package className="w-3 h-3 mr-2"/> Components ({auditPack.summary.totalComponents})</TabsTrigger>
                        <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-destructive data-[state=active]:text-white text-xs font-bold uppercase tracking-wide h-9 px-6"><Shield className="w-3 h-3 mr-2" /> Vulnerabilities ({auditPack.summary.totalVulnerabilities})</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid gap-6 md:grid-cols-4">
                            <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase text-muted-foreground">Affected</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-red-500">{auditPack.summary.affected}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase text-muted-foreground">Fixed</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-emerald-500">{auditPack.summary.fixed}</div>
                                </CardContent>
                            </Card>
                             <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase text-muted-foreground">Investigation</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-yellow-500">{auditPack.summary.underInvestigation}</div>
                                </CardContent>
                            </Card>
                            <Card className="bg-secondary/5 border-white/5 text-white shadow-none">
                                <CardHeader className="pb-2"><CardTitle className="text-xs font-mono uppercase text-muted-foreground">Clean</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-black text-blue-500">{auditPack.summary.notAffected}</div>
                                </CardContent>
                            </Card>
                        </div>

                         <Card className="bg-secondary/5 border-white/5 text-white shadow-none p-6">
                             <div className="flex items-center gap-4">
                                <FileCode className="w-8 h-8 text-muted-foreground" />
                                <div>
                                    <h3 className="font-bold">SBOM Metadata</h3>
                                    <pre className="text-xs text-muted-foreground font-mono mt-2 bg-black/50 p-4 rounded border border-white/5 overflow-x-auto">
                                        {JSON.stringify(auditPack.product, null, 2)}
                                    </pre>
                                </div>
                             </div>
                        </Card>
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
                                        <div className="w-32">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                                                v.vulnerability.severity === 'CRITICAL' ? 'bg-red-500 text-white' :
                                                v.vulnerability.severity === 'HIGH' ? 'bg-orange-500 text-white' :
                                                'bg-yellow-500 text-black'
                                            }`}>
                                                {v.vulnerability.severity}
                                            </span>
                                        </div>
                                        <div className="w-40">
                                             <Select 
                                                value={v.status} 
                                                onValueChange={async (val) => {
                                                    try {
                                                        await api.patch(`/vex/${v.id}`, { status: val });
                                                        // Update local state without full reload
                                                        const newVex = [...auditPack.vex];
                                                        newVex[i].status = val;
                                                        
                                                        const newSummary = calculateSummary(newVex);
                                                        setAuditPack({ ...auditPack, vex: newVex, summary: newSummary });
                                                    } catch (e) { console.error(e); }
                                                }}
                                             >
                                                <SelectTrigger className="w-[140px] h-7 text-[10px] border-white/5 bg-black/20 font-mono uppercase">
                                                     <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-white/10 text-white">
                                                    <SelectItem value="affected">Affected</SelectItem>
                                                    <SelectItem value="not_affected">Not Affected</SelectItem>
                                                    <SelectItem value="fixed">Fixed</SelectItem>
                                                    <SelectItem value="under_investigation">Under Investigation</SelectItem>
                                                </SelectContent>
                                            </Select>
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
                </Tabs>
            )}
        </div>
    );
}
