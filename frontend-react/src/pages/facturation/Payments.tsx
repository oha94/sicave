import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import api from '../../services/api';
import { Calendar, User, Filter } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const Payments: React.FC = () => {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<any>(null);

    // Filters
    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState(today);
    const [dateTo, setDateTo] = useState(today);
    const [paymentMethod, setPaymentMethod] = useState('');

    useEffect(() => {
        loadPayments();
    }, [dateFrom, dateTo, paymentMethod]);

    const loadPayments = async (page = 1) => {
        setLoading(true);
        try {
            const params: any = {
                date_from: dateFrom,
                date_to: dateTo,
                page
            };
            if (paymentMethod) params.payment_method = paymentMethod;

            const data = await api.getPayments(params);
            setPayments(data.data || []);
            setPagination(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const totalAmount = payments.reduce((acc, p) => acc + Number(p.amount), 0);

    const getPaymentMethodLabel = (method: string) => {
        const labels: any = {
            'cash': 'Espèces',
            'wave': 'Wave',
            'orange_money': 'Orange Money',
            'mtn_money': 'MTN Money',
            'moov_money': 'Moov Money',
            'cheque': 'Chèque',
            'virement': 'Virement'
        };
        return labels[method] || method;
    };

    const getPaymentMethodColor = (method: string) => {
        const colors: any = {
            'cash': 'bg-green-100 text-green-700',
            'wave': 'bg-blue-100 text-blue-700',
            'orange_money': 'bg-orange-100 text-orange-700',
            'mtn_money': 'bg-yellow-100 text-yellow-700',
            'moov_money': 'bg-purple-100 text-purple-700',
            'cheque': 'bg-slate-100 text-slate-700',
            'virement': 'bg-indigo-100 text-indigo-700'
        };
        return colors[method] || 'bg-gray-100 text-gray-700';
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Historique des Paiements</h2>
                    <p className="text-slate-500">Liste complète des encaissements</p>
                </div>
            </div>

            {/* Filters */}
            <GlassCard className="p-4 flex flex-wrap gap-4 items-end">
                <div className="flex items-center gap-2">
                    <Filter size={20} className="text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Filtres:</span>
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Du</label>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={e => setDateFrom(e.target.value)}
                        className="input-glass"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Au</label>
                    <input
                        type="date"
                        value={dateTo}
                        onChange={e => setDateTo(e.target.value)}
                        className="input-glass"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Mode de paiement</label>
                    <select
                        value={paymentMethod}
                        onChange={e => setPaymentMethod(e.target.value)}
                        className="input-glass"
                    >
                        <option value="">Tous</option>
                        <option value="cash">Espèces</option>
                        <option value="wave">Wave</option>
                        <option value="orange_money">Orange Money</option>
                        <option value="mtn_money">MTN Money</option>
                        <option value="moov_money">Moov Money</option>
                        <option value="cheque">Chèque</option>
                        <option value="virement">Virement</option>
                    </select>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">Total Période</div>
                    <div className="text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</div>
                </div>
            </GlassCard>

            {/* Payments List */}
            <GlassCard>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50/50 text-xs uppercase text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 text-left">Date</th>
                                <th className="px-6 py-4 text-left">Client</th>
                                <th className="px-6 py-4 text-left">Caissier</th>
                                <th className="px-6 py-4 text-left">Mode</th>
                                <th className="px-6 py-4 text-left">Référence</th>
                                <th className="px-6 py-4 text-right">Montant</th>
                                <th className="px-6 py-4 text-center">Factures</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Aucun paiement trouvé</td></tr>
                            ) : (
                                payments.map((payment: any) => (
                                    <tr key={payment.id} className="hover:bg-green-50/10 transition-colors group">
                                        <td className="px-6 py-4 text-slate-600 font-medium whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-slate-400" />
                                                {new Date(payment.payment_date).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-700 font-medium">
                                            {payment.client?.nom || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <div className="flex items-center gap-2">
                                                <User size={14} className="text-slate-400" />
                                                {payment.user?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.payment_method)}`}>
                                                {getPaymentMethodLabel(payment.payment_method)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {payment.reference || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-green-600">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                {payment.invoices?.length || 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.last_page > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
                        <div className="text-sm text-slate-500">
                            Page {pagination.current_page} sur {pagination.last_page}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => loadPayments(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Précédent
                            </button>
                            <button
                                onClick={() => loadPayments(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Suivant
                            </button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
};

export default Payments;
