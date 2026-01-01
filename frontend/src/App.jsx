import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';

// Pages
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Banners from './pages/Banners/Banners';
import Products from './pages/Products/Products';
import Categories from './pages/Categories/Categories';
import ProductOptions from './pages/ProductOptions/ProductOptions';
import Orders from './pages/Orders/Orders';
import Reviews from './pages/Reviews/Reviews';
import Messages from './pages/Messages/Messages';
import Billing from './pages/Billing/Billing';
import BillImages from './pages/BillImages/BillImages';
import AdminUsers from './pages/AdminUsers/AdminUsers';
import Settings from './pages/Settings/Settings';

// Phase 2 - New Pages
import CustomerBills from './pages/CustomerBills/CustomerBills';
import CustomerDebts from './pages/CustomerDebts/CustomerDebts';
import Traders from './pages/Traders/Traders';
import Wholesalers from './pages/Wholesalers/Wholesalers';
import Workers from './pages/Workers/Workers';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1e293b',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="banners" element={<Banners />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="product-options" element={<ProductOptions />} />
            <Route path="orders" element={<Orders />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="messages" element={<Messages />} />
            <Route path="billing" element={<Billing />} />

            {/* Phase 2 - New Routes */}
            <Route path="customer-bills" element={<CustomerBills />} />
            <Route path="customer-debts" element={<CustomerDebts />} />
            <Route path="wholesalers" element={<Wholesalers />} />

            {/* Super Admin Only */}
            <Route
              path="workers"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <Workers />
                </ProtectedRoute>
              }
            />
            <Route
              path="traders"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <Traders />
                </ProtectedRoute>
              }
            />
            <Route
              path="bill-images"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <BillImages />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin-users"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute requireSuperAdmin>
                  <Settings />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
