import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { RefreshCcw, Check, AlertCircle, ShoppingCart, TrendingUp, Filter } from 'lucide-react';
import { stockService } from '../../services/stockService';
import { purchaseService } from '../../services/purchaseService';
import { useNavigate } from 'react-router-dom';

const Replenishment: React.FC = () => {
    const navigate = useNavigate();
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);

    // Selection state: Map of productId -> { selected: boolean, quantity: number }
    const [selection, setSelection] = useState<Record<string, { selected: boolean, quantity: number, unit_price: number }>>({});

    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [orderSupplier, setOrderSupplier] = useState<string>('');

    useEffect(() => {
        Promise.all([
            stockService.getWarehouses(),
            stockService.getSuppliers()
        ]).then(([whData, supData]) => {
            setWarehouses(whData);
            setSuppliers(supData);
            if (whData.length > 0) setSelectedWarehouse(whData[0].id);
        });
    }, []);

    useEffect(() => {
        if (selectedWarehouse) {
            fetchSuggestions();
        }
    }, [selectedWarehouse]);

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const data = await purchaseService.getSuggestions(selectedWarehouse);
            setSuggestions(data);

            // Initialize selection state
            const initialSelection: any = {};
            data.forEach((item: any) => {
                initialSelection[item.product_id] = {
                    selected: false,
                    quantity: item.suggested_quantity,
                    unit_price: 0 // We might need to fetch last buying price? For now 0.
                };
            });
            setSelection(initialSelection);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (productId: string, qty: number) => {
        setSelection(prev => ({
            ...prev,
            [productId]: { ...prev[productId], quantity: qty }
        }));
    };

    const toggleSelection = (productId: string) => {
        setSelection(prev => ({
            ...prev,
            [productId]: { ...prev[productId], selected: !prev[productId]?.selected }
        }));
    };

    const toggleAll = () => {
        const allSelected = suggestions.every(s => selection[s.product_id]?.selected);
        const newSelection = { ...selection };
        suggestions.forEach(s => {
            newSelection[s.product_id] = { ...newSelection[s.product_id], selected: !allSelected };
        });
        setSelection(newSelection);
    };

    const getSelectedItems = () => {
        return suggestions.filter(s => selection[s.product_id]?.selected);
    };

    const handleCreateOrder = async () => {
        if (!orderSupplier) {
            alert('Veuillez sélectionner un fournisseur');
            return;
        }

        const items = getSelectedItems().map(s => ({
            product_id: s.product_id,
            quantity_ordered: selection[s.product_id].quantity,
            unit_price: 0 // Default, user can edit in PO detail later
        }));

        try {
            await purchaseService.createPurchaseOrder({
                warehouse_id: selectedWarehouse,
                supplier_id: orderSupplier,
                lines: items
            });
            setIsOrderModalOpen(false);
            alert('Commande créée avec succès !');
            navigate('/stock/orders'); // We'll assume this route exists or we create it
        } catch (error) {
            console.error(error);
            alert('Erreur lors de la création de la commande');
        }
    };

    const selectedCount = getSelectedItems().length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Assistant de Réapprovisionnement</h2>
                    <p className="text-slate-500">Suggestions basées sur la vélocité des ventes (30 derniers jours)</p>
                </div>

                <div className="flex gap-3">
                    <select
                        className="input-field"
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                    >
                        {warehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                    </select>

                    <button
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={selectedCount === 0}
                        onClick={() => setIsOrderModalOpen(true)}
                    >
                        <ShoppingCart size={18} />
                        <span>Commander ({selectedCount})</span>
                    </button>
                </div>
            </div>

            <GlassCard className="overflow-hidden p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100/50 text-slate-500 text-xs uppercase tracking-wider">
                                <th className="p-4 w-10">
                                    <input type="checkbox" onChange={toggleAll} />
                                </th>
                                <th className="p-4 font-semibold">Produit</th>
                                <th className="p-4 font-semibold text-center">Stock / Alerte</th>
                                <th className="p-4 font-semibold text-center">Vélocité (J)</th>
                                <th className="p-4 font-semibold text-center">Prévision (30j)</th>
                                <th className="p-4 font-semibold text-center w-32">Suggestion</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Analyse des ventes en cours...</td></tr>
                            ) : suggestions.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center text-slate-500">Aucune suggestion de commande pour le moment based sur les seuils d'alerte.</td></tr>
                            ) : (
                                suggestions.map((item) => (
                                    <tr key={item.product_id} className={`hover:bg-primary/5 transition-colors ${selection[item.product_id]?.selected ? 'bg-primary/5' : ''}`}>
                                        <td className="p-4">
                                            <input
                                                type="checkbox"
                                                checked={selection[item.product_id]?.selected || false}
                                                onChange={() => toggleSelection(item.product_id)}
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-slate-800">{item.product_name}</div>
                                            <div className="text-xs text-slate-400">{item.sku}</div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                                                <AlertCircle size={12} />
                                                {Number(item.stock_actuel).toFixed(0)} / {item.stock_alerte}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center text-slate-600 font-medium">
                                            {item.velocity_30d} <span className="text-slate-400 text-xs font-normal">/jour</span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-1 text-slate-700">
                                                <TrendingUp size={14} className="text-blue-500" />
                                                {item.monthly_forecast}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <input
                                                type="number"
                                                className="w-full px-2 py-1 rounded bg-white border border-slate-200 text-center font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                value={selection[item.product_id]?.quantity || 0}
                                                onChange={(e) => handleQuantityChange(item.product_id, parseFloat(e.target.value))}
                                            />
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Modal de commande */}
            {isOrderModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md m-4 animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Créer une commande</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="label">Fournisseur</label>
                                <select
                                    className="input-field w-full"
                                    value={orderSupplier}
                                    onChange={(e) => setOrderSupplier(e.target.value)}
                                >
                                    <option value="">Sélectionner un fournisseur...</option>
                                    {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Produits sélectionnés:</span>
                                    <span className="font-semibold text-slate-800">{selectedCount}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-500">Quantité totale:</span>
                                    <span className="font-semibold text-slate-800">
                                        {getSelectedItems().reduce((acc, s) => acc + (selection[s.product_id]?.quantity || 0), 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    className="flex-1 px-4 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50"
                                    onClick={() => setIsOrderModalOpen(false)}
                                >
                                    Annuler
                                </button>
                                <button
                                    className="flex-1 btn-primary"
                                    onClick={handleCreateOrder}
                                    disabled={!orderSupplier}
                                >
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Replenishment;
