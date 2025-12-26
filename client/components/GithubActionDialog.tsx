import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Github, FileCode, MessageSquare } from "lucide-react";
import { useState } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

interface GithubActionDialogProps {
  productId: string;
  vulnerability: any;
  componentPurl?: string;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function GithubActionDialog({ productId, vulnerability, componentPurl, onOpenChange, trigger }: GithubActionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("issue");

  // Form State
  const [title, setTitle] = useState(`Fix Vulnerability: ${vulnerability.id}`);
  const [body, setBody] = useState(`
**Vulnerability**: ${vulnerability.id}
**Severity**: ${vulnerability.severity}
**Summary**: ${vulnerability.summary || 'No summary'}

**Component**: ${componentPurl}
**Fixed Version**: ${vulnerability.fixedIn || 'Not specified'}

This issue was automatically created by Ottric.
  `.trim());
  const [targetVersion, setTargetVersion] = useState(vulnerability.fixedIn || "");

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (activeTab === "issue") {
        const res = await api.post('/integrations/github/issue', {
            productId,
            title,
            body
        });
        toast.success("GitHub Issue Created", { 
            action: { label: "Open", onClick: () => window.open(res.data.url, '_blank') }
        });
      } else {
         const packageName = componentPurl?.split('/')[1]?.split('@')[0] || ""; // Simple parse fallback
         if (!packageName || !targetVersion) {
            toast.error("Package name or target version missing");
            setLoading(false);
            return;
         }

        const res = await api.post('/integrations/github/pr', {
            productId,
            packageName, // Should improve parsing
            targetVersion,
            title: `fix(deps): upgrade ${packageName} to ${targetVersion}`,
            body
        });
        toast.success("Pull Request Created", { 
            action: { label: "Open", onClick: () => window.open(res.data.url, '_blank') }
        });
      }
      setOpen(false);
      onOpenChange?.(false);
    } catch (e: any) {
        toast.error("Failed to perform action", { description: e.response?.data?.message || "Unknown error" });
    } finally {
        setLoading(false);
    }
  };

  const handleOpenChange = (val: boolean) => {
    setOpen(val);
    onOpenChange?.(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline" size="sm"><Github className="w-4 h-4 mr-2"/> GitHub</Button>}
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Github className="w-5 h-5 text-purple-400" />
            GitHub Integration
          </DialogTitle>
          <DialogDescription>
            Create an issue or pull request to remediate this vulnerability.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="issue" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-white/10">
                <TabsTrigger value="issue" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"><MessageSquare className="w-4 h-4 mr-2"/> Create Issue</TabsTrigger>
                <TabsTrigger value="pr" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"><FileCode className="w-4 h-4 mr-2"/> Create PR</TabsTrigger>
            </TabsList>
            
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} className="bg-black/20 border-white/10" />
                </div>
                
                {activeTab === 'pr' && (
                     <div className="space-y-2">
                        <Label>Target Version</Label>
                        <Input value={targetVersion} onChange={e => setTargetVersion(e.target.value)} className="bg-black/20 border-white/10" />
                    </div>
                )}

                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={body} onChange={e => setBody(e.target.value)} className="bg-black/20 border-white/10 min-h-[150px] font-mono text-xs" />
                </div>
            </div>
        </Tabs>

        <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white font-bold">
                {loading ? "Processing..." : (activeTab === 'issue' ? "Create Issue" : "Create Pull Request")}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
