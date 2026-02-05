import React, { useState } from 'react';
import { stockService } from '../services/stockService';
import { useWarehouse } from '../context/WarehouseContext';
import { GlassCard } from '../components/ui/GlassCard';
import { PackagePlus, Plus, Save, Trash2 } from 'lucide-react';

const CreateReception: React.FC = () => {
    const { selectedWarehouse } = useWarehouse();
    const [supplierId, setSupplierId] = useState('');
    const [refExterne, setRefExterne] = useState('');
    const [lines, setLines] = useState([{ productId: '', quantity: 0, unitPrice: 0 }]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    // Data Loading
    const [suppliers, setSuppliers] = React.useState<any[]>([]);
    const [products, setProducts] = React.useState<any[]>([]);

    React.useEffect(() => {
        const loadData = async () => {
            try {
                const [suppliersData, productsData] = await Promise.all([
                    stockService.getSuppliers(),
                    stockService.getProducts({ per_page: 1000 }) // Load enough products for dropdown
                ]);
                setSuppliers(suppliersData);
                setProducts(productsData.data); // Product resource collection returns data wrapper
            } catch (error) {
                console.error("Error loading form data", error);
            }
        };
        loadData();
    }, []);

    const addLine = () => {
        setLines([...lines, { productId: '', quantity: 0, unitPrice: 0 }]);
    };

    const removeLine = (index: number) => {
        const newLines = lines.filter((_, i) => i !== index);
        setLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        if (!selectedWarehouse) {
            setMessage("Veuillez sélectionner un entrepôt dans le menu principal.");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                supplier_id: supplierId,
                warehouse_id: selectedWarehouse.id,
                reference_externe: refExterne,
                lines: lines.map(l => ({
                    product_id: l.productId,
                    quantity: Number(l.quantity),
                    unit_price: Number(l.unitPrice)
                }))
            };

            const response = await stockService.createReception(payload);
            setMessage(`Réception créée avec succès ! ID: ${response.id}`);
            // Reset form
            setSupplierId('');
            setRefExterne('');
            setLines([{ productId: '', quantity: 0, unitPrice: 0 }]);
        } catch (error) {
            console.error(error);
            setMessage("Erreur lors de la création.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <PackagePlus className="text-primary" size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Nouveau Bon de Livraison</h2>
                        <p className="text-slate-500">Enregistrer une entrée de marchandise (BL Fournisseur)</p>
                    </div>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border ${message.includes('Erreur') || message.includes('Veuillez') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <GlassCard className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2">Informations Générales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Fournisseur</label>
                            <select
                                value={supplierId}
                                onChange={e => setSupplierId(e.target.value)}
                                className="input-glass w-full"
                                required
                            >
                                <option value="">Sélectionner un fournisseur</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.nom}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-2">Référence Externe (BL)</label>
                            <input type="text" value={refExterne} onChange={e => setRefExterne(e.target.value)} className="input-glass w-full" placeholder="Ex: BL-2024-001" />
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <h3 className="text-lg font-semibold text-slate-700">Lignes de Réception</h3>
                        <button type="button" onClick={addLine} className="text-sm bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition flex items-center gap-1 font-medium">
                            <Plus size={16} /> Ajouter Ligne
                        </button>
                    </div>

                    <div className="space-y-3">
                        {lines.map((line, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-center animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="col-span-12 md:col-span-6">
                                    <select
                                        value={line.productId}
                                        onChange={e => {
                                            const selectedProductId = e.target.value;
                                            const selectedProduct = products.find(p => p.id === Number(selectedProductId) || p.id === selectedProductId); // Handle both string/number IDs

                                            const newLines = [...lines];
                                            newLines[index].productId = selectedProductId;

                                            if (selectedProduct) {
                                                newLines[index].unitPrice = selectedProduct.buying_price || 0;
                                            }

                                            setLines(newLines);
                                        }}
                                        className="input-glass w-full"
                                        required
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>{p.designation} ({p.sku})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-5 md:col-span-2">
                                    <input type="number" placeholder="Qté" value={line.quantity || ''} onChange={e => {
                                        const newLines = [...lines];
                                        newLines[index].quantity = parseInt(e.target.value) || 0;
                                        setLines(newLines);
                                    }} className="input-glass w-full" required min="1" step="1" />
                                </div>
                                <div className="col-span-5 md:col-span-3">
                                    <div className="relative">
                                        <input type="number" placeholder="Prix Unitaire" value={line.unitPrice || ''} onChange={e => {
                                            const newLines = [...lines];
                                            newLines[index].unitPrice = parseInt(e.target.value) || 0;
                                            setLines(newLines);
                                        }} className="input-glass w-full pr-12" required min="0" step="1" />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">Cfa fr</span>
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1 flex justify-end">
                                    {lines.length > 1 && (
                                        <button type="button" onClick={() => removeLine(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassCard>

                <div className="flex justify-end pt-4">
                    <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                        <Save size={20} />
                        {loading ? 'Enregistrement...' : 'Valider la Réception'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateReception;
