
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stockService } from '../../services/stockService';
import { GlassCard } from '../../components/ui/GlassCard';
import { Save, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

const InventoryDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [inventory, setInventory] = useState<any>(null);
    const [lines, setLines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!id) return;
        loadInventory();
    }, [id]);

    const loadInventory = async () => {
        try {
            setLoading(true);
            const data = await stockService.getInventory(id!);
            setInventory(data);
            setLines(data.lines || []);
        } catch (e) {
            console.error(e);
            alert("Erreur chargement inventaire");
        } finally {
            setLoading(false);
        }
    };

    const handleCountChange = (lineId: string, val: string) => {
        const num = parseFloat(val);
        setLines(prev => prev.map(l => {
            if (l.id === lineId) {
                return { ...l, stock_real: isNaN(num) ? 0 : num };
            }
            return l;
        }));
    };

    const saveProgress = async () => {
        if (!id) return;
        setSaving(true);
        try {
            // Send updates to backend
            const payload = lines.map(l => ({
                product_id: l.product_id,
                stock_theoretical: l.stock_theoretical,
                stock_real: l.stock_real
            }));
            await stockService.updateInventory(id, payload);
            // Reload to be sure
            // await loadInventory(); // Optional, or just show success
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la sauvegarde");
        } finally {
            setSaving(false);
        }
    };

    const validInventory = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir valider cet inventaire ? Cela mettra à jour les stocks définitivement.")) return;
        setSaving(true);
        try {
            await saveProgress(); // Ensure latest state is saved first
            await stockService.closeInventory(id!);
            alert("Inventaire validé avec succès !");
            navigate('/stock/list'); // Redirect to stock list or inventory list
        } catch (e) {
            console.error(e);
            alert("Erreur lors de la validation");
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement...</div>;
    if (!inventory) return <div className="p-8 text-center text-red-500">Inventaire introuvable</div>;

    const totalGap = lines.reduce((acc, l) => acc + (l.stock_real - l.stock_theoretical), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Saisie d'Inventaire</h2>
                    <p className="text-slate-500">
                        {inventory.type === 'full' ? 'Inventaire Général' : 'Inventaire Partiel'} -
                        <span className="font-semibold text-primary ml-1">{inventory.warehouse?.nom}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={saveProgress}
                        disabled={saving || inventory.status === 'completed'}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition font-medium flex items-center gap-2"
                    >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                        <Save size={18} />
                    </button>
                    {inventory.status !== 'completed' && (
                        <button
                            onClick={validInventory}
                            disabled={saving}
                            className="btn-primary flex items-center gap-2"
                        >
                            <span>Valider & Clôturer</span>
                            <CheckCircle2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Gap Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Produits comptés</div>
                        <div className="text-2xl font-bold text-slate-800">{lines.length}</div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4 flex items-center justify-between">
                    <div>
                        <div className="text-xs text-slate-500 uppercase font-semibold">Écart Total (Qté)</div>
                        <div className={`text-2xl font-bold ${totalGap < 0 ? 'text-red-500' : totalGap > 0 ? 'text-green-500' : 'text-slate-800'}`}>
                            {totalGap > 0 ? '+' : ''}{totalGap}
                        </div>
                    </div>
                    {totalGap !== 0 && <AlertTriangle className="text-orange-400" />}
                </GlassCard>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 font-semibold">Produit</th>
                                <th className="p-4 font-semibold text-center w-32">Stock Théorique</th>
                                <th className="p-4 font-semibold text-center w-32">Stock Réel</th>
                                <th className="p-4 font-semibold text-center w-32">Écart</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {lines.map((line) => {
                                const gap = line.stock_real - line.stock_theoretical;
                                return (
                                    <tr key={line.id} className="hover:bg-primary/5 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-slate-800">{line.product?.designation}</div>
                                            <div className="text-xs text-slate-400">{line.product?.sku}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg font-mono text-sm">
                                                {line.stock_theoretical}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <input
                                                type="number"
                                                className={`w-24 text-center h-10 border rounded-lg focus:ring-2 outline-none font-bold ${gap !== 0 ? 'border-orange-300 bg-orange-50' : 'border-slate-200'
                                                    }`}
                                                value={line.stock_real}
                                                onChange={(e) => handleCountChange(line.id, e.target.value)}
                                                step="0.001"
                                                disabled={inventory.status === 'completed'}
                                            />
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`font-bold ${gap < 0 ? 'text-red-500' : gap > 0 ? 'text-green-500' : 'text-slate-300'}`}>
                                                {gap > 0 ? '+' : ''}{parseFloat(gap).toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default InventoryDetail;
