import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { ShoppingCart, Plus, Minus, Trash2, Search, User, Loader2 } from 'lucide-react';
import { useWarehouse } from '../../context/WarehouseContext';
import api from '../../services/api';
import TicketPreview from '../../components/facturation/TicketPreview';

const POS: React.FC = () => {
    const { selectedWarehouse } = useWarehouse();
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [paymentType, setPaymentType] = useState('comptant');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        if (selectedWarehouse) {
            loadProducts();
            loadClients();
        }
    }, [selectedWarehouse]);

    const loadProducts = () => {
        setLoading(true);
        api.getProducts().then(data => {
            setProducts(data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const loadClients = () => {
        api.getClients().then(data => setClients(data));
    };

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.product_id === product.id);
            if (existing) {
                return prev.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product_id: product.id, designation: product.designation, price: product.selling_price, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.product_id === productId) {
                const newQty = Math.max(1, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }));
    };

    const removeFromCart = (productId: string) => {
        setCart(prev => prev.filter(item => item.product_id !== productId));
    };

    const clearCart = () => setCart([]);

    // Open Preview instead of submitting directly
    const handlePreview = () => {
        if (!selectedWarehouse || cart.length === 0) return;

        // Validation for Credit Sale
        if (paymentMethod === 'credit' && !selectedClient) {
            alert('Veuillez sélectionner un client pour une vente à crédit.');
            return;
        }

        setShowPreview(true);
    };

    const handleValidateSale = async () => {
        setIsSubmitting(true);

        const payload = {
            warehouse_id: selectedWarehouse!.id,
            client_id: selectedClient?.id,
            type: 'receipt',
            payment_method: paymentType === 'credit' ? 'credit' : paymentMethod,
            lines: cart.map(item => ({
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price
            }))
        };

        try {
            await api.createInvoice(payload);
            setCart([]);
            setSelectedClient(null);
            setPaymentMethod('cash'); // Reset to default
            setShowPreview(false);
            alert('Vente effectuée avec succès !');
            loadProducts();
        } catch (error) {
            console.error(error);
            console.error(error);
            const message = (error as any).response?.data?.message || 'Erreur lors de la vente.';
            alert(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalHT = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalTTC = totalHT; // Add Tax logic later

    const filteredProducts = products.filter(p =>
        p.designation.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.includes(search))
    );

    if (!selectedWarehouse) return <div className="p-8 text-center text-slate-500">Veuillez sélectionner un point de vente.</div>;

    return (
        <div className="flex h-[calc(100vh-6rem)] gap-6 relative">
            {/* Ticket Preview Modal */}
            {showPreview && (
                <TicketPreview
                    cart={cart}
                    client={selectedClient}
                    totalHT={totalHT}
                    totalTTC={totalTTC}
                    onClose={() => setShowPreview(false)}
                    onValidate={handleValidateSale}
                    isSubmitting={isSubmitting}
                />
            )}

            <div className="flex-1 flex flex-col gap-6">
                {/* Product Grid / Search */}
                <GlassCard className="flex-1 flex flex-col bg-white/40">
                    <div className="p-4 border-b border-white/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                            <input
                                type="text"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Scanner ou rechercher..."
                                className="input-glass w-full pl-10"
                                autoFocus
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex-1 flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={40} />
                        </div>
                    ) : (
                        <div className="flex-1 p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto content-start">
                            {filteredProducts.map(product => {
                                // Find stock in current warehouse
                                const warehouseInfo = product.warehouses?.find((w: any) => w.id == selectedWarehouse.id);
                                let stockAvailable = warehouseInfo ? Number(warehouseInfo.stock) : 0;

                                // Check for parent stock (Unpacking)
                                if (product.parent_id && product.conversion_rate > 0 && product.parent) {
                                    const parentStockInfo = product.parent.warehouses?.find((w: any) => w.id == selectedWarehouse.id);
                                    if (parentStockInfo && parentStockInfo.stock > 0) {
                                        // Add potential stock from parent
                                        stockAvailable += (Number(parentStockInfo.stock) * Number(product.conversion_rate));
                                    }
                                }

                                // Subtract cart quantity
                                const cartItem = cart.find(item => item.product_id === product.id);
                                if (cartItem) {
                                    stockAvailable -= cartItem.quantity;
                                }

                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-all text-left flex flex-col gap-2 border border-slate-100 hover:border-primary/50 group"
                                    >
                                        <div className={`h-24 rounded-lg mb-2 flex items-center justify-center ${product.color ? '' : 'bg-slate-100'}`} style={{ backgroundColor: product.color }}>
                                            {!product.color && <span className="text-slate-300 font-bold text-3xl">{product.designation.substring(0, 2).toUpperCase()}</span>}
                                        </div>
                                        <div className="flex-1">
                                            <div className="font-semibold text-slate-700 leading-tight line-clamp-2" title={product.designation}>{product.designation}</div>
                                            <div className="text-xs text-slate-400 mt-1">{product.sku}</div>
                                        </div>
                                        <div className="flex justify-between items-end mt-2">
                                            <span className="text-primary font-bold text-lg">{Number(product.selling_price).toLocaleString()} F</span>
                                            <span className={`text-xs px-2 py-1 rounded-full ${stockAvailable > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                Stock: {stockAvailable}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </GlassCard>
            </div>

            {/* Cart / Ticket */}
            <div className="w-96 flex flex-col h-full">
                <GlassCard className="flex-1 flex flex-col bg-white/80 border-slate-200 shadow-xl">
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingCart size={20} className="text-primary" /> Panier
                        </h3>
                        <button onClick={clearCart} className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors" title="Vider le panier">
                            <Trash2 size={18} />
                        </button>
                    </div>

                    <div className="flex-1 p-2 overflow-y-auto space-y-2">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                <ShoppingCart size={48} className="text-slate-200" />
                                <span>Panier vide</span>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="p-3 bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div className="font-medium text-slate-700 line-clamp-1">{item.designation}</div>
                                        <button onClick={() => removeFromCart(item.product_id)} className="text-slate-300 hover:text-red-500">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                                            <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Minus size={14} /></button>
                                            <span className="font-bold w-6 text-center text-slate-800">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-white rounded shadow-sm text-slate-600"><Plus size={14} /></button>
                                        </div>
                                        <div className="font-bold text-slate-800">
                                            {(item.price * item.quantity).toLocaleString()} F
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                        <div className="relative">
                            <select
                                className="w-full p-3 pl-10 rounded-xl bg-white border border-slate-200 text-slate-600 appearance-none focus:outline-none focus:border-primary"
                                value={selectedClient?.id || ''}
                                onChange={e => {
                                    const client = clients.find(c => c.id == e.target.value);
                                    setSelectedClient(client || null);
                                }}
                            >
                                <option value="">Client Comptoir (Défaut)</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                            </select>
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        </div>

                        <div className="space-y-3 pt-2">
                            {/* Type Selection */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Type de Paiement</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        className={`p-2 rounded-xl border text-sm font-bold transition-all ${paymentType === 'comptant' ? 'bg-primary text-white border-primary shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                                        onClick={() => setPaymentType('comptant')}
                                    >
                                        Au Comptant
                                    </button>
                                    <button
                                        className={`p-2 rounded-xl border text-sm font-bold transition-all ${paymentType === 'credit' ? 'bg-red-500 text-white border-red-500 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
                                        onClick={() => setPaymentType('credit')}
                                    >
                                        À Crédit
                                    </button>
                                </div>
                            </div>

                            {/* Method Selection (Only if Comptant) */}
                            {paymentType === 'comptant' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-slate-500 ml-1">Moyen de Paiement</label>
                                    <select
                                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 appearance-none focus:outline-none focus:border-primary"
                                        value={paymentMethod}
                                        onChange={e => setPaymentMethod(e.target.value)}
                                    >
                                        <option value="cash">Espèces</option>
                                        <option value="wave">Wave</option>
                                        <option value="orange_money">Orange Money</option>
                                        <option value="mtn_money">MTN Money</option>
                                        <option value="moov_money">Moov Money</option>
                                    </select>
                                </div>
                            )}

                            {/* Credit Info (Only if Credit) */}
                            {paymentType === 'credit' && (
                                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-xs text-red-600">
                                    <span className="font-bold block mb-1">⚠️ Vente à Crédit</span>
                                    La facture sera marquée comme impayée. Le client devra régler ultérieurement via le module Recouvrement.
                                </div>
                            )}

                            <div className="space-y-1 pt-2 border-t border-slate-100">
                                <div className="flex justify-between text-slate-600"><span>Total HT</span><span>{totalHT.toLocaleString()}</span></div>
                                <div className="flex justify-between text-slate-600"><span>TVA (0%)</span><span>0</span></div>
                                <div className="flex justify-between text-2xl font-bold text-primary pt-3 mt-2">
                                    <span>Total TTC</span>
                                    <span>{totalTTC.toLocaleString()} F</span>
                                </div>
                            </div>
                        </div>

                        <button
                            className="btn-primary w-full py-4 text-lg shadow-lg shadow-primary/20 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handlePreview}
                            disabled={cart.length === 0 || isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Encaisser'}
                        </button>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};

export default POS;
