import React, { useState } from 'react';
import { stockService } from '../services/stockService';
import { useWarehouse } from '../context/WarehouseContext';
import { GlassCard } from '../components/ui/GlassCard';
import { ClipboardList, Play } from 'lucide-react';

const CreateInventory: React.FC = () => {
    const { selectedWarehouse } = useWarehouse();
    const [type, setType] = useState('partial');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!selectedWarehouse) {
            setMessage("Veuillez sélectionner un entrepôt dans le menu principal.");
            setLoading(false);
            return;
        }

        try {
            const response = await stockService.createInventory({
                warehouse_id: selectedWarehouse.id,
                type: type as 'full' | 'partial'
            });
            setMessage(`Inventaire créé avec succès ! ID: ${response.id}`);
        } catch (error) {
            console.error(error);
            setMessage("Erreur lors de la création.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                    <ClipboardList className="text-primary" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Nouvel Inventaire</h2>
                    <p className="text-slate-500">Démarrer une session de comptage</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border ${message.includes('Erreur') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <GlassCard className="space-y-6">
                    {/* Warehouse is now selected globally */}

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Type d'Inventaire</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setType('partial')}
                                className={`p-4 rounded-xl border text-left transition-all ${type === 'partial' ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/20' : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'}`}
                            >
                                <div className="font-semibold">Partiel (Tournant)</div>
                                <div className="text-xs opacity-80 mt-1">Quelques produits sélectionnés</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('full')}
                                className={`p-4 rounded-xl border text-left transition-all ${type === 'full' ? 'bg-primary/10 border-primary text-primary ring-2 ring-primary/20' : 'bg-white/50 border-slate-200 text-slate-600 hover:bg-white'}`}
                            >
                                <div className="font-semibold">Complet (Annuel)</div>
                                <div className="text-xs opacity-80 mt-1">Tout l'entrepôt</div>
                            </button>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button type="submit" disabled={loading} className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-70">
                            <Play size={20} />
                            {loading ? 'Initialisation...' : 'Démarrer l\'Inventaire'}
                        </button>
                    </div>
                </GlassCard>
            </form>
        </div>
    );
};

export default CreateInventory;
