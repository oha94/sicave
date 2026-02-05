import React from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { Search, Filter, MoreHorizontal, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';
import { stockService } from '../services/stockService';

const StockList: React.FC = () => {
    const [products, setProducts] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await stockService.getProducts();
            setProducts(data.data);
        } catch (err) {
            console.error(err);
            setError('Erreur lors du chargement des stocks');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le produit "${name}" ?`)) return;

        try {
            await stockService.deleteProduct(id);
            // Refresh list
            fetchProducts();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || "Erreur lors de la suppression");
        }
    };

    if (loading) return <div className="p-4">Chargement...</div>;
    if (error) return <div className="p-4 text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Liste des Stocks</h2>
                    <p className="text-slate-500">Vue détaillée par entrepôt - Principal</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white/60 border border-white/60 rounded-xl text-slate-600 hover:bg-white transition shadow-sm">
                        <Filter size={18} />
                        <span>Filtrer</span>
                    </button>
                    <button className="btn-primary flex items-center gap-2">
                        <Search size={18} />
                        <span>Rechercher</span>
                    </button>
                </div>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Produit</th>
                                <th className="p-4 font-semibold">Catégorie</th>
                                <th className="p-4 font-semibold text-right">Prix Unitaire</th>
                                <th className="p-4 font-semibold text-center">Niveau Stock</th>
                                <th className="p-4 font-semibold text-center">Statut</th>
                                <th className="p-4 text-center"><MoreHorizontal size={16} /></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {products.map((item) => {
                                // Calculate total stock from warehouses
                                const stock = item.warehouses?.reduce((acc: number, w: any) => acc + (w.pivot?.stock_actuel || 0), 0) || 0;
                                const min = item.warehouses?.reduce((acc: number, w: any) => acc + (w.pivot?.stock_alerte || 0), 0) || 10;
                                let status = 'ok';
                                if (stock <= 0) status = 'critical';
                                else if (stock <= min) status = 'warning';

                                return (
                                    <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                                        <td className="p-4">
                                            <div>
                                                <div className="font-semibold text-slate-800">{item.designation}</div>
                                                <div className="text-xs text-slate-400">{item.sku}</div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                                                {item.category?.name || 'Sans catégorie'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right font-medium text-slate-700">
                                            {Number(item.selling_price).toFixed(2)} €
                                        </td>
                                        <td className="p-4">
                                            <div className="max-w-[140px] mx-auto">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="font-semibold text-slate-700">{stock}</span>
                                                    <span className="text-slate-400">/ {min * 3}</span>
                                                </div>
                                                {/* Progress Bar Stylisée */}
                                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full bg-gradient-to-r ${status === 'critical' ? 'from-red-300 to-red-500' :
                                                            status === 'warning' ? 'from-orange-300 to-orange-500' :
                                                                'from-accent-start to-accent-end'
                                                            }`}
                                                        style={{ width: `${Math.min((stock / (min * 3 || 1)) * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {status === 'ok' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/50 text-green-700 text-xs font-semibold border border-green-200">
                                                    <CheckCircle2 size={12} /> Stock OK
                                                </span>
                                            )}
                                            {status === 'warning' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100/50 text-orange-700 text-xs font-semibold border border-orange-200">
                                                    <AlertCircle size={12} /> Faible
                                                </span>
                                            )}
                                            {status === 'critical' && (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100/50 text-red-700 text-xs font-semibold border border-red-200">
                                                    <AlertCircle size={12} /> Rupture
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center gap-2">
                                                <button
                                                    onClick={() => handleDelete(item.id, item.designation)}
                                                    className="p-2 hover:bg-red-50 rounded-lg text-red-500/70 hover:text-red-600 transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination (Static for now, can be connected to API meta later) */}
                <div className="p-4 border-t border-slate-100/50 flex items-center justify-between text-sm text-slate-500">
                    <div>Affichage de {products.length} produits</div>
                    {/* <div className="flex gap-2">
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50">Précédent</button>
                        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50">Suivant</button>
                    </div> */}
                </div>
            </GlassCard>
        </div>
    );
};

export default StockList;
