import api from './api';

export const purchaseService = {
    getSuggestions: async (warehouseId: string) => {
        const response = await api.get('/purchase-orders/suggestions', {
            params: { warehouse_id: warehouseId }
        });
        return response.data;
    },

    createPurchaseOrder: async (data: {
        warehouse_id: string,
        supplier_id: string,
        lines: Array<{
            product_id: string,
            quantity_ordered: number,
            unit_price: number
        }>,
        notes?: string
    }) => {
        const response = await api.post('/purchase-orders', data);
        return response.data;
    },

    getPurchaseOrders: async (params?: any) => {
        const response = await api.get('/purchase-orders', { params });
        return response.data;
    },

    getPurchaseOrder: async (id: string) => {
        const response = await api.get(`/purchase-orders/${id}`);
        return response.data;
    }
};
