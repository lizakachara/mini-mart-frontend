import React from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

/* ================================
   CUSTOMER COMPONENTS
================================ */

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import ShoppingAssistant from "./components/ShoppingAssistant";

/* ================================
   CUSTOMER PAGES
================================ */

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";

/* ================================
   ADMIN COMPONENTS
================================ */

import AdminNavbar from "./admin/components/AdminNavbar";
import AdminFooter from "./admin/components/AdminFooter";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";

/* ================================
   ADMIN PAGES
================================ */

import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminProducts from "./admin/pages/AdminProducts";
import AdminCategories from "./admin/pages/AdminCategories";
import AdminOrders from "./admin/pages/AdminOrders";
import AdminUsers from "./admin/pages/AdminUsers";
import AdminLogin from "./admin/pages/AdminLogin";

/* ================================
   CONTEXT
================================ */

import CartProvider from "./context/CartContext";
import AuthProvider from "./context/AuthContext";

/* ==================================================
   CUSTOMER LAYOUT
================================================== */

function CustomerLayout() {
  return (
    <>
      <Navbar />

      <Routes>

        {/* =========================
            HOME - PROTECTED
        ========================= */}

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PRODUCTS - PROTECTED
        ========================= */}

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <Products />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PRODUCT DETAILS - PROTECTED
        ========================= */}

        <Route
          path="/product-details/:id"
          element={
            <ProtectedRoute>
              <ProductDetails />
            </ProtectedRoute>
          }
        />

        {/* =========================
            CART - PROTECTED
        ========================= */}

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        {/* =========================
            LOGIN - PUBLIC
        ========================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />

        {/* =========================
            REGISTER - PUBLIC
        ========================= */}

        <Route
          path="/register"
          element={<Register />}
        />

        {/* =========================
            CHECKOUT - PROTECTED
        ========================= */}

        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* =========================
            ORDER CONFIRMATION - PROTECTED
        ========================= */}

        <Route
          path="/order-confirmation"
          element={
            <ProtectedRoute>
              <OrderConfirmation />
            </ProtectedRoute>
          }
        />

        {/* =========================
            PROFILE - PROTECTED
        ========================= */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* =========================
            WISHLIST - PROTECTED
        ========================= */}

        <Route
          path="/wishlist"
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          }
        />

        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          }
        />

      </Routes>

      <Footer />
      <ShoppingAssistant />
    </>
  );
}

/* ==================================================
   ADMIN LAYOUT
================================================== */

function AdminLayout() {
  return (
    <AdminProtectedRoute>

      <AdminNavbar />

      <Routes>

        <Route
          path="/admin/dashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/analytics"
          element={<AdminAnalytics />}
        />

        <Route
          path="/admin/products"
          element={<AdminProducts />}
        />

        <Route
          path="/admin/categories"
          element={<AdminCategories />}
        />

        <Route
          path="/admin/orders"
          element={<AdminOrders />}
        />

        <Route
          path="/admin/users"
          element={<AdminUsers />}
        />

      </Routes>

      <AdminFooter />

    </AdminProtectedRoute>
  );
}

/* ==================================================
   MAIN APP CONTENT
================================================== */

function AppContent() {

  const location = useLocation();

  const isAdminLogin =
    location.pathname === "/admin/login";

  const isAdminRoute =
    location.pathname.startsWith("/admin");

  /* =========================
     ADMIN LOGIN
     ========================= */

  if (isAdminLogin) {
    return <AdminLogin />;
  }

  /* =========================
     ADMIN PAGES
     ========================= */

  if (isAdminRoute) {
    return <AdminLayout />;
  }

  /* =========================
     CUSTOMER PAGES
     ========================= */

  return <CustomerLayout />;
}

/* ==================================================
   APP
================================================== */

function App() {

  return (
    <AuthProvider>

      <CartProvider>

        <BrowserRouter>

          <AppContent />

        </BrowserRouter>

      </CartProvider>

    </AuthProvider>
  );
}

export default App;