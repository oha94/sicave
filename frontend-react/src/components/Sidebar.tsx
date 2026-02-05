import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PackagePlus, ClipboardList, Wine, LogOut, Receipt, Settings, ShoppingCart, ArrowLeft, Building2, User, Wallet, RotateCcw, TrendingDown, Sun, FileText, FolderOpen, Truck, Archive, Layers, AlertCircle, ArrowLeftRight, LayoutGrid, Database } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Sidebar: React.FC = () => {
    const location = useLocation();
    const pathname = location.pathname;
    const search = location.search;
    const { logout } = useAuth();
    const [expandedMenus, setExpandedMenus] = React.useState<string[]>([]);
    const [logoUrl, setLogoUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        api.getSettings().then(data => {
            if (data.company_logo) {
                setLogoUrl(`http://localhost:8000${data.company_logo}`);
            }
        }).catch(err => console.error("Error fetching logo:", err));
    }, []);

    // Determine Active Module based on URL path
    const getActiveModule = () => {
        if (pathname.startsWith('/stock')) return 'STOCK';
        if (pathname.startsWith('/facturation')) return 'FACTURATION';
        if (pathname.startsWith('/documents')) return 'DOCUMENTS';
        if (pathname.startsWith('/parametres')) return 'PARAMETRES';
        return null;
    };

    const activeModule = getActiveModule();

    const toggleMenu = (label: string) => {
        setExpandedMenus(prev =>
            prev.includes(label)
                ? prev.filter(item => item !== label)
                : [...prev, label]
        );
    };

    const stockMenuItems = [
        { path: '/stock/products/create', icon: PackagePlus, label: 'Article' },
        { path: '/stock/unpacking', icon: Archive, label: 'Déconditionnement' },
        { path: '/stock/orders', icon: ShoppingCart, label: 'Commande' },
        {
            label: 'Documents fournisseurs',
            icon: FolderOpen,
            children: [
                { path: '/stock/delivery-note', icon: FileText, label: 'Bon de livraison' },
                { path: '/stock/return-notes', icon: ArrowLeftRight, label: 'Bon de retour' },
                { path: '/stock/supplier-credit', icon: RotateCcw, label: 'Réponses fournisseurs' },
            ]
        },
        { path: '/stock/adjustment', icon: AlertCircle, label: 'Régularisation' },
        { path: '/stock/inventory', icon: ClipboardList, label: 'Inventaire' },
    ];

    const billingMenuItems = [
        { path: '/facturation/caisse', icon: ShoppingCart, label: 'Caisse' },
        { path: '/facturation/sales-history', icon: ClipboardList, label: 'Liste des ventes' },
        { path: '/facturation/recouvrement', icon: RotateCcw, label: 'Recouvrement' },
        { path: '/facturation/payments', icon: Receipt, label: 'Historique Paiements' },
        { path: '/facturation/invoice-list', icon: FileText, label: 'Factures' },
        { path: '/facturation/decaissement', icon: TrendingDown, label: 'Décaissement' },
        { path: '/facturation/versement', icon: Wallet, label: 'Versement' },
        { path: '/facturation/cloture-jour', icon: Sun, label: 'Clôture Jour' },
    ];

    const documentMenuItems = [
        {
            label: 'Documents & Rapports',
            icon: FolderOpen,
            children: [
                { path: '/documents?category=accounting', icon: LayoutGrid, label: 'Comptabilité' },
                { path: '/documents?category=stock', icon: Wine, label: 'Stock' },
                { path: '/documents?category=audit', icon: FileText, label: 'Audit' },
            ]
        },
    ];

    const settingsMenuItems = [
        { path: '/parametres', icon: Building2, label: 'Entrepôts & Magasins' },
        { path: '/parametres/categories', icon: Layers, label: 'Catégories' },
        { path: '/parametres/clients', icon: User, label: 'Clients' },
        { path: '/parametres/dgi', icon: FileText, label: 'Configuration DGI' },
        { path: '/parametres/suppliers', icon: Truck, label: 'Fournisseurs (Entrepôts)' },
        { path: '/parametres/shelves', icon: Archive, label: 'Rayons' },
        { path: '/parametres/users', icon: User, label: 'Utilisateurs' },
        { path: '/parametres/company', icon: Building2, label: 'Entreprise' },
    ];

    const isLinkActive = (path: string) => {
        if (path.includes('?')) {
            const [linkPath, linkSearch] = path.split('?');
            return pathname === linkPath && search.includes(linkSearch);
        }
        return pathname === path;
    };

    const renderMenuContent = () => {
        let items: any[] = [];
        switch (activeModule) {
            case 'STOCK':
                items = stockMenuItems;
                break;
            case 'FACTURATION':
                items = billingMenuItems;
                break;
            case 'DOCUMENTS':
                items = documentMenuItems;
                break;
            case 'PARAMETRES':
                items = settingsMenuItems;
                break;
            default:
                items = [];
        }

        if (items.length === 0) {
            return (
                <div className="p-4 text-center text-slate-400 text-sm opacity-60">
                    <p>Aucun menu disponible</p>
                </div>
            );
        }

        return items.map((item, index) => {
            // Logic for Leaf Items (No children)
            if (!item.children) {
                const isActive = isLinkActive(item.path);
                let activeClass = "bg-primary shadow-primary/25";
                let textHoverClass = "hover:text-primary";

                if (activeModule === 'FACTURATION') {
                    activeClass = "bg-blue-600 shadow-blue-500/25";
                    textHoverClass = "hover:text-blue-600";
                } else if (activeModule === 'DOCUMENTS') {
                    activeClass = "bg-orange-500 shadow-orange-500/25";
                    textHoverClass = "hover:text-orange-500";
                } else if (activeModule === 'PARAMETRES') {
                    activeClass = "bg-slate-600 shadow-slate-500/25";
                    textHoverClass = "hover:text-slate-600";
                }

                return (
                    <Link
                        key={item.path || index}
                        to={item.path}
                        className={cn(
                            "flex items-center p-3 rounded-xl transition-all duration-300 group",
                            isActive
                                ? `${activeClass} text-white shadow-lg translate-x-1`
                                : `text-slate-500 hover:bg-white/50 ${textHoverClass}`
                        )}
                    >
                        <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={cn(
                            "hidden lg:block ml-3 font-medium",
                            isActive ? "font-semibold" : ""
                        )}>
                            {item.label}
                        </span>
                    </Link>
                );
            }

            // Logic for Parent Items (With Children)
            const isExpanded = expandedMenus.includes(item.label) || activeModule === 'DOCUMENTS'; // Auto expand Documents
            const hasActiveChild = item.children.some((child: any) => isLinkActive(child.path));

            return (
                <div key={item.label} className="space-y-1">
                    <button
                        onClick={() => toggleMenu(item.label)}
                        className={cn(
                            "w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group text-slate-500 hover:bg-white/50 hover:text-primary text-left",
                            hasActiveChild ? "text-primary font-medium" : ""
                        )}
                    >
                        <div className="flex items-center">
                            <item.icon size={20} strokeWidth={hasActiveChild ? 2.5 : 2} />
                            <span className="hidden lg:block ml-3 font-medium">
                                {item.label}
                            </span>
                        </div>
                        <div className={cn("transition-transform duration-200", isExpanded ? "rotate-180" : "")}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                        </div>
                    </button>

                    {/* Submenu Items */}
                    {isExpanded && (
                        <div className="pl-4 space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {item.children.map((child: any) => {
                                const isChildActive = isLinkActive(child.path);
                                return (
                                    <Link
                                        key={child.path}
                                        to={child.path}
                                        className={cn(
                                            "flex items-center p-2.5 rounded-xl transition-all duration-300 text-sm",
                                            isChildActive
                                                ? "bg-primary/10 text-primary font-semibold translate-x-1"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                    >
                                        <child.icon size={16} className="mr-3" />
                                        <span>{child.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        });
    };

    return (
        <div className="w-20 lg:w-64 h-screen fixed left-0 top-0 glass-panel flex flex-col z-50 border-r border-white/40">
            {/* Logo Area */}
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/20">
                {logoUrl ? (
                    <div className="w-full flex items-center justify-center lg:justify-start overflow-hidden">
                        <img src={logoUrl} alt="Company Logo" className="h-10 object-contain max-w-[180px]" />
                    </div>
                ) : (
                    <>
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
                            <Wine className="text-white" size={20} />
                        </div>
                        <span className="hidden lg:block ml-3 font-bold text-xl text-primary tracking-tight">SICAVE</span>
                    </>
                )}
            </div>

            {/* Back to Home & Module Title */}
            <div className="p-4 border-b border-white/20 bg-slate-50/50">
                <Link to="/" className="flex items-center text-xs font-bold text-slate-500 hover:text-primary mb-3">
                    <ArrowLeft size={14} className="mr-1" /> ACCUEIL
                </Link>
                <div className="flex items-center gap-2">
                    {activeModule === 'STOCK' && <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg"><Wine size={16} /></div>}
                    {activeModule === 'FACTURATION' && <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg"><Receipt size={16} /></div>}
                    {activeModule === 'DOCUMENTS' && <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg"><FolderOpen size={16} /></div>}
                    {activeModule === 'PARAMETRES' && <div className="p-1.5 bg-slate-200 text-slate-700 rounded-lg"><Settings size={16} /></div>}

                    <span className="font-bold text-slate-700 text-sm">{activeModule || 'MODULE'}</span>
                </div>
            </div>

            {/* Navigation Content */}
            <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
                {renderMenuContent()}
            </nav>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-white/20">
                <button
                    onClick={logout}
                    className="flex items-center w-full p-3 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                >
                    <LogOut size={22} />
                    <span className="hidden lg:block ml-3 font-medium">Déconnexion</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
