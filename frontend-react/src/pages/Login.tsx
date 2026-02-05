import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { LogIn, Lock, User, Loader2 } from 'lucide-react';
import api from '../services/api';

const Login: React.FC = () => {
    const [pseudo, setPseudo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const { login } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.getSettings().then(data => {
            if (data.company_logo) {
                setLogoUrl(`http://localhost:8000${data.company_logo}`);
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login({ pseudo, password });
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Identifiants incorrects');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    {logoUrl ? (
                        <div className="flex justify-center mb-4">
                            <img src={logoUrl} alt="Company Logo" className="h-20 object-contain" />
                        </div>
                    ) : (
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">SICAVE</h1>
                    )}
                    <p className="text-slate-500 mt-2">Connectez-vous à votre espace</p>
                </div>

                <GlassCard className="p-8 backdrop-blur-xl bg-white/70 shadow-2xl border-white/50">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 ml-1">Pseudo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 placeholder:text-slate-400"
                                    placeholder="Admin"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 ml-1">Mot de passe</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-slate-800 placeholder:text-slate-400"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    <span>Se connecter</span>
                                </>
                            )}
                        </button>
                    </form>
                </GlassCard>

                <div className="text-center mt-6 text-sm text-slate-400">
                    &copy; {new Date().getFullYear()} SICAVE. Tous droits réservés.
                </div>
            </div>
        </div>
    );
};

export default Login;
