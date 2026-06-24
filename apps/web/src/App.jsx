import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop';

import HomePage from './pages/HomePage.jsx';
import AboutUsPage from './components/AboutUsPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import IndustriesPage from './pages/IndustriesPage.jsx';
import ContactPage from './pages/ContactPage.jsx';

import AdminLogin from '@/pages/AdminLogin.jsx';
import AdminDashboard from '@/pages/AdminDashboard.jsx';
import ProtectedAdmin from '@/components/ProtectedAdmin.jsx';

import QuotationsPage from '@/pages/QuotationsPage.jsx';
import CreateQuotationPage from '@/pages/CreateQuotationPage.jsx';
import QuotationDetailPage from '@/pages/QuotationDetailPage.jsx';

function App() {
  return (
    <Router>
      <ScrollToTop />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/industries" element={<IndustriesPage />} />
        <Route path="/about" element={<AboutUsPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/admin-login" element={<AdminLogin />} />

        <Route
          path="/admin"
          element={
            <ProtectedAdmin>
              <AdminDashboard />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/admin/quotations"
          element={
            <ProtectedAdmin>
              <QuotationsPage />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/admin/quotations/new"
          element={
            <ProtectedAdmin>
              <CreateQuotationPage />
            </ProtectedAdmin>
          }
        />

        <Route
  path="/admin/quotations/:id"
  element={
    <ProtectedAdmin>
      <QuotationDetailPage />
    </ProtectedAdmin>
  }
/>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Toaster />
    </Router>
  );
}

function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-6">Page not found</p>
        <a
          href="/"
          className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}

export default App;