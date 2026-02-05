import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Edit, Trash2, Archive } from 'lucide-react';
import api from '../../services/api';

const ShelfManager: React.FC = () => {
    const [shelves, setShelves] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingShelf, setEditingShelf] = useState<any | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchShelves();
    }, []);

    const fetchShelves = async () => {
        try {
            setLoading(true);
            const data = await api.getShelves();
            setShelves(data);
        } catch (error) {
            console.error("Error fetching shelves", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingShelf) {
                await api.updateShelf(editingShelf.id, formData);
            } else {
                await api.createShelf(formData);
            }
            fetchShelves();
            setIsModalOpen(false);
            setFormData({ name: '', description: '' });
            setEditingShelf(null);
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer ce rayon ?')) return;
        try {
            await api.deleteShelf(id);
            fetchShelves();
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.message || error.message));
        }
    };

    const openModal = (shelf?: any) => {
        if (shelf) {
            setEditingShelf(shelf);
            setFormData({ name: shelf.name, description: shelf.description || '' });
        } else {
            setEditingShelf(null);
            setFormData({ name: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const filteredShelves = shelves.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Rayons</h1>
                    <p className="text-slate-500">Gestion des emplacements produits</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus size={20} className="mr-2" /> Nouveau Rayon
                </Button>
            </div>

            <GlassCard className="p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-10">Chargement...</div>
                ) : filteredShelves.map((shelf) => (
                    <GlassCard key={shelf.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                <Archive size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{shelf.name}</h3>
                                {shelf.description && <p className="text-xs text-slate-500">{shelf.description}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-blue-600" onClick={() => openModal(shelf)}>
                                <Edit size={18} />
                            </button>
                            <button className="p-2 hover:bg-red-50 rounded-lg text-red-500" onClick={() => handleDelete(shelf.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </GlassCard>
                ))}
                {!loading && filteredShelves.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400 font-medium">
                        Aucun rayon trouvé.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingShelf ? 'Modifier Rayon' : 'Nouveau Rayon'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du Rayon</label>
                                <input
                                    type="text"
                                    required
                                    className="input-glass w-full"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    className="input-glass w-full"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                                <Button type="submit">Enregistrer</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShelfManager;
