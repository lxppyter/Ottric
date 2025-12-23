'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Key, Plus, Copy, Shield, Users, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export default function OrganizationPage() {
    const [invites, setInvites] = useState<any[]>([]);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [currentUser, setCurrentUser] = useState<any>(null);

    const fetchData = async () => {
        try {
            const [invitesRes, membersRes, profileRes] = await Promise.all([
                api.get('/organization/invites'),
                api.get('/organization/members'),
                api.get('/users/profile')
            ]);

            setInvites(invitesRes.data);
            setMembers(membersRes.data);
            setCurrentUser(profileRes.data);
        } catch (e) {
            console.error("Failed to fetch org data", e);
            toast.error("Failed to load organization data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const generateKey = async () => {
        try {
            await api.post('/organization/invites', {});
            toast.success("New invitation key generated");
            fetchData();
        } catch (e: any) {
             const msg = e.response?.data?.message === 'Forbidden resource' ? 'Only Admins can generate keys' : 'Failed to generate key';
             toast.error(msg);
        }
    };

    const deleteInvite = async (id: string) => {
        try {
            await api.delete(`/organization/invites/${id}`);
            toast.success("Invitation deleted");
            fetchData();
        } catch (e: any) {
             const msg = e.response?.data?.message || "Operation failed";
             toast.error(msg);
        }
    };

    const removeMember = async (id: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            await api.delete(`/organization/members/${id}`);
            toast.success("Member removed from organization");
            fetchData();
        } catch (e: any) {
             const msg = e.response?.data?.message || "Failed to remove member";
             toast.error(msg);
        }
    };

    const copyInviteLink = (code: string) => {
        const link = `${window.location.origin}/register?invite=${code}`;
        navigator.clipboard.writeText(link);
        toast.success("Invite link copied to clipboard");
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-8 max-w-5xl">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Organization</h1>
                <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">Manage Team & Access</p>
            </div>

            <Tabs defaultValue="members" className="space-y-6">
                <TabsList className="bg-secondary/5 border border-white/5 p-1">
                    <TabsTrigger value="members" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono uppercase text-xs">Team Members</TabsTrigger>
                    <TabsTrigger value="invites" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-mono uppercase text-xs">Invitation Keys</TabsTrigger>
                </TabsList>

                {/* Members Tab */}
                <TabsContent value="members">
                    <Card className="bg-secondary/5 border-white/5 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-primary" />
                                Active Personnel
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {members.map((member: any) => (
                                    <div key={member.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <User className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white">{member.email}</div>
                                                <div className="text-xs text-muted-foreground uppercase font-mono">{member.role}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-muted-foreground font-mono">
                                                Joined: {formatDate(member.createdAt)}
                                            </span>
                                            {/* Only Admins can remove members, but not themselves */}
                                            {currentUser?.role === 'admin' && currentUser?.id !== member.id && (
                                                <Button variant="ghost" size="sm" onClick={() => removeMember(member.id)} className="text-red-400 hover:text-red-500 hover:bg-red-500/10 h-8 w-8 p-0">
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Invites Tab */}
                <TabsContent value="invites">
                    <Card className="bg-secondary/5 border-white/5 shadow-none">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Key className="w-5 h-5 text-primary" />
                                    Access Keys
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">Generated keys are valid for 15 minutes.</CardDescription>
                            </div>
                            {currentUser?.role === 'admin' && (
                                <Button onClick={generateKey} className="bg-primary text-black font-bold uppercase text-xs">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Generate Key
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {invites.length === 0 ? (
                                    <div className="text-center text-muted-foreground py-8 text-sm font-mono">No active invitation keys.</div>
                                ) : (
                                    invites.map((invite: any) => {
                                        const isExpired = invite.status === 'expired' || (invite.expiresAt && new Date(invite.expiresAt) < new Date());
                                        const status = isExpired ? 'expired' : invite.status;
                                        
                                        return (
                                        <div key={invite.id} className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors group">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                     <div className={`font-mono text-sm font-bold tracking-wider ${isExpired ? 'text-muted-foreground line-through decoration-red-500/50' : 'text-white'}`}>
                                                        {invite.id}
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px] uppercase border border-white/10" onClick={() => copyInviteLink(invite.id)}>
                                                        Copy Link
                                                    </Button>
                                                </div>
                                               
                                                <div className="flex gap-4 text-xs text-muted-foreground items-center">
                                                    <span>Created: {formatDate(invite.createdAt)}</span>
                                                    <span className={`uppercase font-mono text-[10px] px-2 py-0.5 rounded-full border ${
                                                        status === 'pending' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10' :
                                                        status === 'expired' ? 'text-red-400 border-red-400/20 bg-red-400/10' :
                                                        'text-muted-foreground border-white/10'
                                                    }`}>
                                                        {status}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="icon" onClick={() => deleteInvite(invite.id)} className="hover:bg-red-500/10 hover:text-red-500 text-muted-foreground" disabled={currentUser?.role !== 'admin'}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )})
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
