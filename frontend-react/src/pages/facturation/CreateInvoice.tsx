import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Plus, Trash2, ArrowLeft, Save, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import CreateClientModal from '../../components/facturation/CreateClientModal';
import { useWarehouse } from '../../context/WarehouseContext';

const CreateInvoice: React.FC = () => {
    const navigate = useNavigate();
    const { selectedWarehouse } = useWarehouse();

    const [clients, setClients] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    // Form State
    const [formData, setFormData] = useState({
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        type: 'invoice',
        payment_method: 'cash'
    });

    const [lines, setLines] = useState<any[]>([
        { product_id: '', quantity: 1, unit_price: 0, total: 0 }
    ]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [clientsRes, productsRes] = await Promise.all([
                api.getClients(),
                api.getProducts() // This returns all products, might be heavy. For now ok.
            ]);
            setClients(clientsRes);
            setProducts(productsRes);
        } catch (error) {
            console.error("Error loading data", error);
        }
    };

    const addLine = () => {
        setLines([...lines, { product_id: '', quantity: 1, unit_price: 0, total: 0 }]);
    };

    const removeLine = (index: number) => {
        setLines(lines.filter((_, i) => i !== index));
    };

    const updateLine = (index: number, field: string, value: any) => {
        const newLines = [...lines];
        const line = { ...newLines[index], [field]: value };

        if (field === 'product_id') {
            const product = products.find(p => p.id === parseInt(value));
            if (product) {
                line.unit_price = product.selling_price;
            }
        }

        line.total = line.quantity * line.unit_price;
        newLines[index] = line;
        setLines(newLines);
    };

    const getTotal = () => lines.reduce((acc, line) => acc + line.total, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedWarehouse) return alert("Veuillez sélectionner un entrepot");

        setIsSubmitting(true);
        try {
            await api.createInvoice({
                warehouse_id: selectedWarehouse.id,
                client_id: formData.client_id || null, // API handles null as Comptoir? Or ID required?
                type: formData.type, // 'invoice' or 'proforma'
                lines: lines.map(l => ({
                    product_id: l.product_id,
                    quantity: l.quantity,
                    unit_price: l.unit_price
                })),
                payment_method: formData.payment_method
            });
            alert("Facture créée avec succès");
            navigate('/facturation/invoices');
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/50 rounded-lg text-slate-600 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Nouvelle Facture</h2>
                    <p className="text-slate-500">Création manuelle d'une facture client</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <GlassCard className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Client</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select
                                        className="input-glass w-full pl-10 appearance-none"
                                        value={formData.client_id}
                                        onChange={e => setFormData({ ...formData, client_id: e.target.value })}
                                    >
                                        <option value="">-- Client Comptoir --</option>
                                        <optgroup label="Clients Enregistrés">
                                            {clients.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.nom} {c.type === 'entreprise' ? '(Entreprise)' : ''}
                                                </option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsClientModalOpen(true)}
                                    className="p-3 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-colors"
                                    title="Nouveau Client"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Type de document</label>
                            <select
                                className="input-glass w-full"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="invoice">Facture Normalisée</option>
                                <option value="proforma">Facture Proforma</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Date</label>
                            <input
                                type="date"
                                className="input-glass w-full"
                                value={formData.date}
                                onChange={e => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Paiement</label>
                            <select
                                className="input-glass w-full"
                                value={formData.payment_method}
                                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                            >
                                <option value="cash">Espèces</option>
                                <option value="mobile-money">Mobile Money</option>
                                <option value="check">Chèque</option>
                                <option value="transfer">Virement</option>
                            </select>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <h3 className="font-bold text-lg text-slate-700 mb-4">Lignes de facture</h3>
                    <div className="space-y-4">
                        {lines.map((line, index) => (
                            <div key={index} className="flex gap-4 items-end bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                <div className="flex-1 space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Produit</label>
                                    <select
                                        required
                                        className="input-glass w-full bg-white"
                                        value={line.product_id}
                                        onChange={e => updateLine(index, 'product_id', e.target.value)}
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {products.map(p => {
                                            const stock = p.warehouses?.find((w: any) => w.id == selectedWarehouse?.id)?.stock || 0;
                                            return (
                                                <option key={p.id} value={p.id}>{p.designation} (Stock: {stock})</option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="w-24 space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Qté</label>
                                    <input
                                        type="number" min="1" required
                                        className="input-glass w-full text-center bg-white"
                                        value={line.quantity}
                                        onChange={e => updateLine(index, 'quantity', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="w-32 space-y-1">
                                    <label className="text-xs font-medium text-slate-500">Prix U.</label>
                                    <input
                                        type="number" min="0" required
                                        className="input-glass w-full text-right bg-white"
                                        value={line.unit_price}
                                        onChange={e => updateLine(index, 'unit_price', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div className="w-32 space-y-1 text-right">
                                    <label className="text-xs font-medium text-slate-500">Total</label>
                                    <div className="py-2 font-bold text-slate-700">
                                        {line.total.toLocaleString()} F
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeLine(index)}
                                    className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors mb-0.5"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addLine}
                        className="mt-4 flex items-center gap-2 text-primary font-medium px-4 py-2 hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <Plus size={18} /> Ajouter une ligne
                    </button>

                    <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-lg font-bold text-primary">
                                <span>Total TTC</span>
                                <span>{getTotal().toLocaleString()} F</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="btn-secondary px-6"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="btn-primary px-8 flex items-center gap-2 shadow-lg shadow-primary/20"
                    >
                        <Save size={18} />
                        {isSubmitting ? 'Enregistrement...' : 'Enregistrer Facture'}
                    </button>
                </div>
            </form >

            <CreateClientModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSuccess={(newClient) => {
                    setClients([...clients, newClient]);
                    setFormData({ ...formData, client_id: newClient.id });
                }}
            />
        </div>
    );
};

export default CreateInvoice;
