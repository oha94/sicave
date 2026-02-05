import api from './api';

export interface Supplier {
    id: string;
    nom: string;
    coordonnees: string | null;
    created_at?: string;
    updated_at?: string;
}

export const supplierService = {
    getSuppliers: async () => {
        const response = await api.get<Supplier[]>('/suppliers');
        return response.data;
    },

    createSupplier: async (data: Partial<Supplier>) => {
        const response = await api.post<Supplier>('/suppliers', data);
        return response.data;
    },

    updateSupplier: async (id: string, data: Partial<Supplier>) => {
        const response = await api.put<Supplier>(`/suppliers/${id}`, data);
        return response.data;
    },

    deleteSupplier: async (id: string) => {
        await api.delete(`/suppliers/${id}`);
    }
};
