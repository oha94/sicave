import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-slate-500">
            <Construction size={64} className="mb-4 text-slate-300" />
            <h2 className="text-2xl font-bold mb-2">{title}</h2>
            <p className="text-slate-400">Cette fonctionnalité est en cours de développement.</p>
        </div>
    );
};

export default PlaceholderPage;
