'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export function PersonalNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [hasUnread, setHasUnread] = useState(false);
    const [open, setOpen] = useState(false);

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/users/notifications');
            setNotifications(res.data);
            setHasUnread(res.data.some((n: any) => !n.isRead));
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.post(`/users/notifications/${id}/read`);
            // Update local state
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setHasUnread(notifications.some(n => !n.isRead && n.id !== id));
        } catch (e) {
            console.error("Failed to mark read");
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-white">
                    <Bell className="w-5 h-5" />
                    {hasUnread && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-black/90 border-white/10 backdrop-blur-xl" align="end">
                <div className="p-3 border-b border-white/10 flex justify-between items-center">
                    <h4 className="font-bold text-sm text-white">Notifications</h4>
                    {hasUnread && <span className="text-[10px] text-primary uppercase font-mono">New Alerts</span>}
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">No new notifications</div>
                    ) : (
                        notifications.map((notif: any) => (
                            <div 
                                key={notif.id} 
                                className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${!notif.isRead ? 'bg-primary/5' : ''}`}
                                onClick={() => !notif.isRead && markAsRead(notif.id)}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h5 className={`text-xs font-bold ${!notif.isRead ? 'text-primary' : 'text-white/70'}`}>{notif.title}</h5>
                                    <span className="text-[10px] text-muted-foreground">{new Date(notif.createdAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{notif.message}</p>
                            </div>
                        ))
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
