'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, CreditCard, Loader2, ShieldCheck, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function BillingPage() {
    const [loading, setLoading] = useState(true);
    const [subscription, setSubscription] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [upgrading, setUpgrading] = useState<string | null>(null);

    const fetchBillingData = async () => {
        try {
            const [subRes, invRes] = await Promise.all([
                api.get('/billing/current'),
                api.get('/billing/invoices')
            ]);
            setSubscription(subRes.data);
            setInvoices(invRes.data);
        } catch (e) {
            console.error("Failed to fetch billing data", e);
            toast.error("Failed to load billing information");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBillingData();
    }, []);

    const handleUpgrade = async (plan: string) => {
        setUpgrading(plan);
        try {
            await api.post('/billing/upgrade', { plan });
            toast.success(`Successfully upgraded to ${plan} plan!`);
            fetchBillingData(); // Refresh
        } catch (e) {
            toast.error("Upgrade failed. Please try again.");
        } finally {
            setUpgrading(null);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>;
    }

    const plans = [
        {
            name: 'FREE',
            price: '$0',
            description: 'For small teams and hobbyists.',
            features: ['1 Projects Max', '7 Days History', 'Community Support', 'Basic Scans'],
            highlight: false
        },
        {
            name: 'PRO',
            price: '$49',
            description: 'For growing startups and dev squads.',
            features: ['50 Projects', '90 Days History', 'Email Support', 'Advanced VEX Tools', 'API Access'],
            highlight: true
        },
        {
            name: 'ENTERPRISE',
            price: 'Custom',
            description: 'For large organizations needing compliance.',
            features: ['Unlimited Projects', '1 Year History', 'Dedicated Support', 'SSO & Audit Logs', 'SLA'],
            highlight: false
        }
    ];

    return (
        <div className="space-y-8 p-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-white mb-2">Billing & Subscription</h1>
                <p className="text-muted-foreground text-sm font-mono uppercase tracking-wide">Manage your plan and invoices</p>
            </div>

            {/* Current Plan */}
            <Card className="bg-secondary/5 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Current Subscription
                    </CardTitle>
                    <CardDescription>You are currently on the <span className="font-bold text-white">{subscription?.plan}</span> plan.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Status</div>
                            <Badge variant={subscription?.status === 'ACTIVE' ? 'default' : 'destructive'} className="font-mono">
                                {subscription?.status}
                            </Badge>
                        </div>
                        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Billing Email</div>
                            <div className="text-sm font-mono text-white">{subscription?.billingEmail || 'Not set'}</div>
                        </div>
                        <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                            <div className="text-xs text-muted-foreground uppercase mb-1">Next Billing</div>
                            <div className="text-sm font-mono text-white">N/A (Simulated)</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Plans */}
            <div className="grid md:grid-cols-3 gap-6">
                {plans.map((plan) => {
                    const isCurrent = subscription?.plan === plan.name;
                    return (
                        <Card key={plan.name} className={`relative flex flex-col ${plan.highlight ? 'border-primary/50 bg-primary/5' : 'bg-secondary/5 border-white/10'}`}>
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase">
                                    Recommended
                                </div>
                            )}
                            <CardHeader>
                                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                                <div className="text-3xl font-black mt-2">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-center text-sm text-muted-foreground">
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button 
                                    className="w-full font-bold uppercase tracking-wide" 
                                    variant={isCurrent ? "outline" : (plan.highlight ? "default" : "secondary")}
                                    disabled={isCurrent || upgrading !== null}
                                    onClick={() => handleUpgrade(plan.name)}
                                >
                                    {isCurrent ? (
                                        <>
                                            <ShieldCheck className="w-4 h-4 mr-2" /> Current Plan
                                        </>
                                    ) : (
                                        <>
                                            {upgrading === plan.name ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                                            {upgrading === plan.name ? 'Upgrading...' : (plan.name === 'ENTERPRISE' ? 'Contact Sales' : 'Upgrade')}
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>

            {/* Invoice History */}
            <Card className="bg-secondary/5 border-white/10">
                <CardHeader>
                    <CardTitle>Invoice History</CardTitle>
                </CardHeader>
                <CardContent>
                     {invoices.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8 text-sm">No invoices found.</div>
                    ) : (
                        <div className="divide-y divide-white/5">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="py-4 flex items-center justify-between">
                                    <div>
                                        <div className="font-bold text-white text-sm">{inv.plan}</div>
                                        <div className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="font-mono text-sm">{inv.amount === 0 ? '$0.00' : `$${inv.amount}`}</div>
                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none uppercase text-[10px]">{inv.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
