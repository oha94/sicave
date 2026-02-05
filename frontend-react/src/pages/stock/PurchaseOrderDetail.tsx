import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { purchaseService } from '../../services/purchaseService';
import { ArrowLeft, Printer, Send, CheckCircle } from 'lucide-react';

const PurchaseOrderDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [po, setPo] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) fetchPo(id);
    }, [id]);

    const fetchPo = async (poId: string) => {
        try {
            setLoading(true);
            const data = await purchaseService.getPurchaseOrder(poId);
            setPo(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!po) return <div className="p-8 text-center text-red-500">Commande introuvable</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/stock/orders')} className="p-2 hover:bg-slate-100 rounded-full">
                        <ArrowLeft size={20} className="text-slate-500" />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Commande {po.reference}</h2>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${po.status === 'draft' ? 'bg-slate-100 text-slate-600' :
                                po.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                                    'bg-green-100 text-green-700'
                            }`}>
                            {po.status.toUpperCase()}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary flex items-center gap-2">
                        <Printer size={18} />
                        <span>Imprimer</span>
                    </button>
                    {po.status === 'draft' && (
                        <button className="btn-primary flex items-center gap-2">
                            <Send size={18} />
                            <span>Valider & Envoyer</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Fournisseur</h3>
                    <div>
                        <div className="font-bold text-lg">{po.supplier?.name}</div>
                        <div className="text-slate-500 text-sm">{po.supplier?.email}</div>
                        <div className="text-slate-500 text-sm">{po.supplier?.phone}</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Livraison</h3>
                    <div>
                        <div className="text-sm text-slate-500">Entrepôt</div>
                        <div className="font-medium">{po.warehouse?.name}</div>
                    </div>
                    <div>
                        <div className="text-sm text-slate-500">Date Prévue</div>
                        <div className="font-medium">{po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}</div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 space-y-4">
                    <h3 className="font-semibold text-slate-700 border-b pb-2">Total</h3>
                    <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span className="text-slate-600">Total HT</span>
                        <span className="font-bold text-lg">{Number(po.total_ht).toLocaleString()} €</span>
                    </div>
                </GlassCard>
            </div>

            <GlassCard className="p-0 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                        <tr>
                            <th className="p-4">Produit</th>
                            <th className="p-4 text-center">Quantité Commandée</th>
                            <th className="p-4 text-center">Reçu</th>
                            <th className="p-4 text-right">Prix Unitaire</th>
                            <th className="p-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {po.lines?.map((line: any) => (
                            <tr key={line.id}>
                                <td className="p-4">
                                    <div className="font-medium">{line.product?.designation}</div>
                                    <div className="text-xs text-slate-400">{line.product?.sku}</div>
                                </td>
                                <td className="p-4 text-center font-bold text-slate-700">{Number(line.quantity_ordered)}</td>
                                <td className="p-4 text-center text-slate-500">{Number(line.quantity_received)}</td>
                                <td className="p-4 text-right">{Number(line.unit_price).toFixed(2)} €</td>
                                <td className="p-4 text-right font-medium">{Number(line.total_price).toFixed(2)} €</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </GlassCard>
        </div>
    );
};

export default PurchaseOrderDetail;
