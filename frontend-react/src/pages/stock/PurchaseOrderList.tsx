import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Eye, Plus, Calendar } from 'lucide-react';
import { purchaseService } from '../../services/purchaseService';
import { Link } from 'react-router-dom';

import { useWarehouse } from '../../context/WarehouseContext';

const PurchaseOrderList: React.FC = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { selectedWarehouse } = useWarehouse();

    useEffect(() => {
        fetchOrders();
    }, [selectedWarehouse]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await purchaseService.getPurchaseOrders(selectedWarehouse ? { warehouse_id: selectedWarehouse.id } : {});
            setOrders(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'draft': return <span className="badge bg-slate-100 text-slate-600">Brouillon</span>;
            case 'ordered': return <span className="badge bg-blue-100 text-blue-700">Commandé</span>;
            case 'received': return <span className="badge bg-green-100 text-green-700">Reçu</span>;
            case 'cancelled': return <span className="badge bg-red-100 text-red-700">Annulé</span>;
            default: return <span className="badge bg-slate-100 text-slate-600">{status}</span>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Commandes Fournisseurs</h2>
                    <p className="text-slate-500">Gérez vos approvisionnements</p>
                </div>
                <Link to="/stock/orders/new" className="btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    <span>Nouvelle Commande</span>
                </Link>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500 font-semibold">
                            <th className="p-4">Référence</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Fournisseur</th>
                            <th className="p-4">Entrepôt</th>
                            <th className="p-4 text-center">Statut</th>
                            <th className="p-4 text-right">Montant HT</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan={7} className="p-8 text-center">Chargement...</td></tr>
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-slate-500">Aucune commande trouvée.</td></tr>
                        ) : (
                            orders.map((po) => (
                                <tr key={po.id} className="hover:bg-slate-50/50">
                                    <td className="p-4 font-medium text-primary">{po.reference}</td>
                                    <td className="p-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-slate-400" />
                                            {new Date(po.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="p-4">{po.supplier?.name}</td>
                                    <td className="p-4 text-sm text-slate-500">{po.warehouse?.name}</td>
                                    <td className="p-4 text-center">{getStatusBadge(po.status)}</td>
                                    <td className="p-4 text-right font-medium">
                                        {Number(po.total_ht).toLocaleString()} Cfa fr
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link to={`/stock/orders/${po.id}`} className="inline-block p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors">
                                            <Eye size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </GlassCard>
        </div>
    );
};

export default PurchaseOrderList;
