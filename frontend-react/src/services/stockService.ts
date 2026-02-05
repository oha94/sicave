import api from './api';
import type { StockReception, Inventory } from '../types';

export const stockService = {
    // Réceptions
    createReception: async (data: any) => {
        const response = await api.post('/stock/receptions', data);
        return response.data;
    },

    validateReception: async (receptionId: string) => {
        const response = await api.post(`/stock/receptions/${receptionId}/validate`);
        return response.data;
    },

    getReception: async (receptionId: string) => {
        const response = await api.get<StockReception>(`/stock/receptions/${receptionId}`);
        return response.data;
    },

    getReceptions: async (params?: any) => {
        const response = await api.get('/stock/receptions', { params });
        return response.data;
    },

    // Inventaires
    createInventory: async (data: any) => {
        const response = await api.post('/inventory', data);
        return response.data;
    },

    updateInventoryLines: async (inventoryId: string, lines: any[]) => {
        const response = await api.put(`/inventory/${inventoryId}`, { lines });
        return response.data;
    },

    validateInventory: async (inventoryId: string) => {
        const response = await api.post(`/inventory/${inventoryId}/validate`);
        return response.data;
    },

    getInventory: async (inventoryId: string) => {
        const response = await api.get<Inventory>(`/inventory/${inventoryId}`);
        return response.data;
    },

    updateInventory: async (inventoryId: string, lines: any[]) => {
        const response = await api.put(`/inventory/${inventoryId}`, { lines });
        return response.data;
    },

    // Using validate endpoint to close it
    closeInventory: async (inventoryId: string) => {
        const response = await api.post(`/inventory/${inventoryId}/validate`);
        return response.data;
    },

    // Helpers
    getWarehouses: async () => {
        const response = await api.get('/warehouses');
        return response.data;
    },

    getSuppliers: async () => {
        const response = await api.get('/suppliers');
        return response.data;
    },

    getProducts: async (params?: any) => {
        const response = await api.get('/products', { params });
        return response.data;
    },

    deleteProduct: async (id: string) => {
        const response = await api.delete(`/products/${id}`);
        return response.data;
    },

    createAdjustment: async (data: any) => {
        const response = await api.post('/stock-adjustments', data);
        return response.data;
    },

    // Bon de Retour
    createSupplierReturn: async (data: any) => {
        const response = await api.post('/stock/supplier-returns', data);
        return response.data;
    },

    getSupplierReturns: async (params?: any) => {
        const response = await api.get('/stock/supplier-returns', { params });
        return response.data;
    },

    getSupplierReturn: async (id: string) => {
        const response = await api.get(`/stock/supplier-returns/${id}`);
        return response.data;
    },

    updateSupplierReturnStatus: async (id: string, status: string) => {
        const response = await api.post(`/stock/supplier-returns/${id}/status`, { status });
        return response.data;
    }
};
