'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { toast } from "sonner";
import { CheckCircle2, XCircle, Settings2, ExternalLink, Hash, LayoutList, Github } from 'lucide-react';

interface IntegrationConfig {
  type: string;
  isEnabled: boolean;
  config: any;
}

export default function IntegrationsPage() {
  const [configs, setConfigs] = useState<Record<string, IntegrationConfig>>({});
  const [loading, setLoading] = useState(false);

  // Form states
  const [jiraHost, setJiraHost] = useState('');
  const [jiraEmail, setJiraEmail] = useState('');
  const [jiraToken, setJiraToken] = useState('');
  const [jiraProject, setJiraProject] = useState('');

  const [openSheet, setOpenSheet] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig('JIRA');
  }, []);

  const fetchConfig = async (type: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3000/integration/${type}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(prev => ({ ...prev, [type]: data }));
        
        if (type === 'JIRA' && data.config) {
            setJiraHost(data.config.host || '');
            setJiraEmail(data.config.email || '');
            setJiraToken(data.config.token || '');
            setJiraProject(data.config.projectKey || '');
        }
      }
    } catch (error) {
      console.error('Failed to fetch config', error);
    }
  };

  const handleSaveJira = async () => {
    setLoading(true);
    try {
       const token = localStorage.getItem('token');
       const payload = {
           host: jiraHost,
           email: jiraEmail,
           token: jiraToken,
           projectKey: jiraProject
       };

       // WARNING: Make sure Port is correct. Usually backend is 3000 or 3001. Previous code said 3001?
       // But I see axios calls to localhost:3000 in frontend usually.
       // Let's stick to what other pages use. Usually via proxy or env.
       // I'll assume 3000 based on standard NestJS.
       
       const res = await fetch(`http://localhost:3000/integration/JIRA`, {
           method: 'PUT',
           headers: { 
               'Content-Type': 'application/json',
               Authorization: `Bearer ${token}`
           },
           body: JSON.stringify(payload)
       });

       if (res.ok) {
           toast.success('Jira configuration saved.');
           fetchConfig('JIRA');
           setOpenSheet(null);
       } else {
           throw new Error('Failed to save');
       }
    } catch (error) {
        toast.error('Failed to save configuration.');
    } finally {
        setLoading(false);
    }
  };

  const integrations = [
    {
      id: 'JIRA',
      name: 'Jira Software',
      description: 'Create issues for vulnerabilities automatically.',
      status: configs['JIRA']?.isEnabled ? 'connected' : 'disconnected'
    },
    {
        id: 'SLACK',
        name: 'Slack',
        description: 'Get notified via Slack channels. (Coming Soon)',
        status: 'coming_soon'
    },
    {
        id: 'GITHUB',
        name: 'GitHub',
        description: 'Sync with GitHub Issues and Actions. (Coming Soon)',
        status: 'coming_soon'
    }
  ];

  const getIcon = (id: string) => {
      switch(id) {
          case 'JIRA': return <LayoutList className="h-6 w-6 text-[#0052CC]" />;
          case 'SLACK': return <Hash className="h-6 w-6 text-[#4A154B]" />;
          case 'GITHUB': return <Github className="h-6 w-6 text-black" />;
          default: return <Settings2 className="h-6 w-6" />;
      }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">Manage your connections to external services.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="flex gap-4">
                <div className="relative h-12 w-12 flex items-center justify-center rounded-lg border bg-white p-2">
                   {getIcon(integration.id)}
                </div>
                <div className="space-y-1">
                  <CardTitle>{integration.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {integration.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="mt-4 flex items-center space-x-2">
                    {integration.status === 'connected' && (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                             <CheckCircle2 className="mr-1 h-3 w-3" /> Connected
                        </Badge>
                    )}
                    {integration.status === 'disconnected' && (
                        <Badge variant="secondary">
                             <XCircle className="mr-1 h-3 w-3" /> Disconnected
                        </Badge>
                    )}
                    {integration.status === 'coming_soon' && (
                        <Badge variant="outline">Coming Soon</Badge>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                {integration.id === 'JIRA' ? (
                  <Sheet open={openSheet === 'JIRA'} onOpenChange={(open: boolean) => setOpenSheet(open ? 'JIRA' : null)}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="w-full">
                            <Settings2 className="mr-2 h-4 w-4" /> Configure
                        </Button>
                    </SheetTrigger>
                    <SheetContent className="sm:max-w-[500px]">
                        <SheetHeader>
                            <SheetTitle>Configure Jira Integration</SheetTitle>
                            <SheetDescription>
                                Enter your Atlassian credentials to enable auto-ticket creation.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-8">
                            <div className="grid gap-2">
                                <Label htmlFor="host">Jira Host URL</Label>
                                <Input 
                                    id="host" 
                                    placeholder="https://your-domain.atlassian.net" 
                                    value={jiraHost}
                                    onChange={(e) => setJiraHost(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input 
                                    id="email" 
                                    placeholder="user@example.com" 
                                    value={jiraEmail}
                                    onChange={(e) => setJiraEmail(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="token">API Token</Label>
                                <Input 
                                    id="token" 
                                    type="password" 
                                    placeholder="Atlassian API Token" 
                                    value={jiraToken}
                                    onChange={(e) => setJiraToken(e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">
                                    <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer" className="underline flex items-center">
                                        Generate Token <ExternalLink className="ml-1 h-3 w-3" />
                                    </a>
                                </p>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="project">Project Key</Label>
                                <Input 
                                    id="project" 
                                    placeholder="KAN, SEC, PROJ" 
                                    value={jiraProject}
                                    onChange={(e) => setJiraProject(e.target.value)}
                                />
                            </div>
                        </div>
                        <SheetFooter>
                            <Button onClick={handleSaveJira} disabled={loading}>
                                {loading ? 'Saving...' : 'Save Configuration'}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                  </Sheet>
                ) : (
                    <Button variant="ghost" className="w-full" disabled>
                        Not Available
                    </Button>
                )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
