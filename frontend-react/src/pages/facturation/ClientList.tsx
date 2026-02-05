import React, { useState, useEffect } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Users, Plus, Search, MapPin, Phone, Mail } from 'lucide-react';
import api from '../../services/api';

const ClientList: React.FC = () => {
    const [clients, setClients] = useState([]);

    useEffect(() => {
        api.get('/clients').then(res => setClients(res.data));
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Clients</h2>
                    <p className="text-slate-500">Répertoire clients</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <Plus size={18} /> Nouveau Client
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Empty State */}
                <div className="col-span-full py-12 text-center text-slate-400 bg-white/50 rounded-2xl border border-dashed border-slate-300">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Aucun client enregistré</p>
                </div>
            </div>
        </div>
    );
};

export default ClientList;
