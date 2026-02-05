import React, { useState } from 'react';
import { X, Save, User, Building2, MapPin, Phone, Hash } from 'lucide-react';
import api from '../../services/api';

interface CreateClientModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (client: any) => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        nom: '',
        type: 'particulier',
        telephone: '',
        adresse: '',
        enc_ncc: '', // 'ncc' field
        rccm: '',
        email: ''
    });

    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = {
                ...formData,
                ncc: formData.enc_ncc // Mapping
            };
            const newClient = await api.createClient(data);
            onSuccess(newClient);
            onClose();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de la création du client.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative transform transition-all scale-100">
                <div className="p-4 bg-slate-900 text-white flex justify-between items-center shadow-md">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <User size={20} className="text-primary-foreground" />
                        <span className="tracking-wide">NOUVEAU CLIENT</span>
                    </h3>
                    <button onClick={onClose} className="text-white/70 hover:text-white hover:bg-white/10 p-1 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-white">
                    {/* Visual separation hint */}
                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2">Informations Client</div>

                    {/* Type Selector */}
                    <div className="flex gap-4 mb-4 p-1 bg-slate-100 rounded-xl">
                        <label className={`flex-1 p-3 border rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all ${formData.type === 'particulier' ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="type"
                                value="particulier"
                                checked={formData.type === 'particulier'}
                                onChange={() => setFormData({ ...formData, type: 'particulier' })}
                                className="hidden"
                            />
                            <User size={18} /> Particulier
                        </label>
                        <label className={`flex-1 p-3 border rounded-xl cursor-pointer flex items-center justify-center gap-2 transition-all ${formData.type === 'entreprise' ? 'border-primary bg-primary/5 text-primary font-bold shadow-sm' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                            <input
                                type="radio"
                                name="type"
                                value="entreprise"
                                checked={formData.type === 'entreprise'}
                                onChange={() => setFormData({ ...formData, type: 'entreprise' })}
                                className="hidden"
                            />
                            <Building2 size={18} /> Entreprise
                        </label>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nom / Raison Sociale <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    className="input-glass w-full pl-10"
                                    placeholder={formData.type === 'entreprise' ? "Ex: ETS SENE SARL" : "Ex: Jean Dupont"}
                                    value={formData.nom}
                                    onChange={e => setFormData({ ...formData, nom: e.target.value })}
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Téléphone</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        className="input-glass w-full pl-10"
                                        placeholder="01020304"
                                        value={formData.telephone}
                                        onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                                    />
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ville / Adresse</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        className="input-glass w-full pl-10"
                                        placeholder="Yamoussoukro"
                                        value={formData.adresse}
                                        onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                                    />
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                </div>
                            </div>
                        </div>

                        {/* Company Specifics */}
                        {formData.type === 'entreprise' && (
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NCC</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input-glass w-full pl-10"
                                            placeholder="N° Compte Contribuable"
                                            value={formData.enc_ncc}
                                            onChange={e => setFormData({ ...formData, enc_ncc: e.target.value })}
                                        />
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">RCCM</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="input-glass w-full pl-10"
                                            placeholder="N° Registre Commerce"
                                            value={formData.rccm}
                                            onChange={e => setFormData({ ...formData, rccm: e.target.value })}
                                        />
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg">Annuler</button>
                        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
                            <Save size={18} />
                            {loading ? 'Enregistrement...' : 'Enregistrer Client'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateClientModal;
