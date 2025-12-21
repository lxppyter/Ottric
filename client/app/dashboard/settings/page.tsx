'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Key, Bell, Copy, Trash2, Mail, Hash, Globe, Users, Shield, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [apiKeys, setApiKeys] = useState<any[]>([]);
    const [newKey, setNewKey] = useState<string | null>(null);

    const [channels, setChannels] = useState<any[]>([]);
    const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
    const [newChannel, setNewChannel] = useState({ name: '', type: 'EMAIL', config: {} as any });

    const [members, setMembers] = useState<any[]>([]);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteRole, setInviteRole] = useState('Member');
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                // 1. Fetch Profile First
                const profileRes = await axios.get('http://localhost:3000/users/profile', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const userProfile = profileRes.data;
                setProfile(userProfile);

                // 2. Fetch Common Data (Notifications)
              // 3. Channels & Members
             const [channelsRes] = await Promise.all([
                 axios.get('http://localhost:3000/notifications', { headers: { Authorization: `Bearer ${token}` } }),
             ]);
             setChannels(channelsRes.data);
                // 3. Fetch Members (Accessible to all?) - Check Controller
                // Assuming members list is accessible to all for now, or catch error
                try {
                     const membersRes = await axios.get('http://localhost:3000/organization/members', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setMembers(membersRes.data);
                } catch (e) { console.error("Failed to fetch members"); }

                // 4. Admin Only Data
                if (userProfile.role === 'admin') {
                     try {
                        const keysRes = await axios.get('http://localhost:3000/organization/api-keys', {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        setApiKeys(keysRes.data);
                     } catch (e: any) { 
                        if (e.response?.status === 403) {
                            toast.warning("Session out of sync. Please logout and login to refresh admin permissions.", {
                                action: {
                                    label: "Logout",
                                    onClick: () => {
                                        localStorage.removeItem('token');
                                        router.push('/login');
                                    }
                                }
                            });
                        }
                        console.error("Failed to fetch api keys"); 
                     }
                }

            } catch (e) {
                console.error("Critical: Failed to fetch profile", e);
                // If profile fails, likely token invalid
            }
        };
        fetchData();
    }, []);

    const generateApiKey = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/organization/api-keys', {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewKey(res.data.key);
            toast.success("API Key Generated");
            
            // Refresh keys
             const keysRes = await axios.get('http://localhost:3000/organization/api-keys', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setApiKeys(keysRes.data);
        } catch (e) {
            toast.error("Failed to generate key");
        }
    };

    const deleteApiKey = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/organization/api-keys/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Key deleted");
            setApiKeys(apiKeys.filter(k => k.id !== id));
        } catch (e) {
            toast.error("Failed to delete key");
        }
    };

    const addChannel = async () => {
        try {
            const token = localStorage.getItem('token');
            // Basic validation
            if (!newChannel.name) return toast.error("Name is required");
            
            await axios.post('http://localhost:3000/notifications', newChannel, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Channel added");
            setNewChannel({ name: '', type: 'EMAIL', config: {} }); // Reset form
            setIsAddChannelOpen(false);
            
            // Refresh channels
            const res = await axios.get('http://localhost:3000/notifications', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChannels(res.data);
        } catch (e) {
            toast.error("Failed to add channel");
        }
    };

    const deleteChannel = async (id: string) => {
         try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:3000/notifications/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success("Channel deleted");
            setChannels(channels.filter(c => c.id !== id));
        } catch (e) {
            toast.error("Failed to delete channel");
        }
    }

    const generateInvite = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:3000/organization/invites', { role: inviteRole }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Assume response contains invite ID/Token
            const link = `http://localhost:3000/register?invite=${res.data.id}`;
            setInviteLink(link);
            toast.success("Invitation generated");
        } catch (e) {
            toast.error("Failed to generate invite");
        }
    }

    const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-3xl font-black tracking-tighter text-white mb-2">System Configuration</h1>
        <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">Manage Profile, Keys & Notifications</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-secondary/5 border border-white/5 p-1 w-full justify-start">
                    <TabsTrigger value="profile" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono uppercase text-xs">Profile</TabsTrigger>
                    <TabsTrigger value="general" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono uppercase text-xs">General</TabsTrigger>
                    <TabsTrigger value="notifications" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono uppercase text-xs">Notifications</TabsTrigger>
                </TabsList>
        {/* Profile Tab */}
        <TabsContent value="profile">
            <Card className="bg-secondary/5 border-white/5 shadow-none">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Operator Profile
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Manage your personal identification details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Email Address</Label>
                            <Input value={profile?.email || ''} disabled className="bg-black/20 border-white/10 text-white opacity-50" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Role</Label>
                             <div className="flex items-center h-10 px-3 rounded-md border border-white/10 bg-black/20 text-sm text-white opacity-50 font-mono uppercase">
                                {profile?.role || 'member'}
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-muted-foreground">Company / Organization</Label>
                            <Input value={profile?.organization?.name || ''} disabled className="bg-black/20 border-white/10 text-white opacity-50" />
                    </div>
                </CardContent>

            </Card>
        </TabsContent>

        {/* General Tab */}
        <TabsContent value="general">
             <Card className="bg-secondary/5 border-white/5 shadow-none">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-primary" />
                        Organization Settings
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Manage your organization's display information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold text-muted-foreground">Organization Name</Label>
                        <div className="flex gap-4">
                            <Input 
                                value={profile?.organization?.name || ''} 
                                disabled={!isAdmin}
                                onChange={(e) => setProfile({ ...profile, organization: { ...profile.organization, name: e.target.value } })}
                                className="bg-black/20 border-white/10 text-white" 
                            />
                            {isAdmin && (
                                <Button 
                                    className="bg-primary text-black font-bold"
                                    onClick={async () => {
                                        try {
                                            const token = localStorage.getItem('token');
                                            await axios.patch('http://localhost:3000/organization/me', { name: profile.organization.name }, {
                                                headers: { Authorization: `Bearer ${token}` }
                                            });
                                            toast.success("Organization name updated");
                                        } catch(e) { toast.error("Failed to update"); }
                                    }}
                                >
                                    Save
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="pt-4 border-t border-white/5">
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                            <Globe className="w-5 h-5 text-blue-400 mt-0.5" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-blue-400">Organization ID</h4>
                                <p className="text-xs text-blue-200/70">Unique identifier used for API integrations and billing.</p>
                                <code className="block mt-2 bg-black/40 p-2 rounded text-blue-300 font-mono text-xs">{profile?.organization?.id}</code>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

         {/* Notifications Tab */}
         <TabsContent value="notifications">
             <Card className="bg-secondary/5 border-white/5 shadow-none">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Bell className="w-5 h-5 text-primary" />
                        Alert Preferences
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">Configure email, slack, and webhook integrations.</CardDescription>
                </CardHeader>
                 <CardContent className="space-y-4">
                     {channels.length === 0 && (
                         <div className="text-center py-8 text-muted-foreground text-sm font-mono">
                             No notification channels configured.
                         </div>
                     )}
                     
                     {channels.map((channel) => (
                         <div key={channel.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                             <div className="flex items-center gap-3">
                                {channel.type === 'EMAIL' && <Mail className="w-8 h-8 p-1.5 bg-blue-500/10 text-blue-400 rounded-md" />}
                                {channel.type === 'SLACK' && <Hash className="w-8 h-8 p-1.5 bg-purple-500/10 text-purple-400 rounded-md" />}
                                {channel.type === 'WEBHOOK' && <Globe className="w-8 h-8 p-1.5 bg-green-500/10 text-green-400 rounded-md" />}
                                <div>
                                    <div className="text-sm font-bold text-white">{channel.name}</div>
                                    <div className="text-[10px] font-mono text-muted-foreground uppercase flex items-center gap-2">
                                        <span>{channel.type}</span>
                                        {channel.config?.email && <span className="text-white/40">• {channel.config.email}</span>}
                                        {channel.config?.url && <span className="text-white/40">• {channel.config.url.substring(0, 30)}...</span>}
                                    </div>
                                </div>
                             </div>
                             <Button size="icon" variant="ghost" className="text-white/40 hover:text-red-500" onClick={() => deleteChannel(channel.id)}>
                                <Trash2 className="w-4 h-4" />
                             </Button>
                         </div>
                     ))}
                     
                     <Dialog open={isAddChannelOpen} onOpenChange={setIsAddChannelOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono uppercase text-xs border-dashed">
                                + Add Notification Channel
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-[#0A0A0A] border-white/10 text-white">
                            <DialogHeader>
                                <DialogTitle>Add New Channel</DialogTitle>
                                <DialogDescription>Connect a new destination for alerts.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Friendly Name</Label>
                                    <Input placeholder="e.g. Security Team Slack" value={newChannel.name} onChange={e => setNewChannel({...newChannel, name: e.target.value})} className="bg-black/40 border-white/10 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Channel Type</Label>
                                    <Select onValueChange={(v) => setNewChannel({...newChannel, type: v, config: {}})} defaultValue={newChannel.type}>
                                        <SelectTrigger className="bg-black/40 border-white/10 text-white">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-[#1a1a1a] border-white/10 text-white">
                                            <SelectItem value="EMAIL">Email</SelectItem>
                                            <SelectItem value="SLACK">Slack Webhook</SelectItem>
                                            <SelectItem value="WEBHOOK">Generic Webhook</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {newChannel.type === 'EMAIL' && (
                                    <div className="space-y-2">
                                        <Label>Email Address</Label>
                                        <Input placeholder="user@example.com" value={newChannel.config?.email || ''} onChange={e => setNewChannel({...newChannel, config: { ...newChannel.config, email: e.target.value }})} className="bg-black/40 border-white/10 text-white" />
                                    </div>
                                )}
                                {(newChannel.type === 'SLACK' || newChannel.type === 'WEBHOOK') && (
                                     <div className="space-y-2">
                                        <Label>Webhook URL</Label>
                                        <Input placeholder="https://..." value={newChannel.config?.url || ''} onChange={e => setNewChannel({...newChannel, config: { ...newChannel.config, url: e.target.value }})} className="bg-black/40 border-white/10 text-white" />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={addChannel} className="bg-primary text-black font-bold">Save Channel</Button>
                            </DialogFooter>
                        </DialogContent>
                     </Dialog>

                 </CardContent>
             </Card>
         </TabsContent>

      </Tabs>
    </div>
  );
}
