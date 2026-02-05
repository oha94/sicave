import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import {
    ShoppingCart,
    Plus,
    Wand2,
    Trash2,
    Save,
    ArrowLeft,
    AlertCircle,
    Store
} from 'lucide-react';
import { stockService } from '../../services/stockService';
import { purchaseService } from '../../services/purchaseService';
import { useNavigate } from 'react-router-dom';
import { ProductSearchModal } from '../../components/stock/ProductSearchModal';
import { useWarehouse } from '../../context/WarehouseContext';

interface OrderLine {
    product_id: string;
    product_name: string;
    sku: string;
    stock_actuel: number;
    stock_alerte: number;
    quantity: number;
    unit_price: number;
}

const CreatePurchaseOrder: React.FC = () => {
    const navigate = useNavigate();
    const { selectedWarehouse } = useWarehouse();

    // Form State
    const [warehouseId, setWarehouseId] = useState(selectedWarehouse?.id || '');
    const [supplierId, setSupplierId] = useState('');
    const [lines, setLines] = useState<OrderLine[]>([]);
    const [notes, setNotes] = useState('');

    // Data State
    const [warehouses, setWarehouses] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);

    // UI State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadContext = async () => {
            const [whData, supData] = await Promise.all([
                stockService.getWarehouses(),
                stockService.getSuppliers()
            ]);
            setWarehouses(whData);
            setSuppliers(supData);
            // If we have a selected warehouse from context, prefer it, otherwise fallback
            if (selectedWarehouse) {
                setWarehouseId(selectedWarehouse.id);
            } else if (whData.length > 0 && !warehouseId) {
                setWarehouseId(whData[0].id);
            }
        };
        loadContext();
    }, [selectedWarehouse]);

    // --- Actions ---

    const handleSmartFill = async () => {
        if (!warehouseId) return;
        setLoadingSuggestions(true);
        try {
            const suggestions = await purchaseService.getSuggestions(warehouseId);

            // Merge suggestions: Only add if not already in list
            const newLines = [...lines];
            let addedCount = 0;

            suggestions.forEach((s: any) => {
                const exists = newLines.find(l => l.product_id === s.product_id);
                if (!exists) {
                    newLines.push({
                        product_id: s.product_id,
                        product_name: s.product_name,
                        sku: s.sku,
                        stock_actuel: s.stock_actuel,
                        stock_alerte: s.stock_alerte,
                        quantity: s.suggested_quantity,
                        unit_price: 0 // Ideally fetch last purchase price
                    });
                    addedCount++;
                }
            });

            setLines(newLines);
            if (addedCount === 0 && suggestions.length === 0) {
                alert("Aucune suggestion de réapprovisionnement trouvée (tous les stocks sont au-dessus du seuil d'alerte).");
            } else if (addedCount > 0) {
                // If supplier is suggested and we don't have one selected, pick the first one from suggestions?
                // For now, simplify.
            }

        } catch (error) {
            console.error("Failed to fetch suggestions", error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const addProduct = (product: any) => {
        const exists = lines.find(l => l.product_id === product.id);
        if (exists) {
            alert("Ce produit est déjà dans la liste.");
            return;
        }

        let stock = 0;
        let alertVal = 0;

        if (product.warehouses && Array.isArray(product.warehouses)) {
            const wh = product.warehouses.find((w: any) => w.id === warehouseId);
            if (wh) {
                stock = parseFloat(wh.stock) || 0;
                alertVal = parseFloat(wh.alert) || 0;
            }
        }

        setLines([...lines, {
            product_id: product.id,
            product_name: product.designation,
            sku: product.sku,
            stock_actuel: stock,
            stock_alerte: alertVal,
            quantity: 1,
            unit_price: product.buying_price || 0
        }]);
    };

    const updateLine = (index: number, field: keyof OrderLine, value: number) => {
        const newLines = [...lines];
        // @ts-ignore
        newLines[index][field] = value;
        setLines(newLines);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!warehouseId || !supplierId) {
            alert("Veuillez sélectionner un entrepôt et un fournisseur.");
            return;
        }
        if (lines.length === 0) {
            alert("La commande doit contenir au moins un produit.");
            return;
        }

        setSubmitting(true);
        try {
            await purchaseService.createPurchaseOrder({
                warehouse_id: warehouseId,
                supplier_id: supplierId,
                lines: lines.map(cols => ({
                    product_id: cols.product_id,
                    quantity_ordered: cols.quantity,
                    unit_price: cols.unit_price
                })),
                notes
            });
            navigate('/stock/orders');
        } catch (error) {
            console.error("Create failed", error);
            alert("Erreur lors de la création de la commande.");
        } finally {
            setSubmitting(false);
        }
    };

    const totalAmount = lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-24">
            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors text-slate-500"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Nouvelle Commande</h1>
                    <p className="text-slate-500">Créer une commande manuellement ou via suggestions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Col: Settings */}
                <div className="space-y-6">
                    <GlassCard className="h-fit">
                        <div className="flex items-center gap-2 mb-4">
                            <Store className="text-primary" />
                            <h3 className="font-bold text-lg text-slate-800">Informations Générales</h3>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="label">Entrepôt de destination</label>
                                <select
                                    className="input-field w-full text-slate-800"
                                    value={warehouseId}
                                    onChange={(e) => setWarehouseId(e.target.value)}
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="label">Fournisseur</label>
                                <select
                                    className="input-field w-full text-slate-800"
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
                                >
                                    <option value="" className="text-slate-400">Sélectionner...</option>
                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="label">Notes / Référence</label>
                                <textarea
                                    className="input-field w-full h-24 resize-none"
                                    placeholder="Notes internes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="bg-primary/5 border-primary/10">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary mt-1">
                                <Wand2 size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">Remplissage Intelligent</h3>
                                <p className="text-sm text-slate-600 mt-1 mb-3">
                                    Analysez le stock et ajoutez automatiquement les produits en rupture ou sous le seuil d'alerte.
                                </p>
                                <button
                                    onClick={handleSmartFill}
                                    disabled={loadingSuggestions || !warehouseId}
                                    className="text-sm font-semibold text-primary hover:text-primary-dark hover:underline flex items-center gap-2"
                                >
                                    {loadingSuggestions ? 'Analyse en cours...' : 'Lancer l\'analyse'}
                                </button>
                            </div>
                        </div>
                    </GlassCard>
                </div>

                {/* Right Col: Lines */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="min-h-[500px] flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <ShoppingCart className="text-primary" />
                                Articles ({lines.length})
                            </h2>
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="btn-secondary text-sm py-2"
                            >
                                <Plus size={16} className="mr-2" />
                                Ajouter un article
                            </button>
                        </div>

                        {lines.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl m-4">
                                <ShoppingCart size={48} className="mb-4 opacity-50" />
                                <p>Le panier est vide</p>
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="mt-4 text-primary font-medium hover:underline"
                                >
                                    Ajouter manuellement
                                </button>
                                <span className="mx-2 text-sm text-slate-300">ou</span>
                                <button
                                    onClick={handleSmartFill}
                                    className="text-primary font-medium hover:underline"
                                >
                                    Utiliser le Smart Fill
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-xs uppercase text-slate-500 font-semibold border-b border-slate-100">
                                            <th className="pb-3 pl-2">Produit</th>
                                            <th className="pb-3 text-center">Stock</th>
                                            <th className="pb-3 text-center w-32">Qté</th>
                                            <th className="pb-3 text-right w-32">P.U.</th>
                                            <th className="pb-3 text-right w-32">Total</th>
                                            <th className="pb-3 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {lines.map((line, index) => (
                                            <tr key={line.product_id} className="group hover:bg-slate-50/50">
                                                <td className="py-3 pl-2">
                                                    <div className="font-medium text-slate-800">{line.product_name}</div>
                                                    <div className="text-xs text-slate-400">{line.sku}</div>
                                                </td>
                                                <td className="py-3 text-center">
                                                    {line.stock_alerte > 0 && line.stock_actuel <= line.stock_alerte && (
                                                        <div className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 mb-1">
                                                            <AlertCircle size={10} /> Alerte
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-slate-600">
                                                        {Number(line.stock_actuel).toFixed(0)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        className="input-field text-center font-bold text-slate-700"
                                                        value={line.quantity}
                                                        onChange={(e) => updateLine(index, 'quantity', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-3 px-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="input-field text-right"
                                                        value={line.unit_price}
                                                        onChange={(e) => updateLine(index, 'unit_price', parseInt(e.target.value) || 0)}
                                                    />
                                                </td>
                                                <td className="py-3 text-right font-medium text-slate-800">
                                                    {(line.quantity * line.unit_price).toLocaleString()}
                                                </td>
                                                <td className="py-3 text-center">
                                                    <button
                                                        onClick={() => removeLine(index)}
                                                        className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t border-slate-200">
                                            <td colSpan={4} className="py-4 text-right font-bold text-slate-600">Total HT Estimate:</td>
                                            <td className="py-4 text-right font-bold text-xl text-primary">
                                                {totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-500">Cfa fr</span>
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </GlassCard>
                </div>
            </div>

            {/* Sticky Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 z-40">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        {lines.length} articles à commander
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => navigate('/stock/orders')}
                            className="px-6 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-medium transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || lines.length === 0 || !supplierId}
                            className="btn-primary px-8 py-3 flex items-center gap-2 shadow-lg shadow-primary/25"
                        >
                            <Save size={20} />
                            {submitting ? 'Création...' : 'Valider la commande'}
                        </button>
                    </div>
                </div>
            </div>

            <ProductSearchModal
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                onSelect={addProduct}
            />
        </div>
    );
};

export default CreatePurchaseOrder;
