import { useEffect, useState } from 'react';
import api from '@/lib/axios';
import { format } from 'date-fns';


interface ActivityLog {
    id: string;
    timestamp: string;
    userName: string;
    action: string;
    details: string;
    changes?: any;
    vulnerabilityId: string;
    componentPurl: string;
}

interface ActivityFeedProps {
    productId: string;
}

export function ActivityFeed({ productId }: ActivityFeedProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchActivity = async () => {
            if (!productId) return;
            try {
                // api handles baseURL and Authorization token automatically
                const res = await api.get(`/vex/product/${productId}/activity?limit=50`);
                setLogs(res.data);
            } catch (err) {
                console.error("Failed to fetch activity", err);
            } finally {
                setLoading(false);
            }
        };

        fetchActivity();
        
        // Poll every 30 seconds for live feeling? Or just on mount.
        // On mount is fine for now.
    }, [productId]);

    if (loading) return <div className="text-xs text-zinc-500 animate-pulse">Loading activity...</div>;
    if (logs.length === 0) return <div className="text-xs text-zinc-600">No recent activity.</div>;

    return (
        <div className="w-full pr-4">
            <div className="space-y-6 relative border-l border-zinc-800 ml-2 pl-4 py-2">
                {logs.map((log) => (
                    <div key={log.id} className="relative">
                        {/* Dot */}
                        <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-800 border block border-zinc-600" />
                        
                        <div className="flex flex-col gap-1">
                            {/* Header: User & Time */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-zinc-300">{log.userName}</span>
                                <span className="text-zinc-500 text-[10px]">{format(new Date(log.timestamp), 'MMM d, HH:mm')}</span>
                            </div>

                            {/* Context: Vuln ID */}
                            <div className="text-[10px] font-mono text-blue-400 bg-blue-900/20 px-1.5 py-0.5 rounded w-fit border border-blue-900/50">
                                {log.vulnerabilityId}
                            </div>

                            {/* Details: Action */}
                            <p className="text-xs text-zinc-400 leading-snug">
                                {log.details}
                            </p>

                            {/* Changes Diff */}
                            {log.changes?.status && (
                                <div className="text-[10px] flex gap-1 items-center mt-1 bg-zinc-900/50 p-1.5 rounded border border-white/5">
                                    <span className="opacity-50 line-through">{log.changes.status.old}</span>
                                    <span>→</span>
                                    <span className="font-bold text-white">{log.changes.status.new}</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-8 pt-4 border-t border-white/5 text-center">
                <p className="text-[10px] text-zinc-600 uppercase font-mono">
                    Showing the last 50 actions for performance.
                </p>
            </div>
        </div>
    );
}
