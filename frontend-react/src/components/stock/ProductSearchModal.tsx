import React, { useState, useEffect } from 'react';
import { X, Search, Package } from 'lucide-react';
import { stockService } from '../../services/stockService';

interface ProductSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (product: any) => void;
    warehouseId?: string; // Optional: if we want to show stock for a specific warehouse
}

export const ProductSearchModal: React.FC<ProductSearchModalProps> = ({ isOpen, onClose, onSelect, warehouseId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Initial load or reset
            setSearchTerm('');
            fetchProducts('');
        }
    }, [isOpen]);

    const fetchProducts = async (query: string) => {
        setLoading(true);
        try {
            // Assuming stockService.getProducts accepts a query or we filter client-side if API doesn't support it yet
            // optimizing to search via API would be better, but for now let's assume we get a list and filter or the API supports it
            const response = await stockService.getProducts();
            // Handle paginated response which comes as { data: [...], meta: ... }
            // or if it was modified to just return array
            const allProducts = Array.isArray(response) ? response : (response.data || []);

            let filtered = allProducts;
            if (query) {
                const lower = query.toLowerCase();
                filtered = allProducts.filter((p: any) =>
                    p.designation.toLowerCase().includes(lower) ||
                    (p.sku && p.sku.toLowerCase().includes(lower))
                );
            }
            setProducts(filtered);
        } catch (error) {
            console.error("Error fetching products", error);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isOpen) fetchProducts(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl m-4 flex flex-col max-h-[80vh]">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-800">Ajouter un produit</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-4 border-b border-slate-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            placeholder="Rechercher par nom ou code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2">
                    {loading ? (
                        <div className="flex justify-center p-8 text-slate-500">Chargement...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">Aucun produit trouvé.</div>
                    ) : (
                        <div className="grid gap-2">
                            {products.map(product => (
                                <button
                                    key={product.id}
                                    className="flex items-center gap-4 p-3 hover:bg-primary/5 rounded-xl transition-colors text-left group border border-transparent hover:border-primary/10"
                                    onClick={() => {
                                        onSelect(product);
                                        onClose();
                                    }}
                                >
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                                        <Package size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-800">{product.designation}</div>
                                        <div className="text-sm text-slate-500 flex gap-3">
                                            <span>SKU: {product.sku || '-'}</span>
                                            {/* If we had stock info avail here we could show it */}
                                            <span>Prix: {product.price} FCFA</span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
