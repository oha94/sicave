import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { PackageOpen, ArrowRight, Search, AlertCircle, Save } from 'lucide-react';
import { useWarehouse } from '../../context/WarehouseContext';
import api from '../../services/api';

const Unpacking: React.FC = () => {
    const { selectedWarehouse } = useWarehouse();
    const [products, setProducts] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);

    // Form
    const [quantityToUnpack, setQuantityToUnpack] = useState<string>('1');
    const [unitCount, setUnitCount] = useState<string>(''); // Conversion rate
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedWarehouse) {
            loadProducts();
        }
    }, [selectedWarehouse]);

    const loadProducts = () => {
        api.getProducts().then(setProducts);
    };

    const handleUnpack = async () => {
        if (!selectedWarehouse || !selectedProduct) return;

        setLoading(true);
        try {
            await api.unpackProduct(selectedProduct.id, {
                warehouse_id: selectedWarehouse.id,
                quantity: parseInt(quantityToUnpack),
                unit_count: parseInt(unitCount)
            });

            alert('Déconditionnement réussi !');
            setQuantityToUnpack('1');
            setUnitCount('');
            setSelectedProduct(null);
            loadProducts(); // Refresh stock
        } catch (error) {
            console.error(error);
            alert('Erreur lors du déconditionnement.');
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = products.filter(p =>
        p.designation.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    if (!selectedWarehouse) return <div className="p-8 text-center">Veuillez sélectionner un dépôt.</div>;

    const previewTotal = parseInt(quantityToUnpack || '0') * parseInt(unitCount || '0');

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <PackageOpen className="text-primary" /> Déconditionnement Manuel
                    </h2>
                    <p className="text-slate-500">Transformez des articles parents (ex: Cartons) en articles détails (ex: Unités).</p>
                </div>
                <a href="/stock/unpacking-history" className="text-primary hover:underline text-sm font-medium flex items-center gap-1">
                    Voir Historique <ArrowRight size={16} />
                </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Product Selection */}
                <GlassCard className="h-[600px] flex flex-col">
                    <div className="p-4 border-b border-white/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Rechercher un produit à déconditionner..."
                                className="input-glass w-full pl-10"
                            />
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {filteredProducts.map(product => {
                            const stock = product.warehouses?.find((w: any) => w.id === selectedWarehouse.id)?.pivot?.stock_actuel || 0;
                            return (
                                <button
                                    key={product.id}
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        // Pre-fill conversion rate if known (from previous unpacks or conversion_rate field)
                                        if (product.conversion_rate) setUnitCount(product.conversion_rate.toString());
                                    }}
                                    className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center ${selectedProduct?.id === product.id
                                        ? 'bg-primary/5 border-primary ring-1 ring-primary'
                                        : 'bg-white border-slate-100 hover:border-primary/50'
                                        }`}
                                >
                                    <div>
                                        <div className="font-semibold text-slate-700">{product.designation}</div>
                                        <div className="text-xs text-slate-400">Stock: {stock}</div>
                                    </div>
                                    {product.conversion_rate && (
                                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                            1 = {product.conversion_rate}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </GlassCard>

                {/* Right: Action Form */}
                <GlassCard className="p-6 space-y-8">
                    {!selectedProduct ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                            <PackageOpen size={64} className="opacity-20" />
                            <p>Sélectionnez un produit à gauche pour commencer.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Produit Source (Parent)</span>
                                <div className="text-lg font-bold text-slate-800 mt-1">{selectedProduct.designation}</div>
                                <div className="text-sm text-slate-500">
                                    Stock actuel : <span className="font-semibold text-slate-700">
                                        {selectedProduct.warehouses?.find((w: any) => w.id === selectedWarehouse.id)?.pivot?.stock_actuel || 0}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Quantité à déconditionner
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantityToUnpack}
                                        onChange={e => setQuantityToUnpack(e.target.value)}
                                        className="input-glass w-full"
                                    />
                                </div>

                                <div className="flex justify-center">
                                    <div className="bg-slate-100 p-2 rounded-full text-slate-400">
                                        <ArrowRight size={24} className="rotate-90 lg:rotate-0" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nombre d'unités par paquet (Ratio)
                                    </label>
                                    <p className="text-xs text-slate-400 mb-2">Exemple : 24 si 1 Carton contient 24 canettes.</p>
                                    <input
                                        type="number"
                                        min="1"
                                        value={unitCount}
                                        onChange={e => setUnitCount(e.target.value)}
                                        placeholder="Ex: 12, 24, 6..."
                                        className="input-glass w-full"
                                    />
                                </div>
                            </div>

                            {parseInt(unitCount) > 0 && (
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-start gap-3">
                                    <AlertCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
                                    <div>
                                        <div className="font-bold text-green-800">Résultat prévu</div>
                                        <div className="text-green-700 text-sm mt-1">
                                            Vous allez obtenir <span className="font-bold">{previewTotal}</span> unités de
                                            <span className="italic"> "(Détail) {selectedProduct.designation}"</span>.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleUnpack}
                                disabled={loading || !quantityToUnpack || !unitCount || parseInt(unitCount) <= 0}
                                className="btn-primary w-full py-3 flex justify-center items-center gap-2"
                            >
                                {loading ? 'Traitement...' : (
                                    <>
                                        <Save size={18} /> Valider le déconditionnement
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </GlassCard>
            </div>
        </div>
    );
};

export default Unpacking;
