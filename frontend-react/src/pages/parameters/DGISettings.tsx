import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Lock, ShieldCheck, Save, Eye, EyeOff, Server, AlertCircle, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const DGISettings: React.FC = () => {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [challengeCode, setChallengeCode] = useState('');
    const [inputCode, setInputCode] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const [settings, setSettings] = useState({
        dgi_environment: 'test',
        dgi_base_url: 'https://api.dgi.ci/test',
        dgi_login: '',
        dgi_password: '',
        dgi_api_token: '',
    });

    const [showApiPassword, setShowApiPassword] = useState(false);

    // Generate random code on mount
    useEffect(() => {
        generateNewChallenge();
    }, []);

    useEffect(() => {
        if (isUnlocked) {
            loadSettings();
        }
    }, [isUnlocked]);

    const generateNewChallenge = () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setChallengeCode(code);
        setInputCode('');
        setError('');
    };

    const loadSettings = async () => {
        try {
            const data = await api.getSettings();
            setSettings({
                dgi_environment: data.dgi_environment || 'test',
                dgi_base_url: data.dgi_base_url || 'https://api.dgi.ci/test',
                dgi_ncc: data.dgi_ncc || '',
                dgi_login: data.dgi_login || '',
                dgi_password: data.dgi_password || '',
                dgi_api_token: data.dgi_api_token || '',
            });
        } catch (err) {
            console.error("Failed to load settings");
        }
    };

    const handleUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputCode === challengeCode) {
            setIsUnlocked(true);
        } else {
            setError('Code incorrect. Nouveau code généré.');
            generateNewChallenge();
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.updateSettings(settings);
            alert("Configuration DGI mise à jour avec succès.");
        } catch (err) {
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setSaving(false);
        }
    };

    if (!isUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                    <Lock size={32} className="text-slate-400" />
                </div>

                <GlassCard className="max-w-md w-full p-8 text-center space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Configuration DGI Sécurisée</h2>
                        <p className="text-slate-500 text-sm mt-2">
                            Veuillez recopier le code ci-dessous pour accéder à la configuration.
                        </p>
                    </div>

                    <div className="py-6 bg-slate-100 rounded-xl relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <div className="text-4xl font-mono font-bold text-slate-700 tracking-[0.5em] text-center select-none">
                            {challengeCode}
                        </div>
                    </div>

                    <form onSubmit={handleUnlock} className="space-y-4">
                        <div className="relative">
                            <input
                                type="text"
                                className="input-glass w-full text-center tracking-widest text-xl"
                                placeholder="Recopier le code"
                                value={inputCode}
                                onChange={(e) => setInputCode(e.target.value)}
                                autoFocus
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            type="submit"
                            disabled={!inputCode}
                            className="btn-primary w-full py-3"
                        >
                            Déverrouiller
                        </button>

                        <button
                            type="button"
                            onClick={generateNewChallenge}
                            className="text-sm text-slate-400 hover:text-primary underline"
                        >
                            Générer un autre code
                        </button>
                    </form>
                </GlassCard>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Paramètres API DGI</h2>
                    <p className="text-slate-500">Configuration de l'interfaçage avec le système fiscal.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                    <ShieldCheck size={14} />
                    Accès Autorisé
                </div>
            </div>

            <GlassCard className="p-6">
                <form onSubmit={handleSave} className="space-y-6">

                    {/* Environment Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="label mb-2">Environnement</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, dgi_environment: 'test' })}
                                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${settings.dgi_environment === 'test'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                        }`}
                                >
                                    <AlertCircle size={20} />
                                    <span className="font-bold">Test / Sandbox</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSettings({ ...settings, dgi_environment: 'prod' })}
                                    className={`p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${settings.dgi_environment === 'prod'
                                        ? 'border-red-500 bg-red-50 text-red-700'
                                        : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                                        }`}
                                >
                                    <CheckCircle size={20} />
                                    <span className="font-bold">Production</span>
                                </button>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="label">URL de l'API</label>
                            <div className="relative">
                                <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="url"
                                    required
                                    className="input-glass w-full pl-10"
                                    value={settings.dgi_base_url}
                                    onChange={(e) => setSettings({ ...settings, dgi_base_url: e.target.value })}
                                    placeholder="ex: https://api.dgi.ci/v1"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Identifiant (Login)</label>
                            <input
                                type="text"
                                className="input-glass w-full"
                                value={settings.dgi_login}
                                onChange={(e) => setSettings({ ...settings, dgi_login: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="label">Mot de passe API</label>
                            <div className="relative">
                                <input
                                    type={showApiPassword ? "text" : "password"}
                                    className="input-glass w-full pr-10"
                                    value={settings.dgi_password}
                                    onChange={(e) => setSettings({ ...settings, dgi_password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiPassword(!showApiPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showApiPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="label">Token API (Bearer)</label>
                            <textarea
                                className="input-glass w-full h-24 font-mono text-sm"
                                value={settings.dgi_api_token}
                                onChange={(e) => setSettings({ ...settings, dgi_api_token: e.target.value })}
                                placeholder="Insérer le token ici..."
                            />
                        </div>

                    </div>

                    <div className="pt-4 flex justify-end border-t border-slate-100">
                        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
                            <Save size={18} />
                            {saving ? "Sauvegarde..." : "Enregistrer la Configuration"}
                        </button>
                    </div>

                </form>
            </GlassCard>
        </div>
    );
};

export default DGISettings;
