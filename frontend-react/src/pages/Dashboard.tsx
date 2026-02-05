import React from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Package, TrendingUp, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Tableau de Bord</h2>
                <p className="text-slate-500 mt-1">Aperçu en temps réel de votre stock.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-accent-start/20 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative">
                        <div>
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Unités en Stock</p>
                            <h3 className="text-4xl font-bold text-slate-800 mt-2">1,240</h3>
                            <div className="mt-2 text-green-600 bg-green-50 px-2 py-1 rounded-lg inline-flex items-center text-xs font-semibold">
                                <TrendingUp size={14} className="mr-1" /> +12% cette semaine
                            </div>
                        </div>
                        <div className="p-3 bg-gradient-to-br from-primary to-primary-light rounded-2xl shadow-lg shadow-primary/20">
                            <Package className="text-white" size={24} />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/30 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative">
                        <div>
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Valeur Totale</p>
                            <h3 className="text-4xl font-bold text-slate-800 mt-2">48.5K €</h3>
                            <p className="text-xs text-slate-400 mt-2">Calculé sur PMP</p>
                        </div>
                        <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-md">
                            <span className="text-2xl">💰</span>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="relative overflow-hidden group border-orange-100">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100/30 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
                    <div className="flex justify-between items-start relative">
                        <div>
                            <p className="text-slate-500 font-medium text-sm uppercase tracking-wider">Alertes Stock</p>
                            <h3 className="text-4xl font-bold text-orange-600 mt-2">3</h3>
                            <p className="text-xs text-orange-400 mt-2">Produits sous seuil critique</p>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-100 rounded-2xl shadow-sm">
                            <AlertTriangle className="text-orange-500" size={24} />
                        </div>
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <GlassCard className="min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-xl text-slate-800">Derniers Mouvements</h3>
                        <button className="text-primary text-sm font-semibold hover:underline">Voir tout</button>
                    </div>
                    <div className="text-center py-12 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <Package size={48} className="mx-auto text-slate-300 mb-3" />
                        <p>Aucun mouvement récent</p>
                    </div>
                </GlassCard>

                <GlassCard className="min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-xl text-slate-800">Répartition par Catégorie</h3>
                    </div>
                    {/* Placeholder Chart */}
                    <div className="flex items-end justify-center gap-4 h-48 px-8 pb-4">
                        <div className="w-12 bg-primary/20 h-[60%] rounded-t-lg relative group">
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">Vins</div>
                        </div>
                        <div className="w-12 bg-primary/40 h-[80%] rounded-t-lg"></div>
                        <div className="w-12 bg-primary/60 h-[40%] rounded-t-lg"></div>
                        <div className="w-12 bg-primary h-[90%] rounded-t-lg"></div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default Dashboard;
