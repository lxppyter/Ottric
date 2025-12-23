'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileCode, CheckCircle2, History, Loader2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function IngestionPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchHistory = async () => {
    try {
        const res = await api.get('/sbom');
        setHistory(res.data);
    } catch (e: any) {
        console.error("Failed to fetch history:", e.response?.data || e.message);
    }
  };

  useEffect(() => {
      fetchHistory();
      const interval = setInterval(fetchHistory, 10000); // Poll every 10s
      return () => clearInterval(interval);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/sbom/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('SBOM uploaded and queued for processing');
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchHistory();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileSelect = () => {
      fileInputRef.current?.click();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Ingestion Pipeline</h1>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">Upload & Process SBOM Files</p>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        
        {/* Upload Area */}
        <div className="md:col-span-2 space-y-6">
            <Card className="bg-secondary/5 border-dashed border-2 border-white/10 hover:border-primary/50 transition-colors cursor-pointer group h-[300px] flex items-center justify-center relative overflow-hidden" onClick={triggerFileSelect}>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".json,.xml" 
                    onChange={handleFileSelect}
                />
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-center relative z-10 p-6">
                    {file ? (
                        <div className="animate-in fade-in zoom-in duration-300">
                             <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50">
                                <FileCode className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{file.name}</h3>
                            <p className="text-muted-foreground text-xs mb-6 font-mono">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Button onClick={(e) => { e.stopPropagation(); handleUpload(); }} disabled={uploading} className="bg-primary text-black font-bold uppercase text-xs">
                                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                                    {uploading ? 'Uploading...' : 'Confirm Upload'}
                                </Button>
                                <Button onClick={(e) => { e.stopPropagation(); setFile(null); }} variant="outline" className="border-white/10 text-white hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">Drop SBOM File Here</h3>
                            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
                                Supports CycloneDX (JSON/XML) and SPDX. Max file size 50MB.
                            </p>
                            <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10 text-white font-mono uppercase text-xs">
                                Select from System
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="bg-secondary/5 border-white/5 shadow-none p-4 flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Auto-Validation</div>
                        <div className="text-xs text-muted-foreground">Schema check active</div>
                    </div>
                </Card>
                <Card className="bg-secondary/5 border-white/5 shadow-none p-4 flex items-center gap-4">
                     <div className="p-2 bg-blue-500/10 rounded-lg">
                        <FileCode className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-white">Format Detection</div>
                        <div className="text-xs text-muted-foreground">JSON / XML supported</div>
                    </div>
                </Card>
            </div>
        </div>

        {/* Recent Jobs */}
        <div className="md:col-span-1">
            <Card className="bg-secondary/5 border-white/5 shadow-none h-full">
                <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-mono font-bold uppercase tracking-widest text-muted-foreground">Ingestion History</CardTitle>
                        <History className="w-4 h-4 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        {history.length === 0 ? (
                            <div className="text-center text-muted-foreground text-xs py-4">No recent ingestion jobs.</div>
                        ) : (
                            history.map((job, i) => (
                            <div key={i} className="group">
                                <div className="flex items-start justify-between mb-1">
                                    <div className="text-sm font-bold text-white truncate max-w-[150px]">{job.release?.product?.name || 'Unknown Project'}</div>
                                    <div className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20`}>
                                        COMPLETED
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                                    <span>{job.release?.version || 'v1.0'}</span>
                                    <span>{new Date(job.updatedAt || job.createdAt).toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                {i !== history.length - 1 && <div className="h-px bg-white/5 mt-3 group-hover:bg-white/10 transition-colors" />}
                            </div>
                        )))}
                    </div>
                </CardContent>
            </Card>
        </div>

      </div>
    </div>
  );
}
