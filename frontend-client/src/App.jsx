import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/layout/Layout';
import HomePage from './pages/Home/HomePage';
import ProductsPage from './pages/Products/ProductsPage';
import ProductDetailPage from './pages/Products/ProductDetailPage';
import CategoriesPage from './pages/Categories/CategoriesPage';
import CategoryPage from './pages/Category/CategoryPage';
import SubcategoryPage from './pages/Subcategory/SubcategoryPage';
import CartPage from './pages/Cart/CartPage';
import CheckoutPage from './pages/Checkout/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmation/OrderConfirmationPage';
import MyOrdersPage from './pages/MyOrders/MyOrdersPage';
import WishlistPage from './pages/Wishlist/WishlistPage';
import AboutPage from './pages/About/AboutPage';
import ContactPage from './pages/Contact/ContactPage';
import WhatsAppButton from './components/common/WhatsAppButton';

// Import global styles
import './styles/globals.css';

function App() {
  return (
    <LanguageProvider>
      <CartProvider>
        <WishlistProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="products" element={<ProductsPage />} />
                <Route path="products/:id" element={<ProductDetailPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="category/:id" element={<CategoryPage />} />
                <Route path="subcategory/:id" element={<SubcategoryPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="checkout" element={<CheckoutPage />} />
                <Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} />
                <Route path="my-orders" element={<MyOrdersPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="contact" element={<ContactPage />} />
              </Route>
            </Routes>
            <WhatsAppButton />
          </BrowserRouter>
        </WishlistProvider>
      </CartProvider>
    </LanguageProvider>
  );
}

export default App;
