import axios, { type AxiosInstance } from 'axios';

// Extend AxiosInstance to include our custom methods
interface ApiService extends AxiosInstance {
    getProducts: (params?: any) => Promise<any>;
    getProduct: (id: string) => Promise<any>;
    createProduct: (data: any) => Promise<any>;
    updateProduct: (id: string, data: any) => Promise<any>;
    deleteProduct: (id: string) => Promise<any>;
    deactivateProduct: (id: string) => Promise<any>;
    mergeProducts: (sourceId: string, targetId: string) => Promise<any>;
    unpackProduct: (id: string, data: any) => Promise<any>;
    reactivateProduct: (id: string) => Promise<any>;
    getProductStats: (id: string, params?: any) => Promise<any>;
    getUnpackingHistory: (params?: any) => Promise<any>;
    getReportStockInventories: (params?: any) => Promise<any>;
    getCategories: () => Promise<any>;
    createCategory: (data: any) => Promise<any>;
    updateCategory: (id: string, data: any) => Promise<any>;

    deleteCategory: (id: string) => Promise<any>;
    getShelves: () => Promise<any>;
    createShelf: (data: any) => Promise<any>;
    updateShelf: (id: string, data: any) => Promise<any>;
    deleteShelf: (id: string) => Promise<any>;
    getSuppliers: () => Promise<any>;
    getWarehouses: () => Promise<any>;

    // Clients
    getClients: () => Promise<any>;
    createClient: (data: any) => Promise<any>;
    updateClient: (id: string, data: any) => Promise<any>;
    deleteClient: (id: string) => Promise<any>;
    toggleClientStatus: (id: string) => Promise<any>;

    // Users
    getUsers: () => Promise<any>;


    // Invoices
    getInvoices: (params?: any) => Promise<any>;
    createInvoice: (data: any) => Promise<any>;
    cancelInvoice: (id: string) => Promise<any>;

    // Settings
    getSettings: () => Promise<any>;
    updateSettings: (data: any) => Promise<any>;
    generateOtp: () => Promise<any>;
    verifyOtp: (code: string) => Promise<any>;
    uploadLogo: (formData: FormData) => Promise<any>;

    // Recouvrement
    getPayments: (params?: any) => Promise<any>;
    getDebtors: (params?: any) => Promise<any>;
    getClientDebt: (clientId: string) => Promise<any>;
    createPayment: (data: any) => Promise<any>;

    // Versement
    createCashCount: (data: any) => Promise<any>;
    getCashCounts: () => Promise<any>;

    // Auth
    login: (credentials: any) => Promise<any>;
    logout: () => Promise<any>;

    [key: string]: any;
}

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
}) as ApiService;

// Add Request Interceptor for Auth Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    // @ts-ignore
    if (token && !config.skipAuth) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Products
api.getProducts = (params?: any) => api.get('/products', { params }).then(res => res.data.data);
api.getProduct = (id: string) => api.get(`/products/${id}`).then(res => res.data.data);
api.createProduct = (data: any) => api.post('/products', data).then(res => res.data.data);
api.updateProduct = (id: string, data: any) => api.put(`/products/${id}`, data).then(res => res.data.data);
api.deleteProduct = (id: string) => api.delete(`/products/${id}`);
api.deactivateProduct = (id: string) => api.post(`/products/${id}/deactivate`);
api.mergeProducts = (sourceId: string, targetId: string) => api.post(`/products/${sourceId}/merge`, { target_product_id: targetId });
api.unpackProduct = (id: string, data: any) => api.post(`/products/${id}/unpack`, data);
api.reactivateProduct = (id: string) => api.post(`/products/${id}/reactivate`);
api.getProductStats = (id: string, params?: any) => api.get(`/products/${id}/stats`, { params }).then(res => res.data);
api.getUnpackingHistory = (params?: any) => api.get('/products/unpacking-history', { params }).then(res => res.data);
// Reports
api.getReportStockMovements = (params?: any) => api.get('/reports/stock/movements', { params }); // Assuming these exist or will mock
api.getReportStockValue = (params?: any) => api.get('/reports/stock/value', { params });
api.getReportStockDormant = (params?: any) => api.get('/reports/stock/dormant', { params });
api.getReportStockAlerts = (params?: any) => api.get('/reports/stock/alerts', { params });
api.getReportStockInventories = (params?: any) => api.get('/reports/stock/inventories', { params });

api.getReportFinancialSummary = (params?: any) => api.get('/reports/financial/summary', { params });
api.getReportCashJournal = (params?: any) => api.get('/reports/financial/journal', { params });
api.getReportCashCounts = (params?: any) => api.get('/reports/financial/counts', { params });
api.getReportExpenses = (params?: any) => api.get('/reports/financial/expenses', { params });
api.getReportClientBalances = (params?: any) => api.get('/reports/financial/clients', { params });
api.getReportFinancialPointsOfSale = (params?: any) => api.get('/reports/financial/pos', { params });

api.getReportAuditPriceChanges = (params?: any) => api.get('/reports/audit/price-changes', { params });
api.getReportAuditDeletions = (params?: any) => api.get('/reports/audit/deletions', { params });
api.getReportAuditClosures = (params?: any) => api.get('/reports/audit/closures', { params });


// Categories
api.getCategories = () => api.get('/categories').then(res => res.data.data);
api.createCategory = (data: any) => api.post('/categories', data).then(res => res.data.data);
api.updateCategory = (id: string, data: any) => api.put(`/categories/${id}`, data).then(res => res.data.data);
api.deleteCategory = (id: string) => api.delete(`/categories/${id}`);

// Shelves
api.getShelves = () => api.get('/shelves').then(res => res.data.data);
api.createShelf = (data: any) => api.post('/shelves', data).then(res => res.data.data);
api.updateShelf = (id: string, data: any) => api.put(`/shelves/${id}`, data).then(res => res.data.data);
api.deleteShelf = (id: string) => api.delete(`/shelves/${id}`);

// Suppliers
api.getSuppliers = () => api.get('/suppliers').then(res => res.data);

// Warehouse
api.getWarehouses = () => api.get('/warehouses').then(res => res.data);

// Clients
api.getClients = () => api.get('/clients').then(res => res.data);
api.createClient = (data: any) => api.post('/clients', data).then(res => res.data);

// Users
api.getUsers = () => api.get('/users').then(res => res.data);


// Invoices
api.getInvoices = (params?: any) => api.get('/invoices', { params }).then(res => res.data);
api.createInvoice = (data: any) => api.post('/invoices', data).then(res => res.data);
api.signInvoice = (id: string) => api.post(`/invoices/${id}/report`).then(res => res.data);
api.cancelInvoice = (id: string) => api.delete(`/invoices/${id}`).then(res => res.data);

// Settings
// @ts-ignore
// @ts-ignore
api.getSettings = () => api.get('/settings').then(res => res.data);
api.updateSettings = (data: any) => api.post('/settings', { settings: data }).then(res => res.data);
api.uploadLogo = (formData: FormData) => api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
}).then(res => res.data);
api.testDgiConnection = () => api.post('/settings/test-dgi').then(res => res.data);

// Recouvrement
api.getPayments = (params?: any) => api.get('/payments', { params }).then(res => res.data);
api.getDebtors = (params?: any) => api.get('/debtors', { params }).then(res => res.data);
api.getClientDebt = (clientId: string) => api.get(`/clients/${clientId}/debt`).then(res => res.data);
api.createPayment = (data: any) => api.post('/payments', data).then(res => res.data);

// Versement
api.createCashCount = (data: any) => api.post('/cash-counts', data).then(res => res.data);
api.getCashCounts = () => api.get('/cash-counts').then(res => res.data);

// Auth
api.login = (credentials: any) => api.post('/login', credentials).then(res => res.data);
api.logout = () => api.post('/logout').then(res => res.data);

export default api;
