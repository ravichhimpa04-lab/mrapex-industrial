import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import ScrollToTop from './components/ScrollToTop';
import AIAssistantWidget from './components/AIAssistantWidget';

import HomePage from './pages/HomePage.jsx';
import AboutUsPage from './components/AboutUsPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import ProductDetailPage from './pages/ProductDetailPage.jsx';
import IndustriesPage from './pages/IndustriesPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import BrandsPage from './pages/BrandsPage.jsx';

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
        <Route path="/brands" element={<BrandsPage />} />
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

            <AIAssistantWidget />
      <Toaster />
    </Router>
  );
}

function NotFoundPage() {
  return (
    <>
      <Header />

      <main className="min-h-[70vh] bg-muted/40 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full text-center bg-white border rounded-3xl p-8 md:p-12 shadow-sm">
          <div className="text-7xl font-extrabold text-primary mb-4">404</div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
            Page Not Found
          </h1>

          <p className="text-muted-foreground leading-relaxed mb-8">
            The page you are looking for may have been moved or does not exist.
            You can go back to our industrial product catalogue or submit your
            requirement for sourcing support.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-white hover:bg-primary/90 transition-colors"
            >
              Browse Products
            </Link>

            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-extrabold text-foreground hover:bg-muted transition-colors"
            >
              Submit Requirement
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}

export default App;