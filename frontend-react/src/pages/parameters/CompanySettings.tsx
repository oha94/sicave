import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Save, Building, Loader2 } from 'lucide-react';
import api from '../../services/api';

const CompanySettings: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        company_name: '',
        company_logo: '',
        company_ncc: '',
        company_tax_regime: '',
        company_tax_center: '',
        company_rccm: '',
        company_address: '',
        company_phone: '',
        company_email: '',
        company_slogan: 'Toujours là pour votre bonheur',
        company_bank: ''
    });

    useEffect(() => {
        api.getSettings().then(data => {
            setSettings(prev => ({ ...prev, ...data }));
            if (data.company_logo) {
                setLogoPreview(`http://localhost:8000${data.company_logo}`);
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.updateSettings(settings);

            if (logoFile) {
                const formData = new FormData();
                formData.append('logo', logoFile);
                await api.uploadLogo(formData);
            }

            alert("Paramètres enregistrés avec succès !");
        } catch {
            alert("Erreur lors de l'enregistrement.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Chargement...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-white/50 rounded-xl">
                    <Building className="text-primary" size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Paramètres Entreprise</h2>
                    <p className="text-slate-500">Informations affichées sur les factures et documents</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <GlassCard className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Identité Visuelle</h3>
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden relative group">
                                    {logoPreview ? (
                                        <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-xs text-slate-400 text-center px-2">Aucun logo</span>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Logo de l'entreprise</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoChange}
                                        className="block w-full text-sm text-slate-500
                                            file:mr-4 file:py-2 file:px-4
                                            file:rounded-full file:border-0
                                            file:text-sm file:font-semibold
                                            file:bg-violet-50 file:text-violet-700
                                            hover:file:bg-violet-100
                                        "
                                    />
                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG ou SVG. Max 2MB.</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Identité</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Raison Sociale</label>
                            <input name="company_name" value={settings.company_name} onChange={handleChange} className="input-glass w-full" placeholder="Ex: ETS SENE SARL" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Adresse</label>
                            <input name="company_address" value={settings.company_address} onChange={handleChange} className="input-glass w-full" placeholder="BP 1282 Yamoussoukro" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Téléphone</label>
                            <input name="company_phone" value={settings.company_phone} onChange={handleChange} className="input-glass w-full" placeholder="0707891726" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Email</label>
                            <input name="company_email" value={settings.company_email} onChange={handleChange} className="input-glass w-full" placeholder="infos@etssene.com" />
                        </div>

                        <div className="col-span-2 pt-4">
                            <h3 className="text-lg font-bold text-slate-700 mb-4 border-b border-slate-100 pb-2">Fiscalité & Légal</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">NCC</label>
                            <input name="company_ncc" value={settings.company_ncc} onChange={handleChange} className="input-glass w-full" placeholder="2402145M" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Régime d'imposition</label>
                            <input name="company_tax_regime" value={settings.company_tax_regime} onChange={handleChange} className="input-glass w-full" placeholder="RSI / Réel Normal" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Centre des Impôts</label>
                            <input name="company_tax_center" value={settings.company_tax_center} onChange={handleChange} className="input-glass w-full" placeholder="956 Impôts de Yamoussoukro" />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">RCCM</label>
                            <input name="company_rccm" value={settings.company_rccm} onChange={handleChange} className="input-glass w-full" placeholder="CI-TDI-2024-B-349" />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Références Bancaires</label>
                            <input name="company_bank" value={settings.company_bank} onChange={handleChange} className="input-glass w-full" placeholder="Banque: X, RIB: Y" />
                        </div>

                        <div className="col-span-2 space-y-2">
                            <label className="text-sm font-medium text-slate-700">Slogan / Message commercial</label>
                            <input name="company_slogan" value={settings.company_slogan} onChange={handleChange} className="input-glass w-full" placeholder="Toujours là pour votre bonheur" />
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end">
                        <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 px-8">
                            {submitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                            Enregistrer
                        </button>
                    </div>
                </GlassCard>
            </form>
        </div>
    );
};

export default CompanySettings;
