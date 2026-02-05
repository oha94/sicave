
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { WarehouseSelector } from '../../components/ui/WarehouseSelector';
import { stockService } from '../../services/stockService';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Filter, AlertCircle } from 'lucide-react';

const CreateInventory: React.FC = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [warehouseId, setWarehouseId] = useState('');
    const [type, setType] = useState<'full' | 'partial'>('full');

    // Filters
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [shelves, setShelves] = useState<any[]>([]);
    const [selectedShelf, setSelectedShelf] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [cats, shs] = await Promise.all([
                    api.getCategories(),
                    api.getShelves()
                ]);
                setCategories(cats);
                setShelves(shs);
            } catch (e) {
                console.error(e);
            }
        };
        loadFilters();
    }, []);

    const handleCreate = async () => {
        if (!warehouseId) return alert("Veuillez sélectionner un entrepôt");

        setLoading(true);
        try {
            const payload: any = {
                warehouse_id: warehouseId,
                type: type,
            };

            if (type === 'partial') {
                if (selectedCategory) payload.category_id = selectedCategory;
                if (selectedShelf) payload.shelf_id = selectedShelf;
            }

            const res = await stockService.createInventory(payload);
            // Navigate to the Count page (Inventory Detail)
            navigate(`/stock/inventory/${res.id}`);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Erreur lors de la création de l'inventaire");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Nouvel Inventaire</h2>
                <p className="text-slate-500">Configurez le périmètre de votre inventaire</p>
            </div>

            <GlassCard className="p-6 space-y-8">
                {/* Warehouse Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">1. Sélectionner l'entrepôt</label>
                    <WarehouseSelector selectedId={warehouseId} onChange={(w) => setWarehouseId(w.id)} className="w-full" />
                </div>

                {/* Type Selection */}
                <div className="space-y-3">
                    <label className="text-sm font-semibold text-slate-700">2. Type d'inventaire</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setType('full')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'full'
                                ? 'bg-primary/5 border-primary text-primary ring-1 ring-primary'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <span className="font-bold">Inventaire Général</span>
                            <span className="text-xs opacity-70">Tous les produits</span>
                        </button>
                        <button
                            onClick={() => setType('partial')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'partial'
                                ? 'bg-primary/5 border-primary text-primary ring-1 ring-primary'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                        >
                            <span className="font-bold">Inventaire Partiel</span>
                            <span className="text-xs opacity-70">Rayons / Catégories spécifiques</span>
                        </button>
                    </div>
                </div>

                {/* Partial Filters */}
                {type === 'partial' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2 text-slate-500 mb-2">
                            <Filter size={16} />
                            <span className="text-sm font-medium">Filtres optionnels</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Catégorie</label>
                                <select
                                    className="w-full h-10 rounded-lg border border-slate-200 text-sm px-2 bg-white"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="">Toutes les catégories</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-slate-600">Rayon</label>
                                <select
                                    className="w-full h-10 rounded-lg border border-slate-200 text-sm px-2 bg-white"
                                    value={selectedShelf}
                                    onChange={(e) => setSelectedShelf(e.target.value)}
                                >
                                    <option value="">Tous les rayons</option>
                                    {shelves.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                <div className="pt-4">
                    <button
                        onClick={handleCreate}
                        disabled={loading || !warehouseId}
                        className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading ? 'Création...' : (
                            <>
                                <span>Commencer l'inventaire</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-2">
                        Cela générera la liste de comptage basée sur vos critères.
                    </p>
                </div>
            </GlassCard>
        </div>
    );
};

export default CreateInventory;
