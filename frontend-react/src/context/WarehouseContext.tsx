import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';
import type { Warehouse } from '../types';

interface WarehouseContextType {
    warehouses: Warehouse[];
    selectedWarehouse: Warehouse | null;
    setSelectedWarehouse: (warehouse: Warehouse) => void;
    loading: boolean;
}

const WarehouseContext = createContext<WarehouseContextType | undefined>(undefined);

export const WarehouseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [selectedWarehouse, setSelectedWarehouseState] = useState<Warehouse | null>(null);
    const [loading, setLoading] = useState(true);

    // Charger les entrepôts au démarrage
    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        const fetchWarehouses = async () => {
            try {
                const response = await api.get('/warehouses');
                setWarehouses(response.data);

                // Charger la sélection sauvegardée ou prendre le premier
                const savedId = localStorage.getItem('selected_warehouse_id');
                if (savedId) {
                    const saved = response.data.find((w: Warehouse) => w.id === savedId);
                    if (saved) {
                        setSelectedWarehouseState(saved);
                    } else if (response.data.length > 0) {
                        setSelectedWarehouseState(response.data[0]);
                    }
                } else if (response.data.length > 0) {
                    setSelectedWarehouseState(response.data[0]);
                }
            } catch (error) {
                console.error("Erreur chargement entrepôts", error);
            } finally {
                setLoading(false);
            }
        };

        fetchWarehouses();
    }, [isAuthenticated, authLoading]);

    const setSelectedWarehouse = (warehouse: Warehouse) => {
        setSelectedWarehouseState(warehouse);
        localStorage.setItem('selected_warehouse_id', warehouse.id);
    };

    return (
        <WarehouseContext.Provider value={{ warehouses, selectedWarehouse, setSelectedWarehouse, loading }}>
            {children}
        </WarehouseContext.Provider>
    );
};

export const useWarehouse = () => {
    const context = useContext(WarehouseContext);
    if (context === undefined) {
        throw new Error('useWarehouse must be used within a WarehouseProvider');
    }
    return context;
};
