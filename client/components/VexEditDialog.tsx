
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Shield, AlertTriangle, CheckCircle2, CalendarIcon } from 'lucide-react';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import api from '@/lib/axios';
import { format } from 'date-fns';

interface VexEditDialogProps {
  vex: any;
  onUpdate: (newStatus: string, justification: string, expiresAt?: Date) => void;
  children: React.ReactNode;
}

const JUSTIFICATION_TEMPLATES = [
  "Component not present",
  "Vulnerable code not in execute path",
  "Inline mitigation already exists",
  "Environment prevented",
  "Vulnerable code not reachable (Static Analysis)",
];

import { getPolicySuggestion, PolicySuggestion } from '@/lib/policyEngine';

export function VexEditDialog({ vex, children, onUpdate }: VexEditDialogProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string>(vex.status);
  const [justification, setJustification] = useState(vex.justification || '');
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(vex.expiresAt ? new Date(vex.expiresAt) : undefined);
  const [policySuggestion, setPolicySuggestion] = useState<PolicySuggestion | null>(null);

  useEffect(() => {
    if (open) {
        setStatus(vex.status);
        setJustification(vex.justification || '');
        setExpiresAt(vex.expiresAt ? new Date(vex.expiresAt) : undefined);
        
        // Analyze for policy suggestion
        const suggestion = getPolicySuggestion(vex.vulnerability);
        setPolicySuggestion(suggestion);
    }
  }, [open, vex]);

  const handleSave = async () => {
    try {
      await api.patch(`/vex/${vex.id}`, {
        status,
        justification,
        expiresAt
      });
      onUpdate(status, justification, expiresAt);
      setOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-zinc-950 border-white/10 text-white sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
             Edit Status <span className="text-zinc-500">/</span> {vex.vulnerability?.id}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-zinc-500">Impact Analysis</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="bg-zinc-900 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="under_investigation">Under Investigation</SelectItem>
                  <SelectItem value="affected">Affected</SelectItem>
                  <SelectItem value="not_affected">Not Affected (Won't Fix)</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* POLICY SUGGESTION BLOCK */}
            {policySuggestion && (status === 'not_affected' || status === 'under_investigation') && (
                <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-blue-100">{policySuggestion.title}</h4>
                            <p className="text-xs text-blue-300/80 leading-relaxed">{policySuggestion.description}</p>
                        </div>
                    </div>
                    
                    <div className="pl-8">
                        <Button 
                            variant="secondary" 
                            size="sm" 
                            disabled={!!justification}
                            className="h-7 text-xs bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => setJustification(policySuggestion.mitigationText)}
                        >
                            <CheckCircle2 className="w-3 h-3 mr-2" />
                            Apply Proposed Mitigation Plan
                        </Button>
                    </div>
                </div>
            )}


            {(status === 'not_affected' || status === 'fixed') && (
                <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-xs font-bold uppercase text-zinc-500">Expires On (Re-validate)</label>
                    <Popover modal={true}>
                        <PopoverTrigger asChild>
                            <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal bg-zinc-900 border-white/10",
                                    !expiresAt && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {expiresAt ? format(expiresAt, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-zinc-950 border-white/10" align="start" collisionPadding={16}>
                            <Calendar
                                mode="single"
                                selected={expiresAt}
                                onSelect={setExpiresAt}
                                initialFocus
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                className="text-white bg-zinc-950" 
                            />
                        </PopoverContent>
                    </Popover>
                </div>
            )}

            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-zinc-500">Justification / Mitigation Plan</label>
              <Textarea 
                value={justification} 
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Explain why this status applies..."
                className="bg-zinc-900 border-white/10 min-h-[150px] font-mono text-xs"
              />
            </div>
        </div>
            
        <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="border-white/10 bg-transparent hover:bg-white/5 text-white">Cancel</Button>
            <Button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

