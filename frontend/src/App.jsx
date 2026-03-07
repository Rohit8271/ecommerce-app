import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header/Header';
import Cart from './components/Cart/Cart';
import Home from './pages/Home';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import Signup from './pages/Signup';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import Profile from './pages/Profile';
import Shop from './pages/Shop';
import OrderSuccess from './pages/OrderSuccess';
import ProductDetail from './components/Products/ProductDetail';
import Wishlist from './pages/Wishlist';
import Contact from './pages/Contact';
import { PrivacyPolicy, TermsOfService, ShippingReturns } from './pages/Legal';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { Toaster } from 'react-hot-toast';
import CustomCursor from './components/CustomCursor/CustomCursor';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="app">
                <CustomCursor />
                <Toaster position="top-right" />
                <Header />
                <Cart />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/admin-login" element={<AdminLogin />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/shop" element={<Shop />} />
                    <Route path="/order-success/:orderId" element={<OrderSuccess />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                    <Route path="/wishlist" element={<Wishlist />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/shipping-returns" element={<ShippingReturns />} />
                  </Routes>
                </main>
                <footer style={{
                  textAlign: 'center',
                  padding: '4rem 0 2rem 0',
                  backgroundColor: '#1f2937', // Dark footer for DELIGHTED brand
                  color: '#9ca3af',
                  marginTop: 'auto'
                }}>
                  <div className="container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <Link to="/privacy-policy" style={{ color: '#d1d5db', textDecoration: 'none' }}>Privacy Policy</Link>
                      <Link to="/terms-of-service" style={{ color: '#d1d5db', textDecoration: 'none' }}>Terms of Service</Link>
                      <Link to="/shipping-returns" style={{ color: '#d1d5db', textDecoration: 'none' }}>Shipping & Returns</Link>
                      <Link to="/admin-login" style={{ color: '#6b7280', textDecoration: 'none' }}>Admin Login</Link>
                    </div>
                    <div style={{ width: '100%', height: '1px', backgroundColor: '#374151' }}></div>
                    <p>&copy; 2026 DELIGHTED E-Commerce. Built with React and Node.js.</p>
                  </div>
                </footer>
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
