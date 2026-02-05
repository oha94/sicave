import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Save, AlertTriangle, CheckCircle, History, Calculator } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/format';

const Versement: React.FC = () => {
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);

    // Form State (Blind Count)
    const [counts, setCounts] = useState({
        'Espèces': '',
        'Wave': '',
        'Orange Money': '',
        'MTN Money': '',
        'Moov Money': '',
        'Chèque': '',
        'Virement': '',
        'CB': ''
    });

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const data = await api.getCashCounts();
            setHistory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleChange = (method: string, value: string) => {
        setCounts(prev => ({ ...prev, [method]: value }));
    };

    const calculateTotalDeclared = () => {
        return Object.values(counts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!window.confirm("Confirmer le versement ? Cette action est irréversible.")) return;

        setSubmitting(true);
        try {
            const totalDeclared = calculateTotalDeclared();
            // Transform counts to key-value with numbers
            const details: any = {};
            Object.entries(counts).forEach(([k, v]) => {
                const val = parseFloat(v);
                if (val > 0) details[k] = val;
            });

            await api.createCashCount({
                date: date,
                total_declared: totalDeclared,
                details: details,
                notes: "Versement Caissier"
            });

            alert("Versement enregistré avec succès !");
            setCounts({
                'Espèces': '', 'Wave': '', 'Orange Money': '', 'MTN Money': '',
                'Moov Money': '', 'Chèque': '', 'Virement': '', 'CB': ''
            });
            loadHistory();
        } catch (error) {
            console.error(error);
            alert("Erreur lors du versement.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Versement</h2>
                    <p className="text-slate-500">Déclaration de fin de journée</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Input Form */}
                <GlassCard className="p-6 border-l-4 border-l-primary">
                    <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Calculator size={20} className="text-primary" /> Saisie des fonds
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg flex items-center gap-3 text-blue-700 text-sm mb-4">
                            <AlertTriangle size={20} />
                            <div>
                                <span className="font-bold">Attention :</span> Saisissez les montants réels en votre possession.
                                Le système calculera automatiquement les écarts.
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {Object.keys(counts).map(method => (
                                <div key={method} className="space-y-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase">{method}</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="input-glass w-full font-medium"
                                        value={(counts as any)[method]}
                                        onChange={e => handleChange(method, e.target.value)}
                                        min="0"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-100 mt-4 flex justify-between items-center">
                            <div className="text-right">
                                <div className="text-xs text-slate-500 uppercase font-bold">Total Déclaré</div>
                                <div className="text-2xl font-bold text-slate-800">
                                    {formatCurrency(calculateTotalDeclared())}
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
                            >
                                {submitting ? 'Enregistrement...' : <>
                                    <CheckCircle size={20} /> Valider le Versement
                                </>}
                            </button>
                        </div>
                    </form>
                </GlassCard>

                {/* History Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                        <History size={20} className="text-slate-400" /> Historique Récent
                    </h3>

                    {loadingHistory ? (
                        <div className="text-center py-8 text-slate-400">Chargement...</div>
                    ) : history.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 bg-white/50 rounded-xl border border-white/60">
                            Aucun versement enregistré.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map(item => (
                                <GlassCard key={item.id} className="p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-slate-700">
                                                {new Date(item.date).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                Par {item.user?.name || 'Inconnu'}
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-bold ${Number(item.gap) === 0 ? 'bg-green-100 text-green-700' :
                                                Number(item.gap) > 0 ? 'bg-orange-100 text-orange-700' : // Surplus
                                                    'bg-red-100 text-red-700' // Manquant
                                            }`}>
                                            Ecart: {Number(item.gap) > 0 ? '+' : ''}{Number(item.gap).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t border-slate-100/50">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Attendu:</span>
                                            <span className="font-medium text-slate-700">{Number(item.total_expected).toLocaleString()} F</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Déclaré:</span>
                                            <span className="font-bold text-slate-800">{Number(item.total_declared).toLocaleString()} F</span>
                                        </div>
                                    </div>
                                </GlassCard>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Versement;
