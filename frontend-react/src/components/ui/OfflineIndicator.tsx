import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '../../lib/utils';

export const OfflineIndicator: React.FC = () => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border",
            isOnline
                ? "bg-green-100/80 text-green-800 border-green-200"
                : "bg-orange-100/80 text-orange-800 border-orange-200"
        )}>
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            <span>{isOnline ? "En ligne" : "Hors ligne"}</span>
        </div>
    );
};
