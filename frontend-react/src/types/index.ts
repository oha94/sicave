export interface Warehouse {
    id: string;
    nom: string;
    type: string;
    adresse?: string;
}

export interface Product {
    id: string;
    designation: string;
    sku: string;
    barcode?: string;
    pmp: number;
    category_id: string;
    pivot?: {
        stock_actuel: number;
        stock_alerte: number;
    };
}

export interface Supplier {
    id: string;
    nom: string;
}

export interface StockReception {
    id: string;
    supplier_id: string;
    warehouse_id: string;
    reference_externe?: string;
    status: 'draft' | 'validated';
    created_at: string;
    lines?: ReceptionLine[];
    supplier?: Supplier;
    warehouse?: Warehouse;
}

export interface ReceptionLine {
    id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    product?: Product;
}

export interface Inventory {
    id: string;
    warehouse_id: string;
    type: 'full' | 'partial';
    status: 'draft' | 'completed';
    created_at: string;
    warehouse?: Warehouse;
    lines?: InventoryLine[];
}

export interface InventoryLine {
    id: string;
    product_id: string;
    stock_theoretical: number;
    stock_real: number;
    gap: number;
    product?: Product;
}
