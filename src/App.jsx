﻿﻿import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

// Public Pages
const Home = lazy(() => import('./pages/public/Home'));
const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ListingsPage = lazy(() => import('./pages/public/ListingsPage'));
const PropertyDetailsPage = lazy(() => import('./pages/public/PropertyDetailsPage'));
const HelpCenterPage = lazy(() => import('./pages/public/HelpCenterPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const SitemapPage = lazy(() => import('./pages/public/SitemapPage'));

// User Pages
const ProfilePage = lazy(() => import('./pages/user/ProfilePage'));
const MyBookingsPage = lazy(() => import('./pages/user/MyBookingsPage'));
const NotificationsPage = lazy(() => import('./pages/user/NotificationsPage'));
const MessagesPage = lazy(() => import('./pages/user/MessagesPage'));
const CheckoutPage = lazy(() => import('./pages/user/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/user/SuccessPage'));
const Dashboard = lazy(() => import('./pages/user/Dashboard'));

// Host Pages
const AddPropertyPage = lazy(() => import('./pages/host/AddPropertyPage'));
const EditPropertyPage = lazy(() => import('./pages/host/EditPropertyPage'));
const HostBookingsPage = lazy(() => import('./pages/host/HostBookingsPage'));
const HostPage = lazy(() => import('./pages/host/HostPage'));

// Admin Pages
const AdminLayout = lazy(() => import('./layouts/AdminLayout'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminListingsPage = lazy(() => import('./pages/admin/AdminListingsPage'));
const AdminBookingsPage = lazy(() => import('./pages/admin/AdminBookingsPage'));
const AdminAnalyticsPage = lazy(() => import('./pages/admin/AdminAnalyticsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminNotificationsPage = lazy(() => import('./pages/admin/AdminNotificationsPage'));
const AdminMessagesPage = lazy(() => import('./pages/admin/AdminMessagesPage'));

const PageLoader = () => (
  <div className="flex min-h-[50vh] w-full items-center justify-center text-[#2DB4A0]">
    <Loader2 className="animate-spin" size={32} />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Main Layout */}
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="listings" element={<ListingsPage />} />
            <Route path="listing/:id" element={<PropertyDetailsPage />} />
            <Route path="properties/:id" element={<PropertyDetailsPage />} />
            <Route path="help-center" element={<HelpCenterPage />} />
            <Route path="contact" element={<HelpCenterPage />} />
            <Route path="terms" element={<TermsPage />} />
            <Route path="privacy" element={<PrivacyPage />} />
            <Route path="sitemap" element={<SitemapPage />} />
            <Route path="host" element={<HostPage />} />

            {/* Authenticated User Routes */}
            <Route element={<ProtectedRoute allowedRoles={['user', 'host', 'admin']} />}>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="my-bookings" element={<MyBookingsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="messages" element={<MessagesPage />} />
              <Route path="checkout" element={<CheckoutPage />} />
              <Route path="success" element={<SuccessPage />} />
            </Route>

            {/* Host & Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['host', 'admin']} />}>
              {/* Single unified dashboard (sidebar layout) used for both entry points */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="host-dashboard" element={<Dashboard />} />
              <Route path="host-bookings" element={<HostBookingsPage />} />
              <Route path="add-property" element={<AddPropertyPage />} />
              <Route path="properties/:id/edit" element={<EditPropertyPage />} />
            </Route>

            {/* Admin Layout Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="listings" element={<AdminListingsPage />} />
                <Route path="bookings" element={<AdminBookingsPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
                <Route path="messages" element={<AdminMessagesPage />} />
                <Route path="support-requests" element={<AdminMessagesPage />} />
                <Route path="notifications" element={<AdminNotificationsPage />} />
                <Route path="settings" element={<AdminSettingsPage />} />
              </Route>
            </Route>

            {/* Fallback 404 Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;