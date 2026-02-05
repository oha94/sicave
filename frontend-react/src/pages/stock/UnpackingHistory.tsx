import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { History, Link2, Calendar, Search } from 'lucide-react';
import api from '../../services/api';

const UnpackingHistory: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'config' | 'history'>('config');
    const [configs, setConfigs] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate]);

    const fetchData = () => {
        setLoading(true);
        api.getUnpackingHistory({ start_date: startDate, end_date: endDate })
            .then(data => {
                setConfigs(data.configurations);
                setHistory(data.history);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <History className="text-primary" /> Historique & Configurations
                    </h2>
                    <p className="text-slate-500">Suivi des déconditionnements (Parents/Enfants) et de l'historique.</p>
                </div>

                <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <button
                        onClick={() => setActiveTab('config')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'config' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Configurations Actives
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Historique
                    </button>
                </div>
            </div>

            {/* Content */}
            <GlassCard className="min-h-[500px]">
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Chargement...</div>
                ) : activeTab === 'config' ? (
                    <div>
                        <div className="p-4 border-b border-white/20 bg-slate-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <Link2 size={18} /> Liens Articles (Parents / Détails)
                            </h3>
                            <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">{configs.length} liens actifs</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="text-xs uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Article Parent (Source)</th>
                                        <th className="px-6 py-3 text-center">Ratio</th>
                                        <th className="px-6 py-3 text-left">Article Détail (Enfant)</th>
                                        <th className="px-6 py-3 text-left">Catégorie</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {configs.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 font-medium text-slate-700">{item.parent_name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                                    1 = {item.conversion_rate}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{item.child_name}</td>
                                            <td className="px-6 py-4 text-slate-400 text-sm">{item.category}</td>
                                        </tr>
                                    ))}
                                    {configs.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="p-8 text-center text-slate-400">Aucune configuration trouvée. Effectuez un déconditionnement manuel pour créer un lien.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="p-4 border-b border-white/20 bg-slate-50/50 flex flex-wrap gap-4 justify-between items-center">
                            <h3 className="font-bold text-slate-700 flex items-center gap-2">
                                <History size={18} /> Journal des Déconditionnements
                            </h3>
                            <div className="flex items-center gap-2">
                                <Calendar size={16} className="text-slate-400" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    className="input-glass py-1 px-3 text-sm h-8"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="input-glass py-1 px-3 text-sm h-8"
                                />
                                <button onClick={fetchData} className="btn-primary py-1 px-3 h-8 text-sm">
                                    Filtrer
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="text-xs uppercase text-slate-400 bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-left">Date</th>
                                        <th className="px-6 py-3 text-left">Type</th>
                                        <th className="px-6 py-3 text-left">Parent Utilisé</th>
                                        <th className="px-6 py-3 text-left">Détail Créé</th>
                                        <th className="px-6 py-3 text-right">Quantité (Détails)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            <td className="px-6 py-4 text-sm text-slate-500">{item.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-xs px-2 py-1 rounded-full border ${item.type.includes('Auto')
                                                        ? 'bg-purple-50 text-purple-700 border-purple-100'
                                                        : 'bg-green-50 text-green-700 border-green-100'
                                                    }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{item.parent_product}</td>
                                            <td className="px-6 py-4 text-slate-600">{item.child_product}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700">+{item.quantity_created}</td>
                                        </tr>
                                    ))}
                                    {history.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-slate-400">Aucun historique sur cette période.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default UnpackingHistory;
