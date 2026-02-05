import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Search, MoreHorizontal, Edit, Power, Merge, ArrowRight, Package, History, BarChart2, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { useWarehouse } from '../../context/WarehouseContext';

const ProductDetailsModal: React.FC<{ product: any, onClose: () => void, onUpdate: () => void }> = ({ product: initialProduct, onClose, onUpdate }) => {

    const [product, setProduct] = useState(initialProduct); // Local state for immediate updates
    const [activeTab, setActiveTab] = useState<'info' | 'history' | 'stats'>('info');
    const [statsData, setStatsData] = useState<any>(null);
    const [dates, setDates] = useState({
        start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 16),
        end: new Date().toISOString().slice(0, 16)
    });

    useEffect(() => {
        // Fetch detailed stats/history on mount or date change
        api.getProductStats(product.id, { start_date: dates.start, end_date: dates.end })
            .then(data => {
                setStatsData(data);
                setProduct(data.product); // Update local product with full details (merged info etc)
            })
            .catch(console.error);
    }, [product.id, dates]);

    const handleReactivate = async () => {
        if (!confirm("Réactiver ce produit ?")) return;
        try {
            await api.reactivateProduct(product.id);
            alert("Produit réactivé !");
            onUpdate();
            onClose();
        } catch (e: any) {
            alert("Erreur: " + e.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start bg-slate-50/50">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h2 className="text-xl font-bold text-slate-800">{product.designation}</h2>
                            {product.status === 'active' && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">ACTIF</span>}
                            {product.status === 'inactive' && <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">INACTIF</span>}
                            {product.status === 'merged' && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">FUSIONNÉ</span>}
                            {product.deleted_at && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">SUPPRIMÉ</span>}
                        </div>
                        <p className="text-sm text-slate-500">SKU: {product.sku} • {product.category?.nom}</p>
                    </div>
                    <Button variant="ghost" onClick={onClose}><Power size={20} className="rotate-45" /></Button>
                </div>

                {/* Tabs */}
                <div className="flex border-b px-6">
                    <button onClick={() => setActiveTab('info')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Informations</button>
                    <button onClick={() => setActiveTab('history')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Historique Stock</button>
                    <button onClick={() => setActiveTab('stats')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Statistiques & Graphes</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                    <h3 className="font-semibold mb-4 text-slate-700">Détails de Base</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-500">Prix Achat</span>
                                            <span className="font-medium">{product.buying_price} Cfa fr</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-500">Prix Vente</span>
                                            <span className="font-medium text-blue-600">{product.selling_price} Cfa fr</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-500">TVA</span>
                                            <span className="font-medium">{product.tva}%</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-500">Rayon</span>
                                            <span className="font-medium">{product.shelf?.name || '-'}</span>
                                        </div>
                                        <div className="flex justify-between border-b border-slate-50 pb-2">
                                            <span className="text-slate-500">Fournisseur</span>
                                            <span className="font-medium">{product.supplier?.name || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                        <h3 className="font-semibold mb-4 text-slate-700">Traçabilité</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Créé par</span>
                                                <span className="font-medium">{product.creator?.name || 'Système'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Date création</span>
                                                <span className="font-medium">{new Date(product.created_at).toLocaleString()}</span>
                                            </div>
                                            {product.merged_into_id && (
                                                <div className="mt-3 p-3 bg-purple-50 rounded-lg text-purple-700 text-xs">
                                                    <strong>FUSIONNÉ VERS:</strong> {statsData?.merged_info?.designation} <br />
                                                    le {new Date(product.merged_at).toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {(product.deleted_at || product.status === 'inactive' || product.status === 'merged') ? (
                                        <Button variant="secondary" className="w-full" onClick={handleReactivate}>
                                            <RefreshCw size={16} className="mr-2" /> Réactiver ce produit
                                        </Button>
                                    ) : (
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-slate-700">Actions</h3>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button variant="secondary" size="sm" onClick={() => { onClose(); (window as any).triggerMerge(product); }}>
                                                    <Merge size={16} className="mr-2" /> Fusionner
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => { onClose(); (window as any).triggerUnpack(product); }}>
                                                    <Package size={16} className="mr-2" /> Déconditionner
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            <div className="flex gap-4 mb-4 items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-sm font-medium text-slate-700">Filtrer par période:</span>
                                <input type="datetime-local" className="bg-slate-50 border p-1 rounded text-sm" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
                                <span className="text-slate-400">à</span>
                                <input type="datetime-local" className="bg-slate-50 border p-1 rounded text-sm" value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
                            </div>

                            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500">
                                        <tr>
                                            <th className="p-3">Date & Heure</th>
                                            <th className="p-3">Type</th>
                                            <th className="p-3">Entrepôt</th>
                                            <th className="p-3 text-right">Quantité</th>
                                            <th className="p-3">Détail</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {statsData?.movements?.map((mov: any) => (
                                            <tr key={mov.id} className="hover:bg-slate-50/50">
                                                <td className="p-3 text-slate-600">
                                                    {new Date(mov.created_at).toLocaleDateString()} <span className="text-slate-400">{new Date(mov.created_at).toLocaleTimeString().slice(0, 5)}</span>
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium 
                                                        ${mov.type.includes('in') || mov.quantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                                                    `}>
                                                        {mov.type}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-slate-600">{mov.warehouse?.name}</td>
                                                <td className={`p-3 text-right font-bold ${mov.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                    {mov.quantity > 0 ? '+' : ''}{Number(mov.quantity)}
                                                </td>
                                                <td className="p-3 text-xs text-slate-400">
                                                    {mov.reference_type?.split('\\').pop()} #{mov.reference_id?.substring(0, 8)}
                                                </td>
                                            </tr>
                                        ))}
                                        {(!statsData?.movements || statsData.movements.length === 0) && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-slate-400 italic">Aucun mouvement sur cette période.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'stats' && (
                        <div className="space-y-6 h-full flex flex-col">
                            <div className="flex gap-4 mb-2 items-center bg-white p-3 rounded-xl border border-slate-100">
                                <span className="text-sm font-medium text-slate-700">Période:</span>
                                <input type="datetime-local" className="bg-slate-50 border p-1 rounded text-sm" value={dates.start} onChange={e => setDates({ ...dates, start: e.target.value })} />
                                <span className="text-slate-400">à</span>
                                <input type="datetime-local" className="bg-slate-50 border p-1 rounded text-sm" value={dates.end} onChange={e => setDates({ ...dates, end: e.target.value })} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
                                    <div className="text-slate-400 text-sm mb-1">Ventes Totales (Période)</div>
                                    <div className="text-2xl font-bold text-blue-600">{statsData?.stats?.total_sales || 0}</div>
                                </div>
                                <div className="bg-white p-4 rounded-xl border shadow-sm text-center">
                                    <div className="text-slate-400 text-sm mb-1">Stock Actuel Global</div>
                                    <div className="text-2xl font-bold text-slate-800">{statsData?.stats?.current_stock}</div>
                                </div>
                            </div>

                            <div className="bg-white p-4 rounded-xl border shadow-sm flex-1 min-h-[300px]">
                                <h3 className="font-semibold mb-4 text-slate-700">Évolution des Ventes (Qté)</h3>
                                <div className="h-[250px] w-full">
                                    {statsData?.graph_data && statsData.graph_data.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={statsData.graph_data}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                                <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#64748B' }} />
                                                <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Line type="monotone" dataKey="total_qty" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 italic">Pas de données graphiques</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductManager: React.FC = () => {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal & Action states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMergeModalOpen, setIsMergeModalOpen] = useState(false);
    const [isUnpackModalOpen, setIsUnpackModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null); // For details/actions


    // Lookup data
    const [categories, setCategories] = useState<any[]>([]);
    const [shelves, setShelves] = useState<any[]>([]);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const { selectedWarehouse } = useWarehouse();

    useEffect(() => {
        fetchData();
    }, [selectedWarehouse]); // Refetch when warehouse changes

    // Expose triggers for modal
    useEffect(() => {
        (window as any).triggerMerge = (p: any) => { setSelectedProduct(p); setIsMergeModalOpen(true); };
        (window as any).triggerUnpack = (p: any) => { setSelectedProduct(p); setIsUnpackModalOpen(true); };
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prods, shelv, supp, cats] = await Promise.all([
                api.getProducts(selectedWarehouse ? { warehouse_id: selectedWarehouse.id } : {}),
                api.getShelves(),
                api.getSuppliers(),
                api.getCategories()
            ]);
            setProducts(prods);
            setShelves(shelv);
            setSuppliers(supp);
            setCategories(cats);
        } catch (error) {
            console.error("Error fetching data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        api.getProducts({
            search: searchTerm,
            warehouse_id: selectedWarehouse?.id
        }).then(setProducts);
    };

    const handleDeactivate = async (product: any) => {
        if (!confirm("Voulez-vous vraiment désactiver ce produit ?")) return;
        try {
            await api.deactivateProduct(product.id);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Erreur lors de la désactivation");
        }
    };

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Gestion des Articles</h1>
                    <p className="text-slate-500">Création, modification et gestion du stock</p>
                </div>
                <Button onClick={() => { setEditingProduct(null); setIsCreateModalOpen(true); }}>
                    <Plus size={20} className="mr-2" /> Nouvel Article
                </Button>
            </div>

            <GlassCard className="p-4 flex gap-4">
                <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher par code, désignation..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="secondary">Rechercher</Button>
                </form>
            </GlassCard>

            <div className="grid grid-cols-1 gap-4">
                {loading ? (
                    <div className="text-center py-10">Chargement...</div>
                ) : products.map((product) => (
                    <GlassCard key={product.id} className="flex items-center justify-between p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                <Package size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{product.designation}</h3>
                                <div className="flex gap-2 text-xs text-slate-500">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded">Code: {product.sku}</span>
                                    {product.shelf && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Rayon: {product.shelf.name}</span>}
                                    <span className={product.stock_total > 0 ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                                        Stock: {product.stock_total}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="font-bold text-slate-700">{product.selling_price} Cfa fr</div>
                                <div className="text-xs text-slate-400">Marge: {product.margin_percent}%</div>
                            </div>

                            <div className="flex gap-2">
                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-600" title="Détails" onClick={() => setSelectedProduct(product)}>
                                    <MoreHorizontal size={18} />
                                </button>
                                <button className="p-2 hover:bg-slate-100 rounded-lg text-blue-600" title="Modifier" onClick={() => { setEditingProduct(product); setIsCreateModalOpen(true); }}>
                                    <Edit size={18} />
                                </button>
                                <button className="p-2 hover:bg-slate-100 text-slate-600" title="Détails" onClick={() => setIsMergeModalOpen(true)}>
                                    {/* Quick action if needed, or stick to details */}
                                </button>
                                {product.status === 'active' && (
                                    <button className="p-2 hover:bg-red-50 rounded-lg text-red-500" title="Désactiver" onClick={() => handleDeactivate(product)}>
                                        <Power size={18} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Detail Modal */}
            {selectedProduct && (
                <ProductDetailsModal
                    product={selectedProduct}
                    onClose={() => setSelectedProduct(null)}
                    onUpdate={fetchData}
                />
            )}

            {/* Merge Modal */}
            {isMergeModalOpen && selectedProduct && (
                <MergeModal
                    sourceProduct={selectedProduct}
                    products={products}
                    onClose={() => setIsMergeModalOpen(false)}
                    onSuccess={() => { setIsMergeModalOpen(false); setSelectedProduct(null); fetchData(); }}
                />
            )}

            {/* Keeping MergeModal opening logic via the main list actions? 
                Wait, I removed the Merge/Unpack buttons from the main list in my simplified replace.
                I should add them back or ensure they are accessible via Details modal.
                The details modal HAS reactivate, but I didn't add Merge/Unpack buttons there yet.
                I should add them to Details Modal Information tab or actions.
            */}

            {/* Unpack Modal */}
            {isUnpackModalOpen && selectedProduct && (
                <UnpackModal
                    sourceProduct={selectedProduct}
                    products={products}
                    onClose={() => setIsUnpackModalOpen(false)}
                    onSuccess={() => { setIsUnpackModalOpen(false); fetchData(); }}
                />
            )}

            {/* Create/Edit Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-2xl my-8">
                        <h2 className="text-xl font-bold mb-4 text-slate-800">{editingProduct ? 'Modifier Article' : 'Nouvel Article'}</h2>

                        <ProductForm
                            initialData={editingProduct}
                            categories={categories}
                            shelves={shelves}
                            suppliers={suppliers}
                            products={products}
                            onClose={() => setIsCreateModalOpen(false)}
                            onSubmit={async (data) => {
                                try {
                                    if (editingProduct) {
                                        await api.updateProduct(editingProduct.id, data);
                                    } else {
                                        await api.createProduct(data);
                                    }
                                    fetchData();
                                    setIsCreateModalOpen(false);
                                } catch (e: any) {
                                    alert('Erreur: ' + (e.response?.data?.message || e.message));
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-component for the form to keep main cleaner
const ProductForm: React.FC<{
    initialData?: any,
    categories: any[],
    shelves: any[],
    suppliers: any[],
    products: any[],
    onClose: () => void,
    onSubmit: (data: any) => void
}> = ({ initialData, categories, shelves, suppliers, products, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        designation: initialData?.designation || '',
        // sku removed from UI state, handled defaults if needed or ignored
        barcode: initialData?.barcode || '',
        category_id: initialData?.category?.id || '',
        shelf_id: initialData?.shelf?.id || '',
        supplier_id: initialData?.supplier?.id || '',
        buying_price: initialData?.buying_price || '',
        selling_price: initialData?.selling_price || '',
        tva: initialData?.tva || '18',
        color: initialData?.color || '',
        parent_id: initialData?.parent_id || '',
        conversion_rate: initialData?.conversion_rate || '',
    });

    const [margin, setMargin] = useState({ value: 0, percent: 0 });

    useEffect(() => {
        setFormData({
            designation: initialData?.designation || '',
            barcode: initialData?.barcode || '',
            category_id: initialData?.category?.id || '',
            shelf_id: initialData?.shelf?.id || '',
            supplier_id: initialData?.supplier?.id || '',
            buying_price: initialData?.buying_price || '',
            selling_price: initialData?.selling_price || '',
            tva: initialData?.tva || '18',
            color: initialData?.color || '',
            parent_id: initialData?.parent_id || '',
            conversion_rate: initialData?.conversion_rate || '',
        });
    }, [initialData]);

    useEffect(() => {
        // Calculate Margin
        const buy = parseFloat(formData.buying_price) || 0;
        const sell = parseFloat(formData.selling_price) || 0;

        if (sell > 0) {
            const val = sell - buy;
            const pct = (val / sell) * 100;
            setMargin({ value: val, percent: parseFloat(pct.toFixed(2)) });
        } else {
            setMargin({ value: 0, percent: 0 });
        }
    }, [formData.buying_price, formData.selling_price]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Désignation *</label>
                    <input
                        type="text"
                        required
                        className="input-glass w-full uppercase"
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value.toUpperCase() })}
                        placeholder="EX: PACK EAU CLAIRE 1.5L"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Code Barre (Chiffres)</label>
                    <input
                        type="text"
                        className="input-glass w-full"
                        value={formData.barcode}
                        onChange={e => {
                            const val = e.target.value;
                            if (/^\d*$/.test(val)) {
                                setFormData({ ...formData, barcode: val });
                            }
                        }}
                        placeholder="Scan ou saisie..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Couleur</label>
                    <select
                        className="input-glass w-full"
                        value={formData.color}
                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                    >
                        <option value="">Sélectionner une couleur (optionnel)</option>
                        {/* Boissons & Vins */}
                        <optgroup label="Vins & Champagnes">
                            <option value="Rouge">Rouge</option>
                            <option value="Blanc">Blanc</option>
                            <option value="Rosé">Rosé</option>
                            <option value="Paille">Paille (Champagne)</option>
                            <option value="Or">Or</option>
                        </optgroup>

                        {/* Bières & Spiritueux */}
                        <optgroup label="Bières & Spiritueux">
                            <option value="Blonde">Blonde</option>
                            <option value="Brune">Brune</option>
                            <option value="Ambrée">Ambrée</option>
                            <option value="Noire">Noire (Stout)</option>
                            <option value="Rousse">Rousse</option>
                            <option value="Transparent">Transparent (Eau/Vodka)</option>
                        </optgroup>

                        {/* Jus & Sodas */}
                        <optgroup label="Jus & Sodas">
                            <option value="Orange">Orange</option>
                            <option value="Jaune">Jaune (Citron)</option>
                            <option value="Vert">Vert (Menthe/Citron Vert)</option>
                            <option value="Rouge vif">Rouge vif (Fraise/Grenadine)</option>
                            <option value="Violet">Violet (Raisin)</option>
                            <option value="Marron">Marron (Cola)</option>
                            <option value="Bleu">Bleu</option>
                        </optgroup>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie *</label>
                    <select required className="input-glass w-full" value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })}>
                        <option value="">Sélectionner</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Rayon</label>
                    <select className="input-glass w-full" value={formData.shelf_id} onChange={e => setFormData({ ...formData, shelf_id: e.target.value })}>
                        <option value="">Aucun</option>
                        {shelves && shelves.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fournisseur</label>
                    <select className="input-glass w-full" value={formData.supplier_id} onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}>
                        <option value="">Aucun</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                    </select>
                </div>
            </div>

            <div className="p-4 bg-orange-50/50 rounded-xl space-y-4 border border-orange-100">
                <h3 className="font-semibold text-orange-800 text-sm flex items-center gap-2">
                    <Package size={16} />
                    Conditionnement (Optionnel)
                </h3>
                <p className="text-xs text-orange-600/80">
                    Définissez si ce produit est une sous-unité (ex: Paquet) d'un autre produit (ex: Carton).
                    Le stock sera automatiquement déconditionné lors de la vente.
                </p>
                <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-orange-700/80 mb-1">Produit Parent (Contenant)</label>
                        <select
                            className="input-glass w-full bg-white/50"
                            value={formData.parent_id}
                            onChange={e => setFormData({ ...formData, parent_id: e.target.value })}
                        >
                            <option value="">Aucun (Produit standard)</option>
                            {products
                                .filter(p => !initialData || p.id !== initialData.id) // Avoid self-parenting
                                .map(p => (
                                    <option key={p.id} value={p.id}>{p.designation} (Stock: {p.stock_total})</option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-orange-700/80 mb-1">Qté dans Parent</label>
                        <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="Ex: 12"
                            className="input-glass w-full bg-white/50"
                            value={formData.conversion_rate}
                            onChange={e => setFormData({ ...formData, conversion_rate: e.target.value })}
                            disabled={!formData.parent_id}
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-4 border border-slate-100">
                <h3 className="font-semibold text-slate-700 text-sm">Prix & Marge</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Prix Achat</label>
                        <input type="number" step="0.01" className="input-glass w-full" value={formData.buying_price} onChange={e => setFormData({ ...formData, buying_price: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Prix Vente</label>
                        <input type="number" step="0.01" className="input-glass w-full" value={formData.selling_price} onChange={e => setFormData({ ...formData, selling_price: e.target.value })} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">TVA (%)</label>
                        <input type="number" step="0.1" className="input-glass w-full" value={formData.tva} onChange={e => setFormData({ ...formData, tva: e.target.value })} />
                    </div>
                </div>
                <div className="flex justify-between items-center pt-2 text-sm">
                    <span className="text-slate-500">Marge estimée:</span>
                    <div className="font-bold text-slate-800">
                        {margin.value.toFixed(2)} ({margin.percent.toFixed(1)}%)
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
            </div>
        </form>
    );
};

export default ProductManager;

const MergeModal: React.FC<{ sourceProduct: any, products: any[], onClose: () => void, onSuccess: () => void }> = ({ sourceProduct, products, onClose, onSuccess }) => {
    const [targetId, setTargetId] = useState('');
    const [loading, setLoading] = useState(false);

    const handleMerge = async () => {
        if (!targetId) return;
        if (!confirm(`La fusion est irréversible. Le produit "${sourceProduct.designation}" sera supprimé et son stock transféré. Continuer ?`)) return;

        setLoading(true);
        try {
            await api.mergeProducts(sourceProduct.id, targetId);
            alert("Fusion réussie !");
            onSuccess();
        } catch (e: any) {
            alert('Erreur: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Fusionner des articles</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Fusionner <strong>{sourceProduct.designation}</strong> vers un autre article.
                </p>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Article Cible</label>
                    <select className="input-glass w-full" value={targetId} onChange={e => setTargetId(e.target.value)}>
                        <option value="">Sélectionner</option>
                        {products.filter(p => p.id !== sourceProduct.id).map(p => (
                            <option key={p.id} value={p.id}>{p.designation} (SKU: {p.sku})</option>
                        ))}
                    </select>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
                    <Button onClick={handleMerge} disabled={loading || !targetId}>
                        {loading ? 'Fusion...' : 'Fusionner'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

const UnpackModal: React.FC<{ sourceProduct: any, products: any[], onClose: () => void, onSuccess: () => void }> = ({ sourceProduct, products, onClose, onSuccess }) => {
    // Auto-select first warehouse with stock or just first one
    const [warehouseId, setWarehouseId] = useState(sourceProduct.warehouses?.[0]?.id || '');
    const [qty, setQty] = useState('1');
    const [unitCount, setUnitCount] = useState('10'); // Default to 10 as per screenshot example usually
    const [loading, setLoading] = useState(false);

    const handleUnpack = async () => {
        if (!warehouseId) {
            alert("Aucun entrepôt disponible pour ce produit.");
            return;
        }

        setLoading(true);
        try {
            await api.unpackProduct(sourceProduct.id, {
                warehouse_id: warehouseId,
                quantity: parseInt(qty),
                unit_count: parseInt(unitCount)
            });
            alert("Déconditionnement réussi !");
            onSuccess();
        } catch (e: any) {
            alert('Erreur: ' + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                <h3 className="font-bold text-lg mb-4">Déconditionner</h3>
                <p className="text-sm text-slate-500 mb-4">
                    Création automatique d'un article "(Détail) {sourceProduct.designation}"
                </p>

                <div className="space-y-4">
                    {/* Warehouse selection removed as requested, using default */}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Qté à ouvrir</label>
                            <input type="number" min="1" className="input-glass w-full" value={qty} onChange={e => setQty(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Unités/Paquet</label>
                            <input
                                type="number"
                                min="1"
                                className="input-glass w-full"
                                value={unitCount}
                                onChange={e => setUnitCount(e.target.value)}
                                placeholder="Ex: 6, 12"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="ghost" onClick={onClose} disabled={loading}>Annuler</Button>
                    <Button onClick={handleUnpack} disabled={loading || !warehouseId || parseInt(unitCount) < 1}>
                        {loading ? 'Valider' : 'Valider'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
