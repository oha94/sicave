import React, { useState, useEffect } from 'react';
import { GlassCard } from '../components/ui/GlassCard';
import apiService from '../services/api';
import { Printer, Filter, DollarSign, Users, FileText, TrendingDown, LayoutGrid, Calendar, ChevronDown, FileSpreadsheet, X, Store } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useLocation } from 'react-router-dom';
import { useWarehouse } from '../context/WarehouseContext';

const Documents: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const categoryParam = queryParams.get('category');
    const { warehouses } = useWarehouse();

    const [category, setCategory] = useState<'accounting' | 'stock' | 'audit'>('accounting');
    const [activeTab, setActiveTab] = useState('summary');
    const [dateRange, setDateRange] = useState({
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
    });
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any>(null);

    // Filters State
    const [users, setUsers] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedWarehouse, setSelectedWarehouse] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Initial Load
    useEffect(() => {
        const loadMetaData = async () => {
            try {
                const [usersRes, catsRes] = await Promise.all([
                    apiService.getUsers(),
                    apiService.getCategories()
                ]);
                setUsers(usersRes);
                setCategories(catsRes);
            } catch (err) {
                console.error("Error loading metadata", err);
            }
        };
        loadMetaData();
    }, []);

    // Sync Category with URL
    useEffect(() => {
        if (categoryParam) {
            setCategory(categoryParam as any);
        } else {
            setCategory('accounting');
        }
    }, [categoryParam]);

    // Reset tab when category changes
    useEffect(() => {
        if (category === 'accounting') setActiveTab('summary');
        else if (category === 'stock') setActiveTab('stock_movements');
        else if (category === 'audit') setActiveTab('audit_price');
        setData(null);
        // Reset filters too? Maybe keep them.
    }, [category]);

    const accountingTabs = [
        { id: 'summary', label: 'Synthèse', icon: LayoutGrid },
        { id: 'pos', label: 'Points de Vente', icon: Store },
        { id: 'journal', label: 'Journal Caisse', icon: FileText },
        { id: 'versements', label: 'Versements', icon: DollarSign },
        { id: 'expenses', label: 'Décaissements', icon: TrendingDown },
        { id: 'clients', label: 'Soldes Clients', icon: Users },
    ];

    const stockTabs = [
        { id: 'stock_movements', label: 'Sorties & Mouvements', icon: TrendingDown },
        { id: 'stock_value', label: 'Valeur', icon: DollarSign },
        { id: 'stock_dormant', label: 'Dormants', icon: Users },
        { id: 'stock_alerts', label: 'Alertes', icon: Filter },
        { id: 'stock_inventories', label: 'Inventaires', icon: LayoutGrid },
    ];
    // ... (omitted intermediate lines, will use separate replacement for view)


    const auditTabs = [
        { id: 'audit_price', label: 'Modifs Prix', icon: DollarSign },
        { id: 'audit_deletions', label: 'Suppressions', icon: TrendingDown },
        { id: 'audit_closures', label: 'Clôtures', icon: FileText },
    ];

    let currentTabs = accountingTabs;
    if (category === 'stock') currentTabs = stockTabs;
    if (category === 'audit') currentTabs = auditTabs;

    const fetchData = async () => {
        setLoading(true);
        try {
            let res;
            const params: any = {
                start_date: dateRange.start,
                end_date: dateRange.end,
                user_id: selectedUser || undefined,
                payment_method: selectedPayment || undefined,
                category_id: selectedCategory || undefined,
                warehouse_id: selectedWarehouse || undefined
            };

            // Accounting
            if (activeTab === 'summary') res = await apiService.getReportFinancialSummary(params);
            if (activeTab === 'pos') res = await apiService.getReportFinancialPointsOfSale(params);
            if (activeTab === 'journal') res = await apiService.getReportCashJournal(params);
            if (activeTab === 'versements') res = await apiService.getReportCashCounts(params);
            if (activeTab === 'expenses') res = await apiService.getReportExpenses(params);
            if (activeTab === 'clients') res = await apiService.getReportClientBalances();

            // Stock
            if (activeTab === 'stock_movements') res = await apiService.getReportStockMovements({ ...params, type: 'out' });
            if (activeTab === 'stock_value') res = await apiService.getReportStockValue();
            if (activeTab === 'stock_dormant') res = await apiService.getReportStockDormant(params);
            if (activeTab === 'stock_alerts') res = await apiService.getReportStockAlerts();
            if (activeTab === 'stock_inventories') res = await apiService.getReportStockInventories(params);


            // Audit
            if (activeTab === 'audit_price') res = await apiService.getReportAuditPriceChanges(params);
            if (activeTab === 'audit_deletions') res = await apiService.getReportAuditDeletions(params);
            if (activeTab === 'audit_closures') res = await apiService.getReportAuditClosures(params);

            setData(res?.data || res); // Handle if response is wrapper or direct data
        } catch (error) {
            console.error("Error fetching report data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, dateRange, selectedUser, selectedPayment, selectedCategory, selectedWarehouse]);

    const handlePrint = () => {
        window.print();
    };

    // Helper for periods
    const setPeriod = (type: 'today' | 'week' | 'month') => {
        const today = new Date();
        let start = today;
        let end = today;

        if (type === 'week') {
            start = startOfWeek(today, { weekStartsOn: 1 });
            end = endOfWeek(today, { weekStartsOn: 1 });
        }
        if (type === 'month') {
            start = startOfMonth(today);
            end = endOfMonth(today);
        }

        setDateRange({
            start: format(start, 'yyyy-MM-dd'),
            end: format(end, 'yyyy-MM-dd')
        });
    };

    const handleExport = () => {
        // Basic CSV Export Logic
        if (!data) return;

        let headers: string[] = [];
        let rows: any[] = [];

        // Simple heuristic for rows based on data structure
        // If data is array
        if (Array.isArray(data)) {
            rows = data;
        } else if (data.journal) { // Cash JournalWrapper
            rows = data.journal;
        } else if (data.products) { // Stock Value Wrapper
            rows = data.products;
        } else {
            // Unhandled structure or summary object
            alert("Export non disponible pour cette vue (structure complexe).");
            return;
        }

        if (rows.length > 0) {
            headers = Object.keys(rows[0]);
            const csvContent = [
                headers.join(','),
                ...rows.map((row: any) => headers.map((fieldName: string) => JSON.stringify(row[fieldName])).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `export_${activeTab}_${format(new Date(), 'yyyyMMdd')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            alert("Aucune donnée à exporter.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Documents & Rapports</h1>
                    <p className="text-slate-500 text-sm">
                        {category === 'accounting' && 'Suivi comptable et financier'}
                        {category === 'stock' && 'Gestion et valorisation du stock'}
                        {category === 'audit' && 'Journal des actions et sécurité'}
                    </p>
                </div>

                <div className="flex flex-col gap-3 w-full xl:w-auto">
                    {/* Main Toolbar */}
                    <div className="flex flex-col md:flex-row gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">

                        {/* Period Presets */}
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            <button onClick={() => setPeriod('today')} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Jour</button>
                            <button onClick={() => setPeriod('week')} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Semaine</button>
                            <button onClick={() => setPeriod('month')} className="px-3 py-1 text-xs font-bold text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all">Mois</button>
                        </div>

                        {/* Date Range */}
                        <div className="flex items-center gap-2 bg-slate-50 px-2 py-1.5 rounded-xl border border-slate-100">
                            <Calendar size={14} className="text-slate-400" />
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-transparent text-xs font-medium text-slate-600 outline-none w-24"
                            />
                            <span className="text-slate-300">➜</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-transparent text-xs font-medium text-slate-600 outline-none w-24"
                            />
                        </div>

                        {/* Toggle Filters */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${showFilters ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                        >
                            <Filter size={14} /> Filtres
                            <ChevronDown size={14} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>

                        <div className="h-4 w-px bg-slate-200 mx-1 self-center hidden md:block"></div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button onClick={handleExport} className="bg-green-50 hover:bg-green-100 text-green-700 p-2 rounded-xl transition-colors" title="Exporter CSV">
                                <FileSpreadsheet size={18} />
                            </button>
                            <button onClick={handlePrint} className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs font-bold shadow-lg shadow-slate-900/20 transition-colors">
                                <Printer size={14} /> Imprimer
                            </button>
                        </div>
                    </div>

                    {/* Extended Filters Row */}
                    {showFilters && (
                        <div className="bg-white/80 backdrop-blur p-3 rounded-2xl border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-top-2">
                            {/* User Filter */}
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Utilisateur</label>
                                <select
                                    className="input-glass w-full text-xs py-1.5"
                                    value={selectedUser}
                                    onChange={e => setSelectedUser(e.target.value)}
                                >
                                    <option value="">Tous les utilisateurs</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>

                            {/* Payment Method (Only for Accounting) */}
                            {category === 'accounting' && (
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Mode de Paiement</label>
                                    <select
                                        className="input-glass w-full text-xs py-1.5"
                                        value={selectedPayment}
                                        onChange={e => setSelectedPayment(e.target.value)}
                                    >
                                        <option value="">Tous les modes</option>
                                        <option value="ESPECES">Espèces</option>
                                        <option value="MOBILE_MONEY">Mobile Money</option>
                                        <option value="CHEQUE">Chèque</option>
                                        <option value="CARTE">Carte Bancaire</option>
                                        <option value="VIREMENT">Virement</option>
                                    </select>
                                </div>
                            )}

                            {/* Category & Warehouse (Only for Stock) */}
                            {category === 'stock' && (
                                <>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Catégorie</label>
                                        <select
                                            className="input-glass w-full text-xs py-1.5"
                                            value={selectedCategory}
                                            onChange={e => setSelectedCategory(e.target.value)}
                                        >
                                            <option value="">Toutes les catégories</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Entrepôt</label>
                                        <select
                                            className="input-glass w-full text-xs py-1.5"
                                            value={selectedWarehouse}
                                            onChange={e => setSelectedWarehouse(e.target.value)}
                                        >
                                            <option value="">Tous les entrepôts</option>
                                            {warehouses.map(w => <option key={w.id} value={w.id}>{w.nom}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedUser('');
                                        setSelectedPayment('');
                                        setSelectedCategory('');
                                        setSelectedWarehouse('');
                                    }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                                >
                                    <X size={12} /> Réinitialiser
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide">
                {currentTabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                                flex items-center gap-2 px-6 py-3 rounded-xl font-bold whitespace-nowrap transition-all
                                ${activeTab === tab.id
                                ? 'bg-white text-blue-600 shadow-md border border-blue-100'
                                : 'bg-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700'}
                            `}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                {loading ? (
                    <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
                ) : (
                    <>
                        {activeTab === 'summary' && data && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <GlassCard className="p-6 border-l-4 border-l-green-500">
                                    <div className="text-slate-500 font-bold uppercase text-xs mb-1">Total Ventes (TTC)</div>
                                    <div className="text-3xl font-bold text-slate-800">{formatCurrency(data.sales_ttc)}</div>
                                    <div className="text-xs text-slate-400 mt-2">Hors Taxe: {formatCurrency(data.sales_ht)}</div>
                                </GlassCard>
                                <GlassCard className="p-6 border-l-4 border-l-blue-500">
                                    <div className="text-slate-500 font-bold uppercase text-xs mb-1">Total Encaissé</div>
                                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(data.total_collected)}</div>
                                </GlassCard>
                                <GlassCard className="p-6 border-l-4 border-l-red-500">
                                    <div className="text-slate-500 font-bold uppercase text-xs mb-1">Total Dépenses</div>
                                    <div className="text-3xl font-bold text-red-600">{formatCurrency(data.total_expenses)}</div>
                                </GlassCard>
                                <GlassCard className="p-6 border-l-4 border-l-orange-500 col-span-full md:col-span-1">
                                    <div className="text-slate-500 font-bold uppercase text-xs mb-1">Solde Théorique</div>
                                    <div className="text-3xl font-bold text-orange-600">
                                        {formatCurrency(data.theoretical_balance)}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-2">
                                        (Encaissé - Dépensé)
                                    </div>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'pos' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Point de Vente</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4 text-center">Volume Ventes</th>
                                            <th className="p-4 text-right">Chiffre d'Affaires (TTC)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                                <td className="p-4">
                                                    <span className="px-2 py-1 rounded bg-slate-100 text-slate-500 text-xs font-medium uppercase">
                                                        {item.type === 'store' ? 'Magasin' : 'Entrepôt'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                        {item.sales_count}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-blue-600">{formatCurrency(item.total_sales)}</td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Aucune donnée de vente pour cette période</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}
                        {activeTab === 'journal' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Type</th>
                                            <th className="p-4">Mode</th>
                                            <th className="p-4">Opérateur</th>
                                            <th className="p-4 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.journal.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-slate-50/50">
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {item.type === 'in' ? 'Entrée' : 'Sortie'}
                                                    </span>
                                                </td>
                                                <td className="p-4">{item.method}</td>
                                                <td className="p-4">{item.operator}</td>
                                                <td className={`p-4 text-right font-bold ${item.type === 'in' ? 'text-green-600' : 'text-red-600'
                                                    }`}>
                                                    {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                                                </td>
                                            </tr>
                                        ))}
                                        {data.journal.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Aucune donnée</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'expenses' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Motif</th>
                                            <th className="p-4">Catégorie</th>
                                            <th className="p-4">Autorisé par</th>
                                            <th className="p-4 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                                <td className="p-4 font-medium">{item.reason}</td>
                                                <td className="p-4 text-slate-500">{item.type}</td>
                                                <td className="p-4 text-slate-500">{item.authorizer}</td>
                                                <td className="p-4 text-right font-bold text-red-600">-{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'clients' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Client</th>
                                            <th className="p-4">Téléphone</th>
                                            <th className="p-4 text-center">Factures Impayées</th>
                                            <th className="p-4 text-right">Reste à Payer</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold text-slate-800">{item.name}</td>
                                                <td className="p-4 text-slate-500">{item.phone}</td>
                                                <td className="p-4 text-center">
                                                    <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold">
                                                        {item.invoices_count}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right font-bold text-red-600">{formatCurrency(item.total_debt)}</td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && (
                                            <tr><td colSpan={4} className="p-8 text-center text-slate-400">Aucun client débiteur</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'stock_movements' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Produit</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4 text-right">Quantité</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                                <td className="p-4 font-bold">{item.product?.name}</td>
                                                <td className="p-4 text-slate-500 uppercase text-xs">{item.type}</td>
                                                <td className="p-4 text-right font-bold text-red-600">{item.quantity}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'stock_value' && data && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <GlassCard className="p-6 border-t-4 border-t-blue-500">
                                        <div className="text-slate-500 font-bold uppercase text-xs mb-1">Valeur Totale du Stock</div>
                                        <div className="text-3xl font-bold text-slate-800">{formatCurrency(data.total_value)}</div>
                                        <div className="text-sm text-slate-400 mt-2">{data.total_items} articles en stock</div>
                                    </GlassCard>
                                    <GlassCard className="p-6">
                                        <h3 className="font-bold text-slate-800 mb-4">Par Catégorie</h3>
                                        <div className="space-y-3">
                                            {data.by_category.map((cat: any) => (
                                                <div key={cat.name} className="flex justify-between items-center text-sm">
                                                    <div className="text-slate-600">{cat.name} <span className="text-slate-400">({cat.count})</span></div>
                                                    <div className="font-bold">{formatCurrency(cat.value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </GlassCard>
                                </div>

                                <h3 className="text-lg font-bold text-slate-800">Top 50 - Pyramide des Valeurs</h3>
                                <GlassCard className="overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                                <th className="p-4">Produit</th>
                                                <th className="p-4 text-right">Stock</th>
                                                <th className="p-4 text-right">P.U.</th>
                                                <th className="p-4 text-right">Valeur Totale</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {data.products.map((item: any) => (
                                                <tr key={item.id} className="hover:bg-slate-50/50">
                                                    <td className="p-4 font-medium">{item.name}</td>
                                                    <td className="p-4 text-right">{item.stock}</td>
                                                    <td className="p-4 text-right text-slate-500">{formatCurrency(item.price)}</td>
                                                    <td className="p-4 text-right font-bold text-blue-600">{formatCurrency(item.value)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'stock_alerts' && data && (
                            <GlassCard className="overflow-hidden border-red-200 border">
                                <div className="bg-red-50 p-4 font-bold text-red-700 flex items-center gap-2">
                                    <TrendingDown size={18} /> Articles en Rupture ou Seuil Critique
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Produit</th>
                                            <th className="p-4">Dépôt</th>
                                            <th className="p-4 text-right">Stock Actuel</th>
                                            <th className="p-4 text-right">Seuil Alerte</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-red-50/30">
                                                <td className="p-4 font-bold text-slate-800">{item.product}</td>
                                                <td className="p-4 text-slate-500">{item.warehouse}</td>
                                                <td className="p-4 text-right font-bold text-red-600">{item.current}</td>
                                                <td className="p-4 text-right text-slate-500">{item.alert}</td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-green-600">Aucune alerte ! Tout va bien.</td></tr>}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'stock_dormant' && data && (
                            <GlassCard className="overflow-hidden">
                                <div className="p-4 bg-slate-50 text-slate-500 text-sm">
                                    Produits sans aucune sortie sur la période sélectionnée.
                                </div>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Produit</th>
                                            <th className="p-4 text-right">Stock Actuel</th>
                                            <th className="p-4 text-right">Dernier Mouvement</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-medium">{item.name}</td>
                                                <td className="p-4 text-right font-bold">{item.stock}</td>
                                                <td className="p-4 text-right text-slate-500">
                                                    {item.last_movement ? format(new Date(item.last_movement), 'dd/MM/yyyy') : 'Jamais'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'stock_inventories' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Référence</th>
                                            <th className="p-4">Entrepôt</th>
                                            <th className="p-4">Créé par</th>
                                            <th className="p-4">Statut</th>
                                            <th className="p-4 text-right">Lignes</th>
                                            <th className="p-4 text-right">Ecart Valeur</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4">{format(new Date(item.date), 'dd/MM/yyyy HH:mm')}</td>
                                                <td className="p-4 font-bold">{item.reference}</td>
                                                <td className="p-4">{item.warehouse}</td>
                                                <td className="p-4">{item.user}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.status === 'validated' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                                                        }`}>
                                                        {item.status === 'validated' ? 'Validé' : 'Brouillon'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">{item.items_count}</td>
                                                <td className={`p-4 text-right font-bold ${item.total_gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(item.total_gap)}
                                                </td>
                                            </tr>
                                        ))}
                                        {data.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-slate-400">Aucun inventaire sur cette période</td></tr>}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}


                        {activeTab === 'versements' && data && (
                            <div className="space-y-4">
                                {data.map((item: any) => (
                                    <GlassCard key={item.id} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${item.percentage_gap === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                <DollarSign />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-800">Versement du {format(new Date(item.date), 'dd MMMM yyyy', { locale: fr })}</div>
                                                <div className="text-xs text-slate-500">Par {item.user?.name || 'Inconnu'}</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-8 text-sm">
                                            <div className="text-center">
                                                <div className="text-slate-400 text-xs uppercase">Attendu</div>
                                                <div className="font-bold">{formatCurrency(item.total_expected)}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-slate-400 text-xs uppercase">Déclaré</div>
                                                <div className="font-bold">{formatCurrency(item.total_declared)}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-slate-400 text-xs uppercase">Ecart</div>
                                                <div className={`font-bold ${item.gap < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(item.gap)}
                                                </div>
                                            </div>
                                        </div>
                                    </GlassCard>
                                ))}
                                {data.length === 0 && <div className="p-8 text-center text-slate-400">Aucun historique de versement</div>}
                            </div>
                        )}

                        {activeTab === 'audit_price' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Produit</th>
                                            <th className="p-4">Ancien Prix</th>
                                            <th className="p-4">Nouveau Prix</th>
                                            <th className="p-4 text-right">Utilisateur</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4">{format(new Date(item.date), 'dd/MM/yyyy HH:mm')}</td>
                                                <td className="p-4 font-bold">{item.product_name}</td>
                                                <td className="p-4 text-slate-500 line-through">{formatCurrency(item.old_price)}</td>
                                                <td className="p-4 font-bold text-blue-600">{formatCurrency(item.new_price)}</td>
                                                <td className="p-4 text-right">{item.user}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'audit_closures' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Date Journée</th>
                                            <th className="p-4">Ouverte par</th>
                                            <th className="p-4">Clôturée par</th>
                                            <th className="p-4">Heure Clôture</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4 font-bold">{format(new Date(item.date), 'dd/MM/yyyy')}</td>
                                                <td className="p-4">{item.opener?.name}</td>
                                                <td className="p-4">{item.closer?.name}</td>
                                                <td className="p-4 text-slate-500">{item.closed_at ? format(new Date(item.closed_at), 'HH:mm') : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}

                        {activeTab === 'audit_deletions' && data && (
                            <GlassCard className="overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                                            <th className="p-4">Date</th>
                                            <th className="p-4">Action</th>
                                            <th className="p-4">Description</th>
                                            <th className="p-4 text-right">Utilisateur</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm">
                                        {data.map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/50">
                                                <td className="p-4">{format(new Date(item.created_at), 'dd/MM/yyyy HH:mm')}</td>
                                                <td className="p-4 font-bold uppercase text-xs bg-red-100 text-red-700 w-min px-2 py-1 rounded">{item.action}</td>
                                                <td className="p-4">{item.description}</td>
                                                <td className="p-4 text-right">{item.user?.name || 'Système'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </GlassCard>
                        )}
                    </>
                )}
            </div>

            {/* Print CSS (Invisible normally) */}
            <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #root, #root * { visibility: visible; }
                        button, .no-print { display: none !important; }
                        .glass-card { box-shadow: none !important; border: 1px solid #ddd !important; }
                    }
                `}</style>

        </div>
    );
};

export default Documents;
