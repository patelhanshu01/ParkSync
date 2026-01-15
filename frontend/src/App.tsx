import React, { Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, CircularProgress } from '@mui/material';
import theme from './theme';
import Home from './pages/Home';
import LotDetail from './pages/LotDetail';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import MyBookings from './pages/Dashboard/MyBookings';

import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminProtectedRoute from './Components/AdminProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Wallet from './pages/Wallet';
import WalletCards from './pages/WalletCards';
import { VoiceProvider } from './context/VoiceContext';
import VoiceAssistant from './Components/VoiceAssistant';

// REPLACE WITH YOUR ACTUAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "893475914288-p2g2rv5b2ghboapt5rau18g0nd9818la.apps.googleusercontent.com";

// Lazy Load Host Components
const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminPastListings = React.lazy(() => import('./pages/Admin/AdminPastListings'));
const AdminCreateListing = React.lazy(() => import('./pages/Admin/AdminCreateListing'));
const AdminAnalytics = React.lazy(() => import('./pages/Admin/AdminAnalytics'));
const RewardsPage = React.lazy(() => import('./pages/Rewards'));
const MemoryUsagePage = React.lazy(() => import('./pages/Debug/MemoryUsage'));
const EndpointsPage = React.lazy(() => import('./pages/Debug/Endpoints'));

const VoiceAssistantOverlay: React.FC = () => {
  const location = useLocation();
  if (location.pathname !== '/') return null;
  return <VoiceAssistant />;
};

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <VoiceProvider>
              <Routes>
                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/lot/:id" element={<LotDetail />} />

                {/* Protected User Routes */}
                <Route path="/my-bookings" element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                } />

                <Route path="/payment" element={
                  <ProtectedRoute>
                    <Payment />
                  </ProtectedRoute>
                } />

                <Route path="/payment-success" element={
                  <ProtectedRoute>
                    <PaymentSuccess />
                  </ProtectedRoute>
                } />

                <Route path="/wallet" element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                } />

                <Route path="/wallet/cards" element={
                  <ProtectedRoute>
                    <WalletCards />
                  </ProtectedRoute>
                } />

                <Route path="/rewards" element={
                  <ProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <RewardsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />

                {/* Debug Routes */}
                <Route path="/debug/memory" element={
                  <ProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <MemoryUsagePage />
                    </Suspense>
                  </ProtectedRoute>
                } />

                <Route path="/debug/endpoints" element={
                  <ProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <EndpointsPage />
                    </Suspense>
                  </ProtectedRoute>
                } />

                {/* Host Routes */}
                <Route path="/host" element={<Navigate to="/host/dashboard" replace />} />
                <Route path="/admin/*" element={<Navigate to="/host/dashboard" replace />} />

                <Route path="/host/dashboard" element={
                  <ProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <AdminDashboard />
                    </Suspense>
                  </ProtectedRoute>
                } />

                <Route path="/host/listings" element={
                  <AdminProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <AdminPastListings />
                    </Suspense>
                  </AdminProtectedRoute>
                } />

                <Route path="/host/marketplace" element={
                  <AdminProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <AdminPastListings />
                    </Suspense>
                  </AdminProtectedRoute>
                } />

                <Route path="/host/create" element={
                  <AdminProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <AdminCreateListing />
                    </Suspense>
                  </AdminProtectedRoute>
                } />

                <Route path="/host/analytics" element={
                  <AdminProtectedRoute>
                    <Suspense fallback={<CircularProgress />}>
                      <AdminAnalytics />
                    </Suspense>
                  </AdminProtectedRoute>
                } />

                {/* Catch all - Redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Voice Assistant UI Overlay - search page only */}
              <VoiceAssistantOverlay />

            </VoiceProvider>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
