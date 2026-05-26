import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CartProvider } from "@/context/CartContext";
import { ProductProvider } from "@/context/ProductContext";
import { AuthProvider } from "@/context/AuthContext";
import { FitProvider } from "@/context/FitContext";
import Index from "./pages/Index";
import { CategoryPage } from "./pages/CategoryPage";
import { ProductPage } from "./pages/ProductPage";
import { WishlistPage } from "./pages/WishlistPage";
import { CollectionsPage } from "./pages/CollectionsPage";
import { AllProductsPage } from "./pages/AllProductsPage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { SearchPage } from "./pages/SearchPage";
import { AuthPage } from "./pages/AuthPage";
import { AdminLoginPage } from "./pages/AdminLoginPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { ReviewOrderPage } from "./pages/ReviewOrderPage";
import { FitProfilePage } from "./pages/FitProfilePage";
import { EBoutiquePage } from "./pages/EBoutiquePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Index />} />
          <Route path="/men" element={<CategoryPage category="men" />} />
          <Route path="/women" element={<CategoryPage category="women" />} />
          <Route path="/essentials" element={<CategoryPage category="essentials" />} />
          <Route path="/new" element={<AllProductsPage />} />
          <Route path="/all" element={<AllProductsPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/review-order" element={<ReviewOrderPage />} />
          <Route path="/fit-profile" element={<FitProfilePage />} />
          <Route path="/e-boutique" element={<EBoutiquePage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FitProvider>
        <ProductProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AnimatedRoutes />
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </ProductProvider>
      </FitProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
