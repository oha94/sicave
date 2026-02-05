import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Plus, Trash2, Calendar, User, CreditCard, FileText, DollarSign } from 'lucide-react';
import api from '../../services/api';

import { useWarehouse } from '../../context/WarehouseContext';

const Expenses: React.FC = () => {
    const { selectedWarehouse } = useWarehouse();
    const [expenses, setExpenses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Filter State
    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);

    // Form State
    const [formData, setFormData] = useState({
        date: today,
        authorizer: '',
        amount: '',
        type: 'Espèces',
        reason: ''
    });

    const expenseTypes = [
        'Espèces',
        'Wave',
        'Orange Money',
        'MTN Money',
        'Moov Money',
        'Chèque',
        'Virement'
    ];

    useEffect(() => {
        if (selectedWarehouse) {
            loadExpenses();
        }
    }, [dateFrom, dateTo, selectedWarehouse]);

    const loadExpenses = async () => {
        if (!selectedWarehouse) return;
        setLoading(true);
        try {
            const res = await api.get('/expenses', {
                params: {
                    date_from: dateFrom,
                    date_to: dateTo,
                    warehouse_id: selectedWarehouse.id
                }
            });
            setExpenses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (!selectedWarehouse) return alert("Sélectionnez un magasin");
            await api.post('/expenses', { ...formData, warehouse_id: selectedWarehouse.id });
            alert("Décaissement enregistré !");
            // Reset form but keep authorizer potentially?
            setFormData(prev => ({ ...prev, amount: '', reason: '' }));
            loadExpenses();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Supprimer ce décaissement ?")) return;
        try {
            await api.delete(`/expenses/${id}`);
            loadExpenses();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression");
        }
    };

    const totalAmount = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Décaissements</h2>
                    <p className="text-slate-500">Gestion des sorties de caisse</p>
                </div>
            </div>

            {/* Form Section */}
            <GlassCard className="p-6 border-l-4 border-l-red-500">
                <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <Plus className="text-red-500" size={20} /> Nouveau Décaissement
                </h3>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                required
                                className="input-glass w-full pl-9"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Autorisé par</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                placeholder="Nom du responsable"
                                className="input-glass w-full pl-9"
                                value={formData.authorizer}
                                onChange={e => setFormData({ ...formData, authorizer: e.target.value })}
                            />
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
                        <div className="relative">
                            <select
                                className="input-glass w-full pl-9 appearance-none"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Montant</label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="1"
                                placeholder="0"
                                className="input-glass w-full pl-9 font-bold text-red-600"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            />
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    <div className="space-y-1 lg:col-span-1">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20"
                        >
                            {submitting ? '...' : 'Valider Sortie'}
                        </button>
                    </div>

                    <div className="lg:col-span-5 space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Motif / Description</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                placeholder="Ex: Paiement facture électricité, Achat petit matériel..."
                                className="input-glass w-full pl-9"
                                value={formData.reason}
                                onChange={e => setFormData({ ...formData, reason: e.target.value })}
                            />
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>
                </form>
            </GlassCard>

            {/* List Section */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 p-4 rounded-2xl border border-white/60 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-medium">Période du</span>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-700"
                    />
                    <span className="text-slate-500 font-medium">au</span>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="bg-white border border-slate-200 rounded-lg px-3 py-1 text-sm text-slate-700"
                    />
                </div>
                <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Sorties</div>
                    <div className="text-2xl font-bold text-red-600">-{totalAmount.toLocaleString()} F</div>
                </div>
            </div>

            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 text-xs uppercase text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-left">Motif</th>
                                <th className="px-6 py-4 text-left">Type</th>
                                <th className="px-6 py-4 text-left">Autorisé par</th>
                                <th className="px-6 py-4 text-right">Montant</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
                            ) : expenses.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucun décaissement sur cette période</td></tr>
                            ) : (
                                expenses.map((expense: any) => (
                                    <tr key={expense.id} className="hover:bg-red-50/10 transition-colors group">
                                        <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-700">
                                            {expense.reason}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                                {expense.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                                                    {expense.authorizer.charAt(0)}
                                                </div>
                                                {expense.authorizer}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-red-600">
                                            -{Number(expense.amount).toLocaleString()} F
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleDelete(expense.id)}
                                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>
        </div>
    );
};

export default Expenses;
