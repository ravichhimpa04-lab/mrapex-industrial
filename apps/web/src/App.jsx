import React, { useEffect, useState } from 'react';
import { Link, Route, Routes, BrowserRouter as Router, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { supabase } from '@/lib/supabaseClient';

import ScrollToTop from './components/ScrollToTop';
import Header from '@/components/Header.jsx';
import Footer from '@/components/Footer.jsx';

const AIAssistantWidget = React.lazy(() =>
  import('./components/AIAssistantWidget')
);

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
import ApexDashboard from '@/admin/components/ApexDashboard.jsx';
import CEODashboard from '@/admin/components/CEODashboard.jsx';

function AppContent() {
  const location = useLocation();

  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [checkingMaintenance, setCheckingMaintenance] = useState(true);

  useEffect(() => {
    const checkMaintenanceMode = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      setMaintenanceMode(!error && data?.value === 'true');
      setCheckingMaintenance(false);
    };

    checkMaintenanceMode();
  }, []);

  const isAdminRoute = location.pathname.startsWith('/admin');

  if (checkingMaintenance) {
    return null;
  }

  if (maintenanceMode && !isAdminRoute) {
    return <MaintenancePage />;
  }

  return (
    <>
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

        <Route
          path="/admin/apex"
          element={
            <ProtectedAdmin>
              <ApexDashboard />
            </ProtectedAdmin>
          }
        />

        <Route
          path="/admin/ceo-dashboard"
          element={
            <ProtectedAdmin>
              <CEODashboard />
            </ProtectedAdmin>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {!isAdminRoute && (
        <React.Suspense fallback={null}>
          <AIAssistantWidget />
        </React.Suspense>
      )}

      <Toaster />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

function MaintenancePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-white px-6 text-center">
      <div className="max-w-xl">
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
          Website Under Maintenance
        </h1>

        <p className="text-gray-600 text-lg mb-2">
          MR Apex Industrial Components website is temporarily unavailable.
        </p>

        <p className="text-gray-500">
          We will be back soon.
        </p>
      </div>
    </main>
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