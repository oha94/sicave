import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { User, Plus, Search, Edit2, Trash2, Shield, ShieldOff, Loader2 } from 'lucide-react';
import api from '../../services/api';

const ClientSettings: React.FC = () => {
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingClient, setEditingClient] = useState<any>(null);

    const [formData, setFormData] = useState({
        nom: '',
        telephone: '',
        email: '',
        adresse: '',
        type: 'particulier',
        ncc: '',
        rccm: ''
    });

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = () => {
        setLoading(true);
        api.getClients()
            .then(data => {
                setClients(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCreate = () => {
        setEditingClient(null);
        setFormData({ nom: '', telephone: '', email: '', adresse: '', type: 'particulier', ncc: '', rccm: '' });
        setIsModalOpen(true);
    };

    const handleEdit = (client: any) => {
        setEditingClient(client);
        setFormData({
            nom: client.nom,
            telephone: client.telephone || '',
            email: client.email || '',
            adresse: client.adresse || '',
            type: client.type || 'particulier',
            ncc: client.ncc || '',
            rccm: client.rccm || ''
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingClient) {
                await api.updateClient(editingClient.id, formData);
            } else {
                await api.createClient(formData);
            }
            loadClients();
            setIsModalOpen(false);
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Supprimer ce client ? Cette action est irréversible et peut affecter l'historique des ventes.")) {
            try {
                await api.deleteClient(id);
                loadClients();
            } catch (error) {
                alert("Impossible de supprimer ce client (probablement lié à des factures)");
            }
        }
    };

    const handleToggleStatus = async (client: any) => {
        try {
            await api.toggleClientStatus(client.id);
            loadClients();
        } catch (error) {
            alert("Erreur lors du changement de statut");
        }
    };

    const filteredClients = clients.filter(c =>
        c.nom.toLowerCase().includes(search.toLowerCase()) ||
        (c.telephone && c.telephone.includes(search))
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestion des Clients</h2>
                    <p className="text-slate-500">Ajouter, modifier ou suspendre des comptes clients</p>
                </div>
                <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nouveau Client
                </button>
            </div>

            <GlassCard className="p-4">
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher par nom ou téléphone..."
                            className="input-glass w-full pl-10"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400">Chargement...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs font-bold text-slate-500 uppercase border-b border-slate-100">
                                    <th className="pb-3 pl-4">Nom</th>
                                    <th className="pb-3">Contact</th>
                                    <th className="pb-3">Type</th>
                                    <th className="pb-3 text-center">Statut</th>
                                    <th className="pb-3 text-right pr-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredClients.map(client => (
                                    <tr key={client.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 pl-4">
                                            <div className="font-bold text-slate-700">{client.nom}</div>
                                            {client.email && <div className="text-xs text-slate-400">{client.email}</div>}
                                        </td>
                                        <td className="py-4 text-sm text-slate-600">
                                            {client.telephone ? (
                                                <div className="flex flex-col">
                                                    <span>{client.telephone}</span>
                                                    {client.adresse && <span className="text-xs text-slate-400">{client.adresse}</span>}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${client.type === 'entreprise' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {client.type || 'Particulier'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${client.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {client.status === 'suspended' ? 'Suspendu' : 'Actif'}
                                            </span>
                                        </td>
                                        <td className="py-4 text-right pr-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleToggleStatus(client)}
                                                    className={`p-2 rounded-lg transition-colors ${client.status === 'suspended' ? 'text-green-500 hover:bg-green-50' : 'text-orange-500 hover:bg-orange-50'}`}
                                                    title={client.status === 'suspended' ? "Activer" : "Suspendre"}
                                                >
                                                    {client.status === 'suspended' ? <Shield size={16} /> : <ShieldOff size={16} />}
                                                </button>
                                                <button onClick={() => handleEdit(client)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(client.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </GlassCard>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingClient ? 'Modifier le Client' : 'Nouveau Client'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="label">Nom complet / Raison Sociale</label>
                                    <input
                                        required
                                        className="input-glass w-full"
                                        value={formData.nom}
                                        onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="label">Type</label>
                                    <select
                                        className="input-glass w-full"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="particulier">Particulier</option>
                                        <option value="entreprise">Entreprise</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Téléphone</label>
                                    <input
                                        className="input-glass w-full"
                                        value={formData.telephone}
                                        onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        className="input-glass w-full"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="label">Adresse</label>
                                    <input
                                        className="input-glass w-full"
                                        value={formData.adresse}
                                        onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                                    />
                                </div>

                                {formData.type === 'entreprise' && (
                                    <>
                                        <div>
                                            <label className="label">NCC</label>
                                            <input
                                                className="input-glass w-full"
                                                value={formData.ncc}
                                                onChange={e => setFormData({ ...formData, ncc: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="label">RCCM</label>
                                            <input
                                                className="input-glass w-full"
                                                value={formData.rccm}
                                                onChange={e => setFormData({ ...formData, rccm: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3 justify-end">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium">Annuler</button>
                                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                                    {submitting && <Loader2 className="animate-spin" size={16} />}
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientSettings;
