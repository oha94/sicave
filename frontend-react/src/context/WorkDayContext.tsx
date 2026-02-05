import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

interface WorkDay {
    id: number;
    date: string;
    status: 'open' | 'closed';
}

interface WorkDayContextType {
    workDay: WorkDay | null;
    loading: boolean;
    checkStatus: () => Promise<void>;
    openDay: (date: string) => Promise<void>;
    closeDay: () => Promise<void>;
    mismatchData: any;
    dismissMismatch: () => void;
}

const WorkDayContext = createContext<WorkDayContextType>({} as WorkDayContextType);

// Add API methods for WorkDay
// Note: These should ideally be in api.ts, but for speed we inject them or call generic get
// We updated api.ts? No, let's update api.ts instead of monkey patching.
// For now, assume api.ts has these or we use api.get/post directly here.

export const WorkDayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [workDay, setWorkDay] = useState<WorkDay | null>(null);
    const [loading, setLoading] = useState(true);
    const [mismatchData, setMismatchData] = useState<any>(null);

    const getWarehouseId = () => localStorage.getItem('selected_warehouse_id');

    const checkStatus = async () => {
        setLoading(true);
        try {
            const warehouseId = getWarehouseId();
            if (!warehouseId) {
                // If no warehouse selected, we can't check status properly or we fallback.
                // Or wait?
                setLoading(false);
                return;
            }
            const res = await api.get('/work-days/check', { params: { warehouse_id: warehouseId } });
            const data = res.data;

            if (data.status === 'ok') {
                setWorkDay(data.work_day);
                setMismatchData(null);
            } else if (data.status === 'mismatch') {
                setWorkDay(data.work_day);
                setMismatchData(data);
            } else {
                setWorkDay(null);
                setMismatchData(data); // e.g. status: no_day_open
            }
        } catch (e) {
            console.error("WorkDay Check Failed", e);
        } finally {
            setLoading(false);
        }
    };

    const openDay = async (date: string) => {
        const warehouseId = getWarehouseId();
        const res = await api.post('/work-days/open', { date, warehouse_id: warehouseId });
        setWorkDay(res.data.work_day);
        setMismatchData(null);
    };

    const closeDay = async () => {
        const warehouseId = getWarehouseId();
        await api.post('/work-days/close', { warehouse_id: warehouseId });
        setWorkDay(null);
        checkStatus();
    };

    useEffect(() => {
        if (authLoading) return;
        if (isAuthenticated) {
            checkStatus();
        } else {
            setLoading(false);
        }
    }, [isAuthenticated, authLoading]);

    const dismissMismatch = () => setMismatchData(null);

    return (
        <WorkDayContext.Provider value={{ workDay, loading, checkStatus, openDay, closeDay, mismatchData, dismissMismatch }}>
            {children}
        </WorkDayContext.Provider>
    );
};

export const useWorkDay = () => useContext(WorkDayContext);
