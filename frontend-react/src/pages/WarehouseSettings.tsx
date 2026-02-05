import React from 'react';
import { useWarehouse } from '../context/WarehouseContext';
import { GlassCard } from '../components/ui/GlassCard';
import type { Warehouse } from '../types';
import { Building2, Store, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../services/api';

const WarehouseSettings: React.FC = () => {
    const { warehouses, loading } = useWarehouse();
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [editingWarehouse, setEditingWarehouse] = React.useState<Warehouse | null>(null);
    const [formData, setFormData] = React.useState({ nom: '', type: 'warehouse', adresse: '' });

    // Open Modal for Create
    const handleCreate = () => {
        setEditingWarehouse(null);
        setFormData({ nom: '', type: 'warehouse', adresse: '' });
        setIsModalOpen(true);
    };

    // Open Modal for Edit
    const handleEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setFormData({
            nom: warehouse.nom,
            type: warehouse.type,
            adresse: warehouse.adresse || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Supprimer ce site ?")) {
            await api.delete(`/warehouses/${id}`);
            window.location.reload();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingWarehouse) {
                await api.put(`/warehouses/${editingWarehouse.id}`, formData);
            } else {
                await api.post('/warehouses', formData);
            }
            setIsModalOpen(false);
            window.location.reload();
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || error.message || "Erreur lors de l'enregistrement";
            alert(errorMessage);
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestion des Sites</h2>
                    <p className="text-slate-500">Ajouter des entrepôts ou des points de vente.</p>
                </div>
                <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nouveau Site
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {warehouses.map((w) => (
                    <GlassCard key={w.id} className="relative group hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${w.type === 'store' ? 'bg-orange-100 text-orange-600' : 'bg-teal-100 text-teal-600'}`}>
                                    {w.type === 'store' ? <Store size={24} /> : <Building2 size={24} />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{w.nom}</h3>
                                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{w.type === 'store' ? 'Magasin' : 'Entrepôt'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(w)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(w.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between text-sm text-slate-500">
                            <span>Stock Total: --</span>
                            <span>Adresse: {w.adresse || 'Non définie'}</span>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingWarehouse ? 'Modifier le Site' : 'Nouveau Site'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Nom du Site</label>
                                <input
                                    type="text"
                                    required
                                    className="input-glass w-full"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Type</label>
                                <select
                                    className="input-glass w-full"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="warehouse">Entrepôt</option>
                                    <option value="store">Magasin / Point de Vente</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Adresse</label>
                                <input
                                    type="text"
                                    className="input-glass w-full"
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                />
                            </div>
                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium">Annuler</button>
                                <button type="submit" className="btn-primary">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarehouseSettings;
