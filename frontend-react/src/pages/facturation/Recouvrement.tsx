
import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import api from '../../services/api';
import { DollarSign, Calendar, Search, Printer, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

const Recouvrement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'unpaid' | 'partial' | 'paid'>('unpaid');
    const [debtors, setDebtors] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [clientInvoices, setClientInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Payment Form State
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [reference, setReference] = useState('');
    const [processing, setProcessing] = useState(false);


    useEffect(() => {
        loadDebtors();
        setSelectedClient(null);
        setClientInvoices([]);
    }, [activeTab]);

    const loadDebtors = async () => {
        setLoading(true);
        try {
            const data = await api.getDebtors({ status: activeTab });
            setDebtors(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectClient = async (client: any) => {
        setSelectedClient(client);
        setClientInvoices([]);
        try {
            const res = await api.getClientDebt(client.id);
            // Filter invoices here to match Global Tab? Or show all history? 
            // User likely wants drill-down. Let's keep consistency:
            // If I am in "Payés" tab, show me Paid invoices for this client.
            if (activeTab === 'paid') {
                setClientInvoices(res.invoices.filter((inv: any) => inv.payment_status === 'paid'));
            } else if (activeTab === 'partial') {
                setClientInvoices(res.invoices.filter((inv: any) => inv.payment_status === 'partial'));
            } else {
                setClientInvoices(res.invoices.filter((inv: any) => inv.payment_status === 'unpaid'));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handlePayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return alert("Montant invalide");

        setProcessing(true);
        try {
            await api.createPayment({
                client_id: selectedClient.id,
                amount: parseFloat(amount),
                payment_method: paymentMethod,
                reference: reference,
                payment_date: new Date().toISOString().split('T')[0]
            });
            alert("Paiement enregistré !");
            setAmount('');
            setReference('');
            // Reload data
            loadDebtors(); // Reload list
            if (selectedClient) {
                handleSelectClient(selectedClient); // Reload detail
            }
        } catch (e) {
            console.error(e);
            alert("Erreur lors du paiement");
        } finally {
            setProcessing(false);
        }
    };

    const totalDue = selectedClient ? clientInvoices.reduce((acc, inv) => acc + (inv.remaining_amount || 0), 0) : 0;

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">

            {/* Global Tabs */}
            <div className="flex justify-center">
                <div className="bg-white/50 backdrop-blur-md p-1 rounded-xl flex gap-1 shadow-sm border border-white/20">
                    <button
                        onClick={() => setActiveTab('unpaid')}
                        className={`px-6 py-2 rounded-lg transition-all font-bold text-sm flex items-center gap-2 ${activeTab === 'unpaid'
                            ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                            : 'text-slate-500 hover:bg-white/40'
                            }`}
                    >
                        <AlertCircle size={16} />
                        Impayés
                    </button>
                    <button
                        onClick={() => setActiveTab('partial')}
                        className={`px-6 py-2 rounded-lg transition-all font-bold text-sm flex items-center gap-2 ${activeTab === 'partial'
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'text-slate-500 hover:bg-white/40'
                            }`}
                    >
                        <Clock size={16} />
                        Partiels
                    </button>
                    <button
                        onClick={() => setActiveTab('paid')}
                        className={`px-6 py-2 rounded-lg transition-all font-bold text-sm flex items-center gap-2 ${activeTab === 'paid'
                            ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                            : 'text-slate-500 hover:bg-white/40'
                            }`}
                    >
                        <CheckCircle size={16} />
                        Historique (Payés)
                    </button>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 gap-6">
                {/* Left: Client List */}
                <div className="w-1/3 flex flex-col gap-4">
                    <GlassCard className="p-4 bg-white/50 backdrop-blur-xl border border-white/20">
                        <div className="flex items-center gap-2 mb-4">
                            <Search className="text-slate-400" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher un client..."
                                className="bg-transparent border-none outline-none text-sm w-full"
                            />
                        </div>
                    </GlassCard>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                        {loading ? <div className="text-center p-4">Chargement...</div> : debtors.map(client => (
                            <div
                                key={client.id}
                                onClick={() => handleSelectClient(client)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedClient?.id === client.id
                                    ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                                    : 'bg-white border-slate-100 hover:border-primary/30 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <div className="font-bold">{client.nom}</div>
                                    <div className={`px-2 py-0.5 rounded text-xs font-bold ${selectedClient?.id === client.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                        {activeTab === 'paid'
                                            ? formatCurrency(client.total_paid_history || 0)
                                            : formatCurrency(client.total_debt)}
                                    </div>
                                </div>
                                <div className={`text-xs ${selectedClient?.id === client.id ? 'text-white/70' : 'text-slate-400'}`}>
                                    {client.telephone || "Sans téléphone"}
                                </div>
                            </div>
                        ))}
                        {debtors.length === 0 && !loading && (
                            <div className="text-center text-slate-400 py-8">Aucun client trouvé pour ce statut.</div>
                        )}
                    </div>
                </div>

                {/* Right: Detail */}
                <div className="flex-1 flex flex-col gap-6">
                    {selectedClient ? (
                        <>
                            {/* Header */}
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">{selectedClient.nom}</h2>
                                    <p className="text-slate-500 text-sm flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-white text-xs font-bold uppercase ${activeTab === 'paid' ? 'bg-green-500' : (activeTab === 'partial' ? 'bg-orange-500' : 'bg-red-500')
                                            }`}>
                                            {activeTab === 'paid' ? 'Client (Historique)' : 'Client Débiteur'}
                                        </span>
                                        <span>{selectedClient.email}</span>
                                    </p>
                                </div>
                                <div className="text-right flex flex-col items-end gap-2">
                                    {activeTab !== 'paid' && (
                                        <div>
                                            <div className="text-sm text-slate-500">Reste à payer (Total)</div>
                                            <div className="text-3xl font-bold text-red-500">{formatCurrency(totalDue)}</div>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => window.print()}
                                        className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors print:hidden"
                                    >
                                        <Printer size={14} />
                                        Imprimer
                                    </button>
                                </div>
                            </div>

                            {/* Invoices List */}
                            <div className="flex-1 min-h-0 overflow-y-auto mt-4">
                                <h3 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                                    Factures : {activeTab.toUpperCase()}
                                    <span className="text-xs bg-slate-200 text-slate-600 px-2 rounded-full">{clientInvoices.length}</span>
                                </h3>
                                <div className="space-y-3">
                                    {clientInvoices.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 italic">
                                            Aucune facture dans cette catégorie.
                                        </div>
                                    ) : (
                                        clientInvoices.map(inv => (
                                            <GlassCard key={inv.id} className="p-4 flex items-center justify-between group hover:border-primary/20 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${inv.payment_status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
                                                        {inv.payment_status === 'paid' ? <CheckCircle size={20} /> : <DollarSign size={20} />}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800">{inv.reference}</div>
                                                        <div className="text-xs text-slate-400 flex items-center gap-1">
                                                            <Calendar size={10} />
                                                            {new Date(inv.created_at).toLocaleDateString()}
                                                            <span className="mx-1">•</span>
                                                            <span className="uppercase text-[10px] font-bold">
                                                                {inv.type === 'proforma' ? 'Proforma' : 'Facture'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-slate-800">{formatCurrency(inv.total_ttc)}</div>
                                                    {inv.payment_status !== 'paid' && (
                                                        <div className="text-xs text-red-500 font-medium">
                                                            Reste: {formatCurrency(inv.remaining_amount)}
                                                        </div>
                                                    )}
                                                </div>
                                            </GlassCard>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Payment Form (Only for Unpaid/Partial) */}
                            {activeTab !== 'paid' && (
                                <GlassCard className="p-6 border-t border-white/20 mt-4">
                                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                        <DollarSign className="text-primary" />
                                        Enregistrer un règlement
                                    </h3>
                                    <form onSubmit={handlePayment} className="flex gap-4 items-end">
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-semibold text-slate-600">Montant reçu</label>
                                            <input
                                                type="number"
                                                value={amount}
                                                onChange={e => setAmount(e.target.value)}
                                                className="w-full h-12 rounded-xl border-slate-200 px-4 font-bold text-lg"
                                                placeholder="0.00"
                                                max={totalDue}
                                            />
                                        </div>
                                        <div className="w-48 space-y-1">
                                            <label className="text-xs font-semibold text-slate-600">Mode</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={e => setPaymentMethod(e.target.value)}
                                                className="w-full h-12 rounded-xl border-slate-200 px-2 bg-white"
                                            >
                                                <option value="cash">Espèces</option>
                                                <option value="cheque">Chèque</option>
                                                <option value="wave">Wave</option>
                                                <option value="orange_money">Orange Money</option>
                                                <option value="mtn_money">MTN Money</option>
                                                <option value="moov_money">Moov Money</option>
                                            </select>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <label className="text-xs font-semibold text-slate-600">
                                                {paymentMethod === 'cheque' ? 'Numéro de Chèque' : 'Référence (Optionnel)'}
                                            </label>
                                            <input
                                                type="text"
                                                value={reference}
                                                onChange={e => setReference(e.target.value)}
                                                className="w-full h-12 rounded-xl border-slate-200 px-4"
                                                placeholder={paymentMethod === 'cheque' ? "Ex: 1234567" : "Ex: Transaction..."}
                                                required={paymentMethod === 'cheque'}
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={processing || !amount}
                                            className="h-12 px-8 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition disabled:opacity-50"
                                        >
                                            {processing ? '...' : 'Valider'}
                                        </button>
                                    </form>
                                </GlassCard>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            Sélectionnez un client à gauche pour voir les factures {activeTab === 'paid' ? 'payées' : (activeTab === 'partial' ? 'partiellement payées' : 'impayées')}.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Recouvrement;
