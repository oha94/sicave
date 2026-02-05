import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Search, Plus, Ticket, FileText } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import TicketPreview from '../../components/facturation/TicketPreview';
import InvoiceA4 from '../../components/facturation/InvoiceA4';

import { useWarehouse } from '../../context/WarehouseContext';

const SalesHistory: React.FC = () => {
    const navigate = useNavigate();
    const { selectedWarehouse } = useWarehouse();
    const [sales, setSales] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSale, setSelectedSale] = useState<any>(null);

    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        if (selectedWarehouse) {
            loadSales();
        }
    }, [startDate, endDate, selectedWarehouse]);

    const loadSales = () => {
        if (!selectedWarehouse) return;
        setLoading(true);
        api.get('/invoices', {
            params: {
                date_from: startDate,
                date_to: endDate,
                warehouse_id: selectedWarehouse.id
            }
        }).then(res => {
            setSales(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    // Calculate total for the period
    // Only count non-proforma invoices
    const totalPeriod = sales
        .filter(s => s.type !== 'proforma')
        .reduce((acc, sale) => acc + Number(sale.total_ttc), 0);

    const totalPaid = sales
        .filter(s => s.type !== 'proforma')
        .reduce((acc, sale) => acc + (Number(sale.paid_amount) || 0), 0);

    const totalCredit = sales
        .filter(s => s.type !== 'proforma')
        .reduce((acc, sale) => acc + (Number(sale.total_ttc) - (Number(sale.paid_amount) || 0)), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Historique des Ventes</h2>
                    <p className="text-slate-500">Journal global des transactions</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/facturation/create')}
                        className="px-4 py-2 bg-primary text-white rounded-lg shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-primary/90 transition-colors"
                    >
                        <Plus size={18} /> Nouvelle Facture
                    </button>

                    <div className="flex gap-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                        <div className="text-right px-2 border-r border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Total Ventes</div>
                            <div className="text-lg font-bold text-slate-800">{totalPeriod.toLocaleString()} F</div>
                        </div>
                        <div className="text-right px-2 border-r border-slate-100">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Encaissé</div>
                            <div className="text-lg font-bold text-green-600">{totalPaid.toLocaleString()} F</div>
                        </div>
                        <div className="text-right px-2">
                            <div className="text-[10px] text-slate-400 uppercase font-bold">Crédit Client</div>
                            <div className="text-lg font-bold text-red-500">{totalCredit.toLocaleString()} F</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-white/50 p-1 rounded-xl border border-white/50">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-slate-600 px-2 py-1"
                        />
                        <span className="text-slate-400">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm text-slate-600 px-2 py-1"
                        />
                    </div>
                </div>
            </div>

            <GlassCard>
                <div className="p-4 border-b border-white/20">
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Rechercher..." className="input-glass w-full pl-10 h-10" />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-xs uppercase text-slate-400 bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left">Réf</th>
                                <th className="px-6 py-3 text-left">Type</th>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Client/Ticket</th>
                                <th className="px-6 py-3 text-right">Montant TTC</th>
                                <th className="px-6 py-3 text-center">Statut</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
                            ) : sales.filter(s => s.type !== 'proforma').length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Aucune vente sur cette période</td></tr>
                            ) : (
                                sales.filter(s => s.type !== 'proforma').map((sale: any) => (
                                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">{sale.reference}</td>
                                        <td className="px-6 py-4">
                                            {sale.type === 'receipt' ? (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium">Ticket</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">Facture</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm">
                                            {new Date(sale.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {sale.client?.nom || 'Client Comptoir'}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-800">
                                            {Number(sale.total_ttc).toLocaleString()} F
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col gap-1 items-center">
                                                {/* Payment Status */}
                                                {(sale.payment_status === 'unpaid' || sale.payment_status === 'partial') ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wide">
                                                        {sale.payment_status === 'partial' ? 'Partiel' : 'Crédit'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wide">
                                                        Payé
                                                    </span>
                                                )}

                                                {/* DGI Status */}
                                                {sale.dgi_reference ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400" title={'Ref: ' + sale.dgi_reference}>
                                                        DGI OK
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-slate-300">Standard</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Ticket Action */}
                                                <button
                                                    onClick={() => {
                                                        // Force view as ticket even if it's an invoice
                                                        setSelectedSale({ ...sale, viewMode: 'ticket' });
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                    title="Imprimer Ticket"
                                                >
                                                    <Ticket size={16} />
                                                </button>

                                                {/* Invoice/DGI Action */}
                                                <button
                                                    onClick={() => {
                                                        // Force view as invoice A4
                                                        setSelectedSale({ ...sale, viewMode: 'invoice' });
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Facture / DGI"
                                                >
                                                    <FileText size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Modals */}
            {selectedSale && (
                selectedSale.viewMode === 'ticket' ? (
                    <TicketPreview
                        cart={selectedSale.lines.map((l: any) => ({
                            designation: l.product?.designation,
                            quantity: l.quantity,
                            price: l.unit_price,
                            total: l.total
                        }))}
                        client={selectedSale.client}
                        totalHT={Number(selectedSale.total_ht)}
                        totalTTC={Number(selectedSale.total_ttc)}
                        onClose={() => setSelectedSale(null)}
                        onValidate={() => { setSelectedSale(null); }}
                        isSubmitting={false}
                        invoice={selectedSale}
                    />
                ) : (
                    <InvoiceA4
                        invoice={selectedSale}
                        onClose={() => setSelectedSale(null)}
                    />
                )
            )}
        </div>
    );
};

export default SalesHistory;
