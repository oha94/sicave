import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { OfflineIndicator } from '../components/ui/OfflineIndicator';
import { WarehouseSelector } from '../components/ui/WarehouseSelector';
import { Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const MainLayout: React.FC = () => {
    const { user } = useAuth();
    return (
        <div className="flex min-h-screen bg-slate-50/50">
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col pl-20 lg:pl-64 transition-all duration-300">

                {/* Top Header */}
                <header className="h-20 flex items-center justify-between px-8 py-4 sticky top-0 z-40 bg-white/30 backdrop-blur-md border-b border-white/40">
                    <div className="w-96">
                        {/* Search Bar Removed */}
                    </div>

                    <div className="flex items-center gap-6">
                        <WarehouseSelector />
                        <OfflineIndicator />

                        <button className="relative p-2 text-slate-500 hover:text-primary transition-colors">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-400 rounded-full border border-white"></span>
                        </button>

                        <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
                            <div className="text-right hidden md:block">
                                <p className="text-sm font-semibold text-slate-700">{user?.name || 'Utilisateur'}</p>
                                <p className="text-xs text-slate-400 capitalize">{user?.role || 'Membre'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent-start to-accent-end border-2 border-white shadow-sm flex items-center justify-center text-white font-bold">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-8 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
