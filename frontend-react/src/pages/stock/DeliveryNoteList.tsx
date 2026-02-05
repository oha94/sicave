import React, { useState, useEffect } from 'react';
import { stockService } from '../../services/stockService';
import { GlassCard } from '../../components/ui/GlassCard';
import { Plus, Search, FileText, Calendar, Truck, CheckCircle2, CircleDashed } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const DeliveryNoteList: React.FC = () => {
    const [receptions, setReceptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchReceptions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                search,
                date_from: dateFrom,
                date_to: dateTo
            };
            const response = await stockService.getReceptions(params);
            setReceptions(response.data);
            setLastPage(response.last_page);
        } catch (error) {
            console.error("Erreur chargement réceptions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReceptions();
    }, [page, search, dateFrom, dateTo]);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileText className="text-primary" /> Bons de Livraison
                    </h2>
                    <p className="text-slate-500">Gérer les réceptions de marchandises fournisseurs</p>
                </div>
                <Link to="/stock/receptions/new" className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/25">
                    <Plus size={20} /> Nouveau Bon de Livraison
                </Link>
            </div>

            {/* Filters */}
            <GlassCard className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="col-span-1 md:col-span-2 relative">
                    <label className="text-xs font-semibold text-slate-500 ml-1 mb-1 block">Recherche (BL, Fournisseur)</label>
                    <Search className="absolute left-3 top-[34px] text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-glass pl-10 w-full"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 ml-1 mb-1 block">Du</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="input-glass w-full"
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 ml-1 mb-1 block">Au</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="input-glass w-full"
                    />
                </div>
            </GlassCard>

            {/* List */}
            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Référence (BL)</th>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Fournisseur</th>
                                <th className="text-left py-4 px-6 text-slate-600 font-semibold text-sm">Date</th>
                                <th className="text-center py-4 px-6 text-slate-600 font-semibold text-sm">Statut</th>
                                <th className="text-right py-4 px-6 text-slate-600 font-semibold text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Chargement...</td></tr>
                            ) : receptions.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400">Aucun bon de livraison trouvé</td></tr>
                            ) : (
                                receptions.map((reception) => (
                                    <tr key={reception.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="font-semibold text-slate-700">{reception.reference_externe || '---'}</div>
                                            <div className="text-xs text-slate-400">ID: {reception.id.substring(0, 8)}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <Truck size={16} className="text-slate-400" />
                                                {reception.supplier?.nom || 'Fournisseur inconnu'}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                {format(new Date(reception.created_at), 'dd MMM yyyy', { locale: fr })}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {reception.status === 'validated' ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                                    <CheckCircle2 size={12} /> Validé
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                    <CircleDashed size={12} /> Brouillon
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link
                                                to={`/stock/delivery-note/${reception.id}`}
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

                {/* Pagination */}
                <div className="p-4 border-t border-slate-100 flex justify-between items-center">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50 hover:bg-slate-50"
                    >
                        Précédent
                    </button>
                    <span className="text-sm text-slate-500">Page {page} sur {lastPage}</span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page === lastPage}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-50 hover:bg-slate-50"
                    >
                        Suivant
                    </button>
                </div>
            </GlassCard>
        </div>
    );
};

export default DeliveryNoteList;
