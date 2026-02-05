import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import StockList from './pages/StockList';
import CreateReception from './pages/CreateReception';
import DeliveryNoteList from './pages/stock/DeliveryNoteList';
import DeliveryNoteDetail from './pages/stock/DeliveryNoteDetail';
import ReturnNoteList from './pages/stock/ReturnNoteList';
import CreateReturnNote from './pages/stock/CreateReturnNote';
import ReturnNoteDetail from './pages/stock/ReturnNoteDetail';
import HomeMenu from './pages/HomeMenu';
import WarehouseSettings from './pages/WarehouseSettings';
import UserSettings from './pages/UserSettings';
import { WarehouseProvider } from './context/WarehouseContext';
import { WorkDayProvider } from './context/WorkDayContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';


import POS from './pages/facturation/POS';
import InvoiceList from './pages/facturation/InvoiceList';
import SalesHistory from './pages/facturation/SalesHistory';
import ClientList from './pages/facturation/ClientList';
import CreateInvoice from './pages/facturation/CreateInvoice';
import Expenses from './pages/facturation/Expenses';
import PlaceholderPage from './components/PlaceholderPage';
import Recouvrement from './pages/facturation/Recouvrement';
import Payments from './pages/facturation/Payments';
import Versement from './pages/facturation/Versement';
import ClotureJour from './pages/facturation/ClotureJour';
import Documents from './pages/Documents';
import Suppliers from './pages/stock/Suppliers';
import ProductManager from './pages/stock/ProductManager';
import Unpacking from './pages/stock/Unpacking';
import UnpackingHistory from './pages/stock/UnpackingHistory';
import CategoryManager from './pages/parameters/CategoryManager';
import ShelfManager from './pages/parameters/ShelfManager';
import CompanySettings from './pages/parameters/CompanySettings';
import ClientSettings from './pages/parameters/ClientSettings';
import DGISettings from './pages/parameters/DGISettings';
import StockAdjustment from './pages/stock/StockAdjustment';
import CreateInventory from './pages/stock/CreateInventory';
import InventoryDetail from './pages/stock/InventoryDetail';

import PurchaseOrderList from './pages/stock/PurchaseOrderList';
import PurchaseOrderDetail from './pages/stock/PurchaseOrderDetail';
import CreatePurchaseOrder from './pages/stock/CreatePurchaseOrder';


// Protected Route Wrapper
const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-slate-50 text-slate-400">Chargement...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};


function App() {
  return (
    <AuthProvider>
      <WarehouseProvider>
        <WorkDayProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Protected Routes */}
              <Route path="/" element={<RequireAuth><HomeMenu /></RequireAuth>} />

              <Route element={<RequireAuth><MainLayout /></RequireAuth>}>
                {/* Module STOCK */}
                <Route path="/stock" element={<Navigate to="/stock/products/create" replace />} />
                <Route path="/stock/list" element={<StockList />} />

                {/* New Stock Routes */}
                <Route path="/stock/supplier-account" element={<PlaceholderPage title="Compte Fournisseur" />} />
                <Route path="/stock/supplier-credit" element={<PlaceholderPage title="Avoir Fournisseur" />} />
                <Route path="/stock/orders" element={<PurchaseOrderList />} />
                <Route path="/stock/orders/new" element={<CreatePurchaseOrder />} />
                <Route path="/stock/orders/:id" element={<PurchaseOrderDetail />} />
                <Route path="/stock/products/create" element={<ProductManager />} />
                <Route path="/stock/return-voucher" element={<PlaceholderPage title="Bon Retour" />} />
                <Route path="/stock/unpacking" element={<Unpacking />} />
                <Route path="/stock/unpacking-history" element={<UnpackingHistory />} />
                <Route path="/stock/adjustment" element={<StockAdjustment />} />

                {/* Nested Stock Routes */}
                <Route path="stock">
                  <Route path="inventory" element={<CreateInventory />} />
                  <Route path="inventory/new" element={<CreateInventory />} />
                  <Route path="inventory/:id" element={<InventoryDetail />} />

                  {/* Receptions / BL */}
                  <Route path="receptions/new" element={<CreateReception />} />
                  <Route path="delivery-note" element={<DeliveryNoteList />} />
                  <Route path="delivery-note/:id" element={<DeliveryNoteDetail />} />

                  {/* Returns */}
                  <Route path="return-notes" element={<ReturnNoteList />} />
                  <Route path="return-notes/new" element={<CreateReturnNote />} />
                  <Route path="return-notes/:id" element={<ReturnNoteDetail />} />
                </Route>

                {/* Module FACTURATION */}
                <Route path="/facturation" element={<POS />} /> {/* Default to POS */}
                <Route path="/facturation/caisse" element={<POS />} />
                <Route path="/facturation/invoice-list" element={<InvoiceList />} />
                <Route path="/facturation/create" element={<CreateInvoice />} />
                <Route path="/facturation/sales-history" element={<SalesHistory />} />
                <Route path="/facturation/recouvrement" element={<Recouvrement />} />
                <Route path="/facturation/payments" element={<Payments />} />
                <Route path="/facturation/decaissement" element={<Expenses />} />
                <Route path="/facturation/versement" element={<Versement />} />
                <Route path="/facturation/cloture-jour" element={<ClotureJour />} />
                <Route path="/facturation/clients" element={<ClientList />} />

                <Route path="/documents" element={<Documents />} />
                <Route path="/parametres" element={<WarehouseSettings />} />
                <Route path="/parametres/clients" element={<ClientSettings />} />
                <Route path="/parametres/dgi" element={<DGISettings />} />
                <Route path="/parametres/suppliers" element={<Suppliers />} />
                <Route path="/parametres/categories" element={<CategoryManager />} />
                <Route path="/parametres/shelves" element={<ShelfManager />} />
                <Route path="/parametres/users" element={<UserSettings />} />
                <Route path="/parametres/company" element={<CompanySettings />} />
              </Route>
            </Routes>
          </Router>
        </WorkDayProvider>
      </WarehouseProvider>
    </AuthProvider>
  );
}

export default App; // Rebuild trigger
