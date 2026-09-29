import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { StoreLayout } from '@/components/layout/StoreLayout'
import { PortalLayout } from '@/components/layout/PortalLayout'
import type { NavItem } from '@/components/layout/PortalLayout'
import { Toaster } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import { getDb } from '@/api/db'
import {
  LayoutDashboard,
  ShoppingBag,
  Heart,
  Star,
  MapPin,
  UserCog,
  ShieldCheck,
  Boxes,
  Users,
  MessageSquare,
  Ticket,
  BarChart3,
  Tags,
} from 'lucide-react'

import HomePage from '@/pages/public/HomePage'
import ShopPage from '@/pages/public/ShopPage'
import ProductPage from '@/pages/public/ProductPage'
import CartPage from '@/pages/public/CartPage'
import TrackPage from '@/pages/public/TrackPage'
import ContentPage from '@/pages/public/ContentPage'

import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'

import AccountHome from '@/pages/account/AccountHome'
import OrdersPage from '@/pages/account/OrdersPage'
import OrderDetailPage from '@/pages/account/OrderDetailPage'
import WishlistPage from '@/pages/account/WishlistPage'
import ReviewsPage from '@/pages/account/ReviewsPage'
import AddressesPage from '@/pages/account/AddressesPage'
import ProfilePage from '@/pages/account/ProfilePage'
import SecurityPage from '@/pages/account/SecurityPage'

import CheckoutPage from '@/pages/checkout/CheckoutPage'
import ConfirmationPage from '@/pages/checkout/ConfirmationPage'

import AdminDashboard from '@/pages/admin/AdminDashboard'
import AdminProducts from '@/pages/admin/AdminProducts'
import AdminProductForm from '@/pages/admin/AdminProductForm'
import AdminOrders from '@/pages/admin/AdminOrders'
import AdminOrderDetail from '@/pages/admin/AdminOrderDetail'
import AdminCustomers from '@/pages/admin/AdminCustomers'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminCoupons from '@/pages/admin/AdminCoupons'
import AdminAnalytics from '@/pages/admin/AdminAnalytics'
import NotFoundPage from '@/pages/public/NotFoundPage'

function useRequireAuth(role?: 'admin' | 'customer') {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()

  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />
  if (role === 'admin' && user.role !== 'admin') return <Navigate to="/account" replace />
  if (role === 'customer' && user.role !== 'customer') return <Navigate to="/admin" replace />
  return null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

const accountNav: NavItem[] = [
  { to: '/account', label: 'Overview', icon: <LayoutDashboard className="size-4.5" />, end: true },
  { to: '/account/orders', label: 'Orders', icon: <ShoppingBag className="size-4.5" /> },
  { to: '/account/wishlist', label: 'Wishlist', icon: <Heart className="size-4.5" /> },
  { to: '/account/reviews', label: 'My reviews', icon: <Star className="size-4.5" /> },
  { to: '/account/addresses', label: 'Addresses', icon: <MapPin className="size-4.5" /> },
  { to: '/account/profile', label: 'Profile', icon: <UserCog className="size-4.5" /> },
  { to: '/account/security', label: 'Security', icon: <ShieldCheck className="size-4.5" /> },
]

function pendingReviews() {
  try {
    return getDb().reviews.filter((r) => r.status === 'pending').length
  } catch {
    return 0
  }
}

function AccountShell() {
  const guard = useRequireAuth('customer')
  if (guard) return guard
  return (
    <PortalLayout nav={accountNav} basePath="/" title="My account" subtitle="Orders, saved items and settings">
      <Routes>
        <Route index element={<AccountHome />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:number" element={<OrderDetailPage />} />
        <Route path="wishlist" element={<WishlistPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="addresses" element={<AddressesPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="security" element={<SecurityPage />} />
        <Route path="*" element={<NotFoundPage embedded />} />
      </Routes>
    </PortalLayout>
  )
}

function AdminShell() {
  const guard = useRequireAuth('admin')
  if (guard) return guard
  const nav: NavItem[] = [
    { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard className="size-4.5" />, end: true },
    { to: '/admin/analytics', label: 'Analytics', icon: <BarChart3 className="size-4.5" /> },
    { to: '/admin/orders', label: 'Orders', icon: <ShoppingBag className="size-4.5" /> },
    { to: '/admin/products', label: 'Products', icon: <Boxes className="size-4.5" /> },
    { to: '/admin/categories', label: 'Categories', icon: <Tags className="size-4.5" /> },
    { to: '/admin/customers', label: 'Customers', icon: <Users className="size-4.5" /> },
    { to: '/admin/reviews', label: 'Reviews', icon: <MessageSquare className="size-4.5" />, badge: pendingReviews() },
    { to: '/admin/coupons', label: 'Coupons', icon: <Ticket className="size-4.5" /> },
  ]
  return (
    <PortalLayout nav={nav} basePath="/" title="Admin console" subtitle="TEST Retail · operations">
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<AdminProductForm />} />
        <Route path="products/:id" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminProducts categoryView />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="reviews" element={<AdminReviews />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="*" element={<NotFoundPage embedded />} />
      </Routes>
    </PortalLayout>
  )
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public storefront */}
        <Route element={<StoreLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/track" element={<TrackPage />} />
          <Route path="/about" element={<ContentPage kind="about" />} />
          <Route path="/contact" element={<ContentPage kind="contact" />} />
          <Route path="/help" element={<ContentPage kind="help" />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer portal */}
        <Route path="/account/*" element={<AccountShell />} />

        {/* Checkout */}
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/confirmation/:number" element={<ConfirmationPage />} />

        {/* Admin */}
        <Route path="/admin/*" element={<AdminShell />} />
      </Routes>
      <Toaster />
    </>
  )
}
