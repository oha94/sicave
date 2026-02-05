import React, { useState } from 'react';
import { useWarehouse } from '../../context/WarehouseContext';
import { Building2, Store, ChevronDown, Check } from 'lucide-react';
import { cn } from '../../lib/utils'; // Adjust path if needed

export const WarehouseSelector: React.FC = () => {
    const { warehouses, selectedWarehouse, setSelectedWarehouse, loading } = useWarehouse();
    const [isOpen, setIsOpen] = useState(false);

    if (loading) return <div className="animate-pulse w-32 h-10 bg-white/20 rounded-xl"></div>;

    if (warehouses.length === 0) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-4 py-2 bg-white/40 hover:bg-white/60 backdrop-blur-md border border-white/50 rounded-xl transition-all shadow-sm group"
            >
                <div className="p-1.5 bg-white/60 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    {selectedWarehouse?.type === 'store' ? <Store size={18} /> : <Building2 size={18} />}
                </div>
                <div className="text-left hidden md:block">
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{selectedWarehouse?.type === 'store' ? 'Magasin' : 'Entrepôt'}</p>
                    <p className="text-sm font-bold text-slate-800 leading-tight">{selectedWarehouse?.nom || 'Sélectionner'}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute top-full right-0 mt-2 w-64 bg-white/90 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        <div className="p-2 space-y-1">
                            {warehouses.map((w) => (
                                <button
                                    key={w.id}
                                    onClick={() => {
                                        setSelectedWarehouse(w);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group",
                                        selectedWarehouse?.id === w.id
                                            ? "bg-primary/5 text-primary"
                                            : "hover:bg-slate-50 text-slate-600"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-1.5 rounded-lg",
                                            selectedWarehouse?.id === w.id ? "bg-primary/20" : "bg-slate-100 group-hover:bg-white"
                                        )}>
                                            {w.type === 'store' ? <Store size={16} /> : <Building2 size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{w.nom}</p>
                                            <p className="text-xs opacity-70 truncate max-w-[140px]">{w.adresse || w.type}</p>
                                        </div>
                                    </div>
                                    {selectedWarehouse?.id === w.id && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
