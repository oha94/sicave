import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GlassCard } from '../components/ui/GlassCard';
import { Package, Receipt, Settings, FolderOpen, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils'; // Ensure path is correct
import api from '../services/api';

const HomeMenu: React.FC = () => {
    const [logoUrl, setLogoUrl] = useState<string | null>(null);

    useEffect(() => {
        api.getSettings().then(data => {
            if (data.company_logo) {
                setLogoUrl(`http://localhost:8000${data.company_logo}`);
            }
        });
    }, []);

    const modules = [
        {
            title: 'GESTION STOCK',
            icon: Package,
            path: '/stock',
            desc: 'Entrées, Inventaires, Mouvements',
            color: 'bg-teal-500',
            gradient: 'from-teal-400 to-teal-600'
        },
        {
            title: 'FACTURATION ET CAISSE',
            icon: Receipt,
            path: '/facturation',
            desc: 'Caisse, Factures, Recouvrement',
            color: 'bg-blue-500',
            gradient: 'from-blue-400 to-blue-600'
        },
        {
            title: 'DOCUMENTS',
            icon: FolderOpen,
            path: '/documents',
            desc: 'Archives, Rapports, Exports',
            color: 'bg-orange-500',
            gradient: 'from-orange-400 to-orange-600'
        },
        {
            title: 'PARAMÈTRES',
            icon: Settings,
            path: '/parametres',
            desc: 'Utilisateurs, Droits, Config',
            color: 'bg-slate-500',
            gradient: 'from-slate-400 to-slate-600'
        }
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-8">
            <div className="max-w-6xl w-full space-y-8">
                <div className="text-center space-y-4">
                    {logoUrl ? (
                        <div className="flex justify-center mb-6">
                            <img src={logoUrl} alt="Company Logo" className="h-24 object-contain" />
                        </div>
                    ) : (
                        <h1 className="text-4xl font-bold text-primary tracking-tight">SICAVE ERP</h1>
                    )}
                    <p className="text-slate-500 text-lg">Sélectionnez un module pour commencer</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {modules.map((mod) => (
                        <Link key={mod.title} to={mod.path} className="group">
                            <GlassCard className="h-full hover:scale-105 transition-all duration-300 hover:shadow-xl border-t-4 border-t-white relative overflow-hidden group-hover:border-t-transparent">

                                {/* Background Decoration */}
                                <div className={cn("absolute top-0 left-0 w-full h-1 transition-all duration-300", mod.gradient, "group-hover:h-full opacity-10 group-hover:opacity-10")}></div>

                                <div className="flex flex-col items-center text-center space-y-4 relative z-10 py-6">
                                    <div className={cn("p-4 rounded-2xl text-white shadow-lg transform group-hover:rotate-6 transition-transform", mod.gradient)}>
                                        <mod.icon size={32} />
                                    </div>

                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 group-hover:text-primary transition-colors">{mod.title}</h3>
                                        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{mod.desc}</p>
                                    </div>

                                    <div className="pt-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0">
                                        <span className="flex items-center text-xs font-bold text-primary uppercase tracking-wider">
                                            Accéder <ArrowRight size={14} className="ml-1" />
                                        </span>
                                    </div>
                                </div>
                            </GlassCard>
                        </Link>
                    ))}
                </div>

                <div className="text-center text-slate-400 text-sm mt-12">
                    &copy; 2026 SICAVE - Gestion de Cave & Vin
                </div>
            </div>
        </div>
    );
};

export default HomeMenu;
