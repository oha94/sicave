import React, { useState, useEffect } from 'react';
import { stockService } from '../../services/stockService';
import { GlassCard } from '../../components/ui/GlassCard';
import { Save, ArrowLeft, PackageMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RETURN_REASONS = [
    'En voie de péremption',
    'Périmé',
    'Cassé / Endommagé',
    'Défaut de qualité',
    'Non conforme à la commande',
    'Erreur de livraison',
    'Emballage défectueux',
    'Volé',
    'Facturé non livré'
];

const CreateReturnNote: React.FC = () => {
    const navigate = useNavigate();
    const [receptions, setReceptions] = useState<any[]>([]);
    const [selectedReceptionId, setSelectedReceptionId] = useState('');
    const [selectedReception, setSelectedReception] = useState<any>(null);
    const [returnLines, setReturnLines] = useState<any[]>([]);
    const [comments, setComments] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Load validated receptions for selection
        // We might want to filter only those that can have returns?
        // For now list all. Maybe optimize search later.
        const loadReceptions = async () => {
            try {
                // Fetch recent receptions
                const data = await stockService.getReceptions({ per_page: 50 });
                setReceptions(data.data);
            } catch (error) {
                console.error("Error loading receptions", error);
            }
        };
        loadReceptions();
    }, []);

    useEffect(() => {
        if (!selectedReceptionId) {
            setSelectedReception(null);
            setReturnLines([]);
            return;
        }

        const loadDetails = async () => {
            try {
                const data = await stockService.getReception(selectedReceptionId);
                setSelectedReception(data);
                // Initialize return lines with 0 qty
                setReturnLines((data.lines || []).map((line: any) => ({
                    product_id: line.product_id,
                    product_name: line.product?.designation,
                    received_qty: line.quantity,
                    return_qty: 0,
                    reason: ''
                })));
            } catch (error) {
                console.error("Error loading reception details", error);
            }
        };
        loadDetails();
    }, [selectedReceptionId]);


    const handleLineChange = (index: number, field: string, value: any) => {
        const newLines = [...returnLines];
        newLines[index][field] = value;
        setReturnLines(newLines);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        // Filter lines with qty > 0
        const linesToSubmit = returnLines.filter(l => l.return_qty > 0);

        if (linesToSubmit.length === 0) {
            setMessage("Veuillez saisir au moins une quantité à retourner.");
            setLoading(false);
            return;
        }

        try {
            await stockService.createSupplierReturn({
                stock_reception_id: selectedReceptionId,
                comments,
                lines: linesToSubmit.map(l => ({
                    product_id: l.product_id,
                    quantity: Number(l.return_qty),
                    reason: l.reason || 'Retour standard'
                }))
            });
            setMessage("Bon de retour créé avec succès !");
            setTimeout(() => navigate('/stock/return-notes'), 1500);
        } catch (error: any) {
            console.error(error);
            setMessage(error.response?.data?.message || "Erreur lors de la création du retour.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-primary transition-colors mb-2">
                <ArrowLeft size={18} className="mr-1" /> Retour
            </button>

            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-white rounded-xl shadow-sm">
                    <PackageMinus className="text-amber-500" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Nouveau Bon de Retour</h2>
                    <p className="text-slate-500">Retourner des marchandises au fournisseur</p>
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-xl border ${message.includes('Erreur') || message.includes('Veuillez') ? 'bg-red-50 border-red-100 text-red-700' : 'bg-green-50 border-green-100 text-green-700'}`}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <GlassCard className="space-y-6">
                    <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2">Sélectionner le Bon de Livraison</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Bon de Livraison (Référence)</label>
                        <select
                            value={selectedReceptionId}
                            onChange={e => setSelectedReceptionId(e.target.value)}
                            className="input-glass w-full"
                        >
                            <option value="">-- Choisir un BL --</option>
                            {receptions.map(r => (
                                <option key={r.id} value={r.id}>
                                    {r.reference_externe || 'Sans Réf'} - {r.supplier?.nom} ({new Date(r.created_at).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedReception && (
                        <div className="bg-slate-50 p-4 rounded-lg flex gap-4 text-sm mt-2 border border-slate-100">
                            <div><span className="text-slate-500">Fournisseur :</span> <span className="font-medium">{selectedReception.supplier?.nom}</span></div>
                            <div><span className="text-slate-500">Date :</span> <span className="font-medium">{new Date(selectedReception.created_at).toLocaleDateString()}</span></div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-2">Commentaire (Optionnel)</label>
                        <textarea
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            className="input-glass w-full"
                            rows={2}
                            placeholder="Remarques supplémentaires..."
                        />
                    </div>
                </GlassCard>

                {selectedReception && (
                    <GlassCard className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <h3 className="text-lg font-semibold text-slate-700 border-b border-slate-100 pb-2">Produits à Retourner</h3>

                        <div className="space-y-4">
                            {returnLines.map((line, index) => (
                                <div key={index} className="grid grid-cols-12 gap-4 items-center p-3 bg-white/50 rounded-lg border border-slate-100">
                                    <div className="col-span-12 md:col-span-4">
                                        <div className="font-medium text-slate-700">{line.product_name}</div>
                                        <div className="text-xs text-slate-500">Reçu: {line.received_qty}</div>
                                    </div>
                                    <div className="col-span-6 md:col-span-3">
                                        <label className="text-xs text-slate-500 block mb-1">Qté Retour</label>
                                        <input
                                            type="number"
                                            value={line.return_qty}
                                            onChange={e => handleLineChange(index, 'return_qty', e.target.value)}
                                            className="input-glass w-full"
                                            min="0"
                                            max={line.received_qty}
                                            step="0.001"
                                        />
                                    </div>
                                    <div className="col-span-6 md:col-span-5">
                                        <label className="text-xs text-slate-500 block mb-1">Motif</label>
                                        <select
                                            value={line.reason}
                                            onChange={e => handleLineChange(index, 'reason', e.target.value)}
                                            className="input-glass w-full"
                                        >
                                            <option value="">Sélectionner un motif</option>
                                            {RETURN_REASONS.map(r => (
                                                <option key={r} value={r}>{r}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={loading || !selectedReceptionId}
                        className="btn-primary flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save size={20} />
                        {loading ? 'Création...' : 'Créer le Bon de Retour'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateReturnNote;
