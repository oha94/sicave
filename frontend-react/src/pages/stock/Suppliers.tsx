import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Plus, Search, Truck, MapPin, Edit, Trash2, X, Save } from 'lucide-react';
import { supplierService, type Supplier } from '../../services/supplierService';

const Suppliers: React.FC = () => {
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nom: '',
        coordonnees: ''
    });

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const data = await supplierService.getSuppliers();
            setSuppliers(data);
        } catch (error) {
            console.error("Error fetching suppliers:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const handleOpenForm = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                nom: supplier.nom,
                coordonnees: supplier.coordonnees || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({ nom: '', coordonnees: '' });
        }
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingSupplier(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingSupplier) {
                await supplierService.updateSupplier(editingSupplier.id, formData);
            } else {
                await supplierService.createSupplier(formData);
            }
            fetchSuppliers();
            handleCloseForm();
        } catch (error) {
            console.error("Error saving supplier:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce fournisseur ?')) {
            try {
                await supplierService.deleteSupplier(id);
                fetchSuppliers();
            } catch (error) {
                console.error("Error deleting supplier:", error);
            }
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.coordonnees && s.coordonnees.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Truck className="mr-3 text-primary" size={32} />
                        Gestion des Fournisseurs
                    </h1>
                    <p className="text-slate-500 mt-1">Gérez votre liste de fournisseurs</p>
                </div>
                <Button onClick={() => handleOpenForm()}>
                    <Plus size={20} className="mr-2" />
                    Nouveau Fournisseur
                </Button>
            </div>

            <div className="flex items-center space-x-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <Search className="text-slate-400" />
                <input
                    type="text"
                    placeholder="Rechercher un fournisseur..."
                    className="bg-transparent border-none outline-none flex-1 text-slate-700 placeholder-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-400">Chargement...</div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400">Aucun fournisseur trouvé</div>
                ) : (
                    filteredSuppliers.map(supplier => (
                        <GlassCard key={supplier.id} className="p-6 hover:shadow-lg transition-shadow relative group">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-teal-50 text-teal-600 rounded-lg">
                                    <Truck size={24} />
                                </div>
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenForm(supplier)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-primary">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(supplier.id)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-red-500">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-slate-800 mb-2">{supplier.nom}</h3>

                            {supplier.coordonnees && (
                                <div className="flex items-start text-slate-500 text-sm mt-2">
                                    <MapPin size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                                    <p className="line-clamp-2">{supplier.coordonnees}</p>
                                </div>
                            )}
                        </GlassCard>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <GlassCard className="w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-800">
                                {editingSupplier ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
                            </h2>
                            <button onClick={handleCloseForm} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du fournisseur</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    placeholder="Ex: Cave de Bordeaux"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Coordonnées (Adresse, Tél, Email)</label>
                                <textarea
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 h-32 resize-none"
                                    value={formData.coordonnees}
                                    onChange={(e) => setFormData({ ...formData, coordonnees: e.target.value })}
                                    placeholder="Adresse complète, téléphone, email..."
                                />
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="button" variant="ghost" onClick={handleCloseForm} className="mr-2">
                                    Annuler
                                </Button>
                                <Button type="submit">
                                    <Save size={18} className="mr-2" />
                                    {editingSupplier ? 'Mettre à jour' : 'Enregistrer'}
                                </Button>
                            </div>
                        </form>
                    </GlassCard>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
