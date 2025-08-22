import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect } from "react";
import Index from "./pages/Index";
import NewsPage from "./pages/NewsPage";
import { 
  SearchResultsLazy, 
  NotFoundLazy, 
  AboutLazy, 
  ContactLazy, 
  CategoriesLazy, 
  PrivacyPolicyLazy, 
  TermsOfUseLazy 
} from "./components/LazyComponents";
import WebVitalsDashboard from "./components/WebVitalsDashboard";
import ServiceWorkerManager from "./components/ServiceWorkerUpdate";
import ErrorBoundary from "./components/ErrorBoundary";
import { initWebVitals, monitorResourceLoading } from "./utils/webVitals";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { useResourcePreload } from "./hooks/useResourcePreload";

// Admin imports
import { AdminProvider } from "./admin/context/AdminProvider";
import { LoginPage } from "./admin/auth/LoginPage";
import { ProtectedRoute } from "./admin/auth/ProtectedRoute";
import { AdminLayout } from "./admin/layout/AdminLayout";
import { Dashboard } from "./admin/pages/Dashboard";
import { NewsList } from "./admin/pages/NewsList";
import { NewsForm } from "./admin/pages/NewsForm";
import { Approvals } from "./admin/pages/Approvals";
import { Reports } from "./admin/pages/Reports";

const queryClient = new QueryClient();

const App = () => {
  // Initialize service worker
  const { register, isSupported, error } = useServiceWorker();
  
  // Initialize resource preloading
  const { preloadCriticalResources, isLoading: preloadLoading } = useResourcePreload();

  // Initialize Web Vitals monitoring, Service Worker and Resource Preloading on app start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize Web Vitals monitoring
      initWebVitals();
      
      // Monitor resource loading performance
      monitorResourceLoading();
      
      // Register service worker if supported
      if (isSupported) {
        register();
      }
      
      // Preload critical resources
      preloadCriticalResources();
      
      // Log initialization in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Ubatuba News - Web Vitals monitoring initialized');
        console.log('📦 Service Worker support:', isSupported);
        console.log('⚡ Resource preloading:', !preloadLoading ? 'active' : 'loading');
        if (error) {
          console.warn('⚠️ Service Worker error:', error);
        }
      }
    }
  }, [register, isSupported, error, preloadCriticalResources, preloadLoading]);

  return (
    <ErrorBoundary
      showDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Log error to external service in production
        if (process.env.NODE_ENV === 'production') {
          console.error('Global error caught:', error, errorInfo);
          // Here you could send to error tracking service like Sentry
        }
      }}
    >
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="ubatuba-news-theme">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <ErrorBoundary>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/news/:id" element={<NewsPage />} />
                  <Route path="/search" element={<SearchResultsLazy />} />
                  <Route path="/about" element={<AboutLazy />} />
                  <Route path="/contact" element={<ContactLazy />} />
                  <Route path="/categories" element={<CategoriesLazy />} />
                  <Route path="/privacy" element={<PrivacyPolicyLazy />} />
                  <Route path="/terms" element={<TermsOfUseLazy />} />
                  
                  {/* Admin routes */}
                  <Route path="/admin/login" element={
                    <AdminProvider>
                      <LoginPage />
                    </AdminProvider>
                  } />
                  
                  <Route path="/admin/*" element={
                    <AdminProvider>
                      <ProtectedRoute>
                        <AdminLayout>
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/news" element={<NewsList />} />
                            <Route path="/news/new" element={<NewsForm />} />
                            <Route path="/news/edit/:id" element={<NewsForm />} />
                            <Route path="/approvals" element={<Approvals />} />
                            <Route path="/reports" element={<Reports />} />
                            <Route path="*" element={<NotFoundLazy />} />
                          </Routes>
                        </AdminLayout>
                      </ProtectedRoute>
                    </AdminProvider>
                  } />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFoundLazy />} />
                </Routes>
              </ErrorBoundary>
              {/* Web Vitals Dashboard - only visible in development or when debug=true */}
              <WebVitalsDashboard />
              {/* Service Worker Manager - handles updates and network status */}
              <ServiceWorkerManager />
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
