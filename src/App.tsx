import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { useEffect, lazy, Suspense } from "react";
import Index from "./pages/Index";
import NewsPage from "./pages/NewsPage";
import {
  SearchResultsLazy,
  NotFoundLazy,
  AboutLazy,
  ContactLazy,
  CategoriesLazy,
  PrivacyPolicyLazy,
  TermsOfUseLazy,
  LoadingSpinner
} from "./components/LazyComponents";
import ServiceWorkerManager from "./components/ServiceWorkerUpdate";
import ErrorBoundary from "./components/ErrorBoundary";
import { useServiceWorker } from "./hooks/useServiceWorker";
import { useResourcePreload } from "./hooks/useResourcePreload";

// Admin imports
import { AdminProvider } from "./admin/context/AdminProvider";
import { ProtectedRoute } from "./admin/auth/ProtectedRoute";

const LoginPage = lazy(() => import("./admin/auth/LoginPage"));
const AdminLayout = lazy(() => import("./admin/layout/AdminLayout"));
const Dashboard = lazy(() => import("./admin/pages/Dashboard"));
const NewsList = lazy(() => import("./admin/pages/NewsList"));
const NewsForm = lazy(() => import("./admin/pages/NewsForm"));
const NewsPreview = lazy(() => import("./pages/NewsPreview"));
const Approvals = lazy(() => import("./admin/pages/Approvals"));
const Reports = lazy(() => import("./admin/pages/Reports"));
const Performance = lazy(() => import("./admin/pages/Performance"));
const Users = lazy(() => import("./admin/pages/Users"));
const AuditLogs = lazy(() => import("./admin/pages/AuditLogs"));
const Settings = lazy(() => import("./admin/pages/Settings"));

const queryClient = new QueryClient();

const App = () => {
  // Initialize service worker
  const { isSupported, error } = useServiceWorker();
  
  // Initialize resource preloading
  const { preloadCriticalResources, isLoading: preloadLoading } = useResourcePreload();

  // Initialize Resource Preloading on app start
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // DEBUG: Verificar variáveis de ambiente
      console.log('🔍 [App] DEBUG - Verificando variáveis de ambiente:');
      console.log('🔍 [App] VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? 'DEFINIDA' : 'UNDEFINED');
      console.log('🔍 [App] VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA (length: ' + import.meta.env.VITE_SUPABASE_ANON_KEY?.length + ')' : 'UNDEFINED');
      console.log('🔍 [App] Todas as variáveis VITE_:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
      
      // Service Worker registration is handled automatically by the hook
      // (disabled in development mode to prevent conflicts with HMR)
      
      // Preload critical resources
      preloadCriticalResources();
      
      // Log initialization in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Ubatuba News initialized');
        console.log('📦 Service Worker support:', isSupported);
        console.log('⚡ Resource preloading:', !preloadLoading ? 'active' : 'loading');
        if (error) {
          console.warn('⚠️ Service Worker error:', error);
        }
      }
    }
  }, [isSupported, error, preloadCriticalResources, preloadLoading]);

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
                  <Route path="/login" element={<Navigate to="/admin/login" replace />} />
                  <Route path="/news/preview" element={<NewsPreview />} />
                  <Route path="/news/:id" element={<NewsPage />} />
                  <Route path="/search" element={<SearchResultsLazy />} />
                  <Route path="/about" element={<AboutLazy />} />
                  <Route path="/contact" element={<ContactLazy />} />
                  <Route path="/categories" element={<CategoriesLazy />} />
                  <Route path="/privacy" element={<PrivacyPolicyLazy />} />
                  <Route path="/terms" element={<TermsOfUseLazy />} />
                  
                  {/* Admin routes */}
                  <Route
                    path="/admin/login"
                    element={
                      <AdminProvider>
                        <Suspense fallback={<LoadingSpinner message="Carregando..." />}>
                          <LoginPage />
                        </Suspense>
                      </AdminProvider>
                    }
                  />

                  <Route
                    path="/admin/*"
                    element={
                      <AdminProvider>
                        <ProtectedRoute>
                          <Suspense fallback={<LoadingSpinner message="Carregando painel..." />}>
                            <AdminLayout>
                              <Routes>
                                <Route path="/" element={<Dashboard />} />
                                <Route path="/dashboard" element={<Dashboard />} />
                                <Route path="/news" element={<NewsList />} />
                                <Route path="/news/new" element={<NewsForm />} />
                                <Route path="/news/edit/:id" element={<NewsForm />} />
                                <Route path="/approvals" element={<Approvals />} />
                                <Route path="/reports" element={<Reports />} />
                                <Route path="/performance" element={<Performance />} />
                                <Route
                                  path="/users"
                                  element={
                                    <ProtectedRoute requiredRole="admin">
                                      <Users />
                                    </ProtectedRoute>
                                  }
                                />
                                <Route path="/audit" element={<AuditLogs />} />
                                <Route path="/settings" element={<Settings />} />
                                <Route path="*" element={<NotFoundLazy />} />
                              </Routes>
                            </AdminLayout>
                          </Suspense>
                        </ProtectedRoute>
                      </AdminProvider>
                    }
                  />
                  
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFoundLazy />} />
                </Routes>
              </ErrorBoundary>

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
