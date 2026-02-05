import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import { User, Plus, Edit2, Trash2, Shield } from 'lucide-react';
import api from '../services/api';

import { useWarehouse } from '../context/WarehouseContext';
import type { Warehouse } from '../types';

interface UserType {
    id: string;
    name: string;
    pseudo: string;
    email: string | null;
    role: string;
    warehouses?: Warehouse[];
}

const UserSettings: React.FC = () => {
    const { warehouses } = useWarehouse();
    const [users, setUsers] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserType | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        pseudo: '',
        email: '',
        role: 'user',
        password: '',
        warehouses: [] as string[] // Array of Warehouse IDs
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            console.error("Erreur chargement utilisateurs", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingUser(null);
        setFormData({ name: '', pseudo: '', email: '', role: 'user', password: '', warehouses: [] });
        setIsModalOpen(true);
    };

    const handleEdit = (user: UserType) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            pseudo: user.pseudo || '',
            email: user.email || '',
            role: user.role || 'user',
            password: '', // Leave empty to keep unchanged
            warehouses: user.warehouses ? user.warehouses.map(w => w.id) : []
        });
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload: any = {
                name: formData.name,
                pseudo: formData.pseudo,
                email: formData.email || null,
                role: formData.role,
                warehouses: formData.warehouses
            };

            if (formData.password) {
                payload.password = formData.password;
                payload.password_confirmation = formData.password;
            }

            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, payload);
            } else {
                await api.post('/users', payload);
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || "Erreur lors de l'enregistrement.";
            const errors = error.response?.data?.errors;
            let detail = "";
            if (errors) {
                detail = "\n" + Object.values(errors).flat().join("\n");
            }
            alert(msg + detail);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Supprimer cet utilisateur ?")) {
            await api.delete(`/users/${id}`);
            fetchUsers();
        }
    };

    const toggleWarehouse = (warehouseId: string) => {
        setFormData(prev => {
            const current = prev.warehouses;
            if (current.includes(warehouseId)) {
                return { ...prev, warehouses: current.filter(id => id !== warehouseId) };
            } else {
                return { ...prev, warehouses: [...current, warehouseId] };
            }
        });
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="space-y-6 relative">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Gestion Utilisateurs</h2>
                    <p className="text-slate-500">Comptes d'accès au système.</p>
                </div>
                <button onClick={handleCreate} className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nouvel Utilisateur
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {users.map((user) => (
                    <GlassCard key={user.id} className="relative group hover:border-primary/30 transition-colors">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${user.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'}`}>
                                    <User size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{user.name}</h3>
                                    <div className="flex items-center gap-2 text-xs">
                                        <span className="font-bold text-primary">@{user.pseudo}</span>
                                        <span className={`px-2 py-0.5 rounded uppercase ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {user.role}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(user)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-500"><Edit2 size={16} /></button>
                                <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-500">

                            <div className="flex items-start gap-2">
                                <Shield size={14} className="mt-1" />
                                <div className="flex flex-wrap gap-1">
                                    {user.warehouses?.slice(0, 3).map(w => (
                                        <span key={w.id} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600">{w.nom}</span>
                                    ))}
                                    {user.warehouses && user.warehouses.length > 3 && (
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500">+{user.warehouses.length - 3}</span>
                                    )}
                                    {(!user.warehouses || user.warehouses.length === 0) && <span className="text-xs italic text-slate-400">Aucun site assigné</span>}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* User Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {editingUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Identité</h4>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Nom Complet</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-glass w-full"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Pseudo *</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-glass w-full"
                                            value={formData.pseudo}
                                            onChange={(e) => setFormData({ ...formData, pseudo: e.target.value })}
                                            placeholder="jdoe"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-600 mb-1">Rôle *</label>
                                        <select
                                            className="input-glass w-full"
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                        >
                                            <option value="user">Utilisateur</option>
                                            <option value="manager">Manager</option>
                                            <option value="admin">Administrateur</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Mot de passe {editingUser && '(Laisser vide pour garder)'}</label>
                                    <input
                                        type="password"
                                        className="input-glass w-full"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required={!editingUser}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold text-slate-700 text-sm uppercase tracking-wider">Accès Entrepôts ({formData.warehouses.length})</h4>
                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                                    {warehouses.map(w => (
                                        <label key={w.id} className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all ${formData.warehouses.includes(w.id) ? 'bg-primary/5 border-primary shadow-sm' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                                                checked={formData.warehouses.includes(w.id)}
                                                onChange={() => toggleWarehouse(w.id)}
                                            />
                                            <span className="ml-3 font-medium text-slate-700 flex-1">{w.nom}</span>
                                            <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{w.type}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t border-slate-100 flex gap-3 justify-end bg-slate-50/50">
                            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-medium">Annuler</button>
                            <button type="button" onClick={handleSave} className="btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSettings;
