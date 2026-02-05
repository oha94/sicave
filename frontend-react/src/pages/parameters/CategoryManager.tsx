import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Edit, Trash2, FolderOpen } from 'lucide-react';
import api from '../../services/api';

const CategoryManager: React.FC = () => {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any | null>(null);
    const [formData, setFormData] = useState({ nom: '', description: '' });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const data = await api.getCategories();
            setCategories(data);
        } catch (error) {
            console.error("Error fetching categories", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingCategory) {
                await api.updateCategory(editingCategory.id, formData);
            } else {
                await api.createCategory(formData);
            }
            fetchCategories();
            setIsModalOpen(false);
            setFormData({ nom: '', description: '' });
            setEditingCategory(null);
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Supprimer cette catégorie ?')) return;
        try {
            await api.deleteCategory(id);
            fetchCategories();
        } catch (error: any) {
            alert('Erreur: ' + (error.response?.data?.message || error.message));
        }
    };

    const openModal = (category?: any) => {
        if (category) {
            setEditingCategory(category);
            setFormData({ nom: category.nom, description: category.description || '' });
        } else {
            setEditingCategory(null);
            setFormData({ nom: '', description: '' });
        }
        setIsModalOpen(true);
    };

    const filteredCategories = categories.filter(c =>
        c.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Catégories</h1>
                    <p className="text-slate-500">Gestion des familles de produits</p>
                </div>
                <Button onClick={() => openModal()}>
                    <Plus size={20} className="mr-2" /> Nouvelle Catégorie
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
                ) : filteredCategories.map((category) => (
                    <GlassCard key={category.id} className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                                <FolderOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800">{category.nom}</h3>
                                {category.description && <p className="text-xs text-slate-500">{category.description}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-slate-100 rounded-lg text-blue-600" onClick={() => openModal(category)}>
                                <Edit size={18} />
                            </button>
                            <button className="p-2 hover:bg-red-50 rounded-lg text-red-500" onClick={() => handleDelete(category.id)}>
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </GlassCard>
                ))}
                {!loading && filteredCategories.length === 0 && (
                    <div className="col-span-full text-center py-10 text-slate-400 font-medium">
                        Aucune catégorie trouvée.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">{editingCategory ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom</label>
                                <input
                                    type="text"
                                    required
                                    className="input-glass w-full"
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
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

export default CategoryManager;
