import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { AlertTriangle, Lock } from 'lucide-react';
import { useWorkDay } from '../../context/WorkDayContext';

const ClotureJour: React.FC = () => {
    const { workDay, closeDay } = useWorkDay();
    const [loading, setLoading] = useState(false);

    // We could fetch a summary endpoint here if backend supports it
    // For now, simple close button action

    const handleClose = async () => {
        if (!window.confirm("Êtes-vous sûr de vouloir clôturer la journée ? Cette action est irréversible.")) return;

        setLoading(true);
        try {
            await closeDay();
            alert("Journée clôturée avec succès.");
        } catch (e: any) {
            console.error(e);
            alert("Erreur lors de la clôture : " + (e.response?.data?.message || e.message));
        } finally {
            setLoading(false);
        }
    };

    if (!workDay) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-slate-500">
                <Lock size={48} className="mb-4 text-slate-300" />
                <h2 className="text-xl font-bold">Aucune journée ouverte</h2>
                <p>Vous devez ouvrir une nouvelle journée pour commencer.</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800">Clôture de Journée</h2>
                <p className="text-slate-500">Validation et fermeture de la journée comptable</p>
            </div>

            <GlassCard className="p-8 border-l-4 border-l-blue-600">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <div className="text-sm text-slate-500 uppercase font-bold">Journée Active</div>
                        <div className="text-3xl font-bold text-blue-600">
                            {new Date(workDay.date).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">
                        Ouverte
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl text-sm text-slate-600 mb-6">
                    <p className="flex items-start gap-2">
                        <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
                        <span>
                            Assurez-vous d'avoir effectué votre <strong>Versement</strong> avant de clôturer.
                            Une fois clôturée, aucune modification (vente, encaissement, décaissement) ne sera possible sur cette date.
                        </span>
                    </p>
                </div>

                <button
                    onClick={handleClose}
                    disabled={loading}
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-slate-900/20 transition-all flex items-center justify-center gap-2"
                >
                    {loading ? 'Traitement...' : <>
                        <Lock size={20} /> Clôturer la Journée
                    </>}
                </button>
            </GlassCard>
        </div>
    );
};

export default ClotureJour;
