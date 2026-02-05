import React from 'react';
import { cn } from '../../lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, ...props }) => {
    return (
        <div
            className={cn("glass-card p-6", className)}
            {...props}
        >
            {children}
        </div>
    );
};
