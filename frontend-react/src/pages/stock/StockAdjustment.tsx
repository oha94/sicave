
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { WarehouseSelector } from '../../components/ui/WarehouseSelector';
import axios from 'axios';
import api from '../../services/api';
import { stockService } from '../../services/stockService';
import { ArrowDownLeft, ArrowUpRight, Save, Search } from 'lucide-react';

const StockAdjustment: React.FC = () => {
    const [warehouseId, setWarehouseId] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [type, setType] = useState<'adjustment_in' | 'adjustment_out'>('adjustment_out');
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (searchTerm.length > 2) {
            const fetch = async () => {
                // Use global search capabilities or just get products and filter
                // Ideally use an API that supports search
                const res = await api.getProducts({ search: searchTerm });
                setProducts(res);
            }
            fetch();
        }
    }, [searchTerm]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setSuccess('');

        try {
            await stockService.createAdjustment({
                warehouse_id: warehouseId,
                product_id: selectedProduct?.id,
                type,
                quantity: parseFloat(quantity),
                reason
            });
            setSuccess('Régularisation effectuée avec succès.');
            setQuantity('');
            setReason('');
            setSelectedProduct(null);
            setSearchTerm('');
        } catch (error: any) {
            alert(error.response?.data?.message || "Erreur lors de la régularisation");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Régularisation de Stock</h2>
                <p className="text-slate-500">Ajustement manuel des stocks (Casse, Vol, Correction)</p>
            </div>

            <GlassCard>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Entrepôt concerné</label>
                        <WarehouseSelector
                            selectedId={warehouseId}
                            onChange={(w) => setWarehouseId(w.id)}
                            className="w-full"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Rechercher un produit</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 h-10 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                placeholder="Tapez le nom ou SKU..."
                                value={selectedProduct ? selectedProduct.designation : searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedProduct(null);
                                }}
                            />
                        </div>
                        {searchTerm.length > 2 && !selectedProduct && products.length > 0 && (
                            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                                {products.map((p: any) => (
                                    <div
                                        key={p.id}
                                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                                        onClick={() => {
                                            setSelectedProduct(p);
                                            setSearchTerm('');
                                        }}
                                    >
                                        <div className="font-medium text-slate-800">{p.designation}</div>
                                        <div className="text-xs text-slate-500 flex justify-between">
                                            <span>{p.sku}</span>
                                            <span>Stock Global: {p.current_stock ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setType('adjustment_in')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'adjustment_in'
                                ? 'bg-green-50 border-green-200 text-green-700 ring-1 ring-green-200'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <ArrowDownLeft size={24} />
                            <span className="font-bold">Entrée (Surplus)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setType('adjustment_out')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'adjustment_out'
                                ? 'bg-red-50 border-red-200 text-red-700 ring-1 ring-red-200'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <ArrowUpRight size={24} />
                            <span className="font-bold">Sortie (Perte/Casse)</span>
                        </button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Quantité ajustée</label>
                        <input
                            type="number"
                            step="0.001"
                            min="0.001"
                            required
                            className="w-full h-11 px-4 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none"
                            placeholder="0.00"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">Motif de la régularisation</label>
                        <textarea
                            required
                            className="w-full h-24 px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white transition-all outline-none resize-none"
                            placeholder="Ex: Casse lors du déchargement, Vol constaté..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {success && (
                        <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
                            <Save size={18} />
                            {success}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !selectedProduct || !warehouseId}
                        className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? 'Traitement...' : 'Valider la régularisation'}
                    </button>
                </form>
            </GlassCard>
        </div>
    );
};

export default StockAdjustment;
