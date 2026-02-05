import React, { useState, useEffect } from 'react';
import { stockService } from '../../services/stockService';
import { GlassCard } from '../../components/ui/GlassCard';
import { Plus, Search, Archive, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ReturnNoteList: React.FC = () => {
    const [returns, setReturns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'archived'>('pending');
    const [search, setSearch] = useState('');

    const fetchReturns = async () => {
        setLoading(true);
        try {
            const params = {
                status: activeTab,
                search
            };
            const response = await stockService.getSupplierReturns(params);
            setReturns(response.data);
        } catch (error) {
            console.error("Erreur chargement retours", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, [activeTab, search]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Archive className="text-amber-500" /> Bons de Retour
                    </h2>
                    <p className="text-slate-500">Gérer les retours marchandises aux fournisseurs</p>
                </div>
                <Link to="/stock/return-notes/new" className="btn-primary bg-amber-600 hover:bg-amber-700 flex items-center gap-2 shadow-lg shadow-amber-600/20">
                    <Plus size={20} /> Nouveau Retour
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'pending' ? 'text-amber-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    En Attente
                    {activeTab === 'pending' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-600 rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('archived')}
                    className={`pb-3 px-2 font-medium transition-colors relative ${activeTab === 'archived' ? 'text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Archives (Traités)
                    {activeTab === 'archived' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-800 rounded-t-full"></div>}
                </button>
            </div>

            {/* List */}
            <GlassCard className="overflow-hidden p-0">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (Réf, Fournisseur)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="input-glass pl-10 w-full"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Réf Retour</th>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Fournisseur</th>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Date</th>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Basé sur BL</th>
                                <th className="text-center py-4 px-6 text-slate-600 font-semibold text-sm">Statut</th>
                                <th className="text-right py-4 px-6 text-slate-600 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Chargement...</td></tr>
                            ) : returns.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Aucun bon de retour trouvé</td></tr>
                            ) : (
                                returns.map((ret) => (
                                    <tr key={ret.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6 font-semibold text-slate-700">
                                            {ret.reference}
                                        </td>
                                        <td className="py-4 px-6 text-slate-700">
                                            {ret.supplier?.nom}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600 flex items-center gap-2">
                                            <Clock size={14} className="text-slate-400" />
                                            {format(new Date(ret.created_at), 'dd MMM yyyy', { locale: fr })}
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            {ret.reception?.reference_externe || '---'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {ret.status === 'pending' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                                    <AlertCircle size={12} /> En Attente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    <Archive size={12} /> Archivé
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link
                                                to={`/stock/return-notes/${ret.id}`}
                                                className="text-primary hover:text-primary-dark font-medium text-sm"
                                            >
                                                Voir détails
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default ReturnNoteList;
