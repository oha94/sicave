import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Plus, Search, Check, Eye, Globe, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import TicketPreview from '../../components/facturation/TicketPreview';
import InvoiceA4 from '../../components/facturation/InvoiceA4';

import { useWarehouse } from '../../context/WarehouseContext';

const InvoiceList: React.FC = () => {
    const navigate = useNavigate();
    const { selectedWarehouse } = useWarehouse(); // Get selected warehouse
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportingId, setReportingId] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'normalized' | 'proforma'>('normalized');

    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    useEffect(() => {
        if (selectedWarehouse) {
            loadInvoices();
        }
    }, [startDate, endDate, activeTab, selectedWarehouse]); // Reload when warehouse changes

    const loadInvoices = () => {
        if (!selectedWarehouse) return;

        setLoading(true);
        // Map tab to API types
        // normalized -> invoice (and maybe receipt? leaving as invoice for now per request)
        // proforma -> proforma
        const type = activeTab === 'normalized' ? 'invoice' : 'proforma';

        api.get('/invoices', {
            params: {
                date_from: startDate,
                date_to: endDate,
                type: type,
                warehouse_id: selectedWarehouse.id // Pass warehouse ID
            }
        }).then(res => {
            setInvoices(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    };

    const handleReportDgi = async (invoice: any) => {
        if (!window.confirm("Voulez-vous déclarer cette facture à la DGI ? Une fois déclarée, elle ne pourra plus être modifiée.")) return;

        setReportingId(invoice.id);
        try {
            await api.post(`/invoices/${invoice.id}/report`, {});
            alert("Facture déclarée avec succès !");
            loadInvoices();
        } catch (error: any) {
            console.error(error);
            alert("Erreur: " + (error.response?.data?.message || "Echec de déclaration"));
        } finally {
            setReportingId(null);
        }
    };

    const handleDelete = async (invoice: any) => {
        if (!window.confirm("Voulez-vous vraiment supprimer cette facture proforma ?")) return;

        try {
            await api.delete(`/invoices/${invoice.id}`);
            // alert("Supprimé avec succès");
            loadInvoices();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la suppression");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Factures & Proformas</h2>
                    <p className="text-slate-500">Gestion des factures</p>
                </div>
                <button
                    onClick={() => navigate('/facturation/create')}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={18} /> Nouvelle Facture
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('normalized')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'normalized'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Factures Normalisées
                </button>
                <button
                    onClick={() => setActiveTab('proforma')}
                    className={`pb-3 px-4 text-sm font-medium transition-colors relative ${activeTab === 'proforma'
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    Factures Proforma
                </button>
            </div>

            <GlassCard>
                <div className="p-4 border-b border-white/20 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative max-w-sm flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input type="text" placeholder="Rechercher..." className="input-glass w-full pl-10 h-10" />
                    </div>

                    <div className="flex items-center gap-2">
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
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-xs uppercase text-slate-400 bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left">Référence</th>
                                <th className="px-6 py-3 text-left">Client</th>
                                <th className="px-6 py-3 text-left">Date</th>
                                <th className="px-6 py-3 text-left">Montant</th>
                                {activeTab === 'normalized' && <th className="px-6 py-3 text-center">DGI</th>}
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Chargement...</td></tr>
                            ) : invoices.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucune facture trouvée</td></tr>
                            ) : (
                                invoices.map((inv: any) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-slate-700">{inv.reference}</td>
                                        <td className="px-6 py-4 text-slate-600">{inv.client?.nom || 'Client Comptoir'}</td>
                                        <td className="px-6 py-4 text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-bold text-slate-800">{Number(inv.total_ttc).toLocaleString()} F</td>

                                        {activeTab === 'normalized' && (
                                            <td className="px-6 py-4 text-center">
                                                {inv.dgi_reference ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span
                                                            className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-green-100 text-green-700 border border-green-200 cursor-help"
                                                            title={`Référence DGI: ${inv.dgi_reference}\nDate: ${new Date(inv.dgi_synced_at).toLocaleString('fr-FR')}`}
                                                        >
                                                            <Check size={12} /> Déclaré DGI
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-mono">
                                                            {inv.dgi_reference.substring(0, 15)}...
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        Non Déclaré
                                                    </span>
                                                )}
                                            </td>
                                        )}

                                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                            {/* Preview Ticket/Invoice */}
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                                title="Voir"
                                            >
                                                <Eye size={18} />
                                            </button>

                                            {/* DGI Action (Normalized Only) */}
                                            {activeTab === 'normalized' && !inv.dgi_reference && (
                                                <button
                                                    onClick={() => handleReportDgi(inv)}
                                                    disabled={reportingId === inv.id}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors font-medium text-sm flex items-center gap-1"
                                                    title="Déclarer à la DGI"
                                                >
                                                    {reportingId === inv.id ? (
                                                        <span className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                                    ) : (
                                                        <Globe size={18} />
                                                    )}
                                                </button>
                                            )}

                                            {/* Delete Action (Proforma Only) */}
                                            {activeTab === 'proforma' && (
                                                <button
                                                    onClick={() => handleDelete(inv)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Supprimer"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </GlassCard>

            {/* Ticket Preview Modal or Invoice A4 */}
            {selectedInvoice && (
                selectedInvoice.type === 'receipt' ? (
                    <TicketPreview
                        cart={selectedInvoice.lines.map((l: any) => ({
                            designation: l.product?.designation,
                            quantity: l.quantity,
                            price: l.unit_price,
                            total: l.total
                        }))}
                        client={selectedInvoice.client}
                        totalHT={Number(selectedInvoice.total_ht)}
                        totalTTC={Number(selectedInvoice.total_ttc)}
                        onClose={() => setSelectedInvoice(null)}
                        onValidate={() => { }}
                        isSubmitting={false}
                        invoice={selectedInvoice}
                    />
                ) : (
                    <InvoiceA4
                        invoice={selectedInvoice}
                        onClose={() => setSelectedInvoice(null)}
                    />
                )
            )}
        </div>
    );
};

export default InvoiceList;
