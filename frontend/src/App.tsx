import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import Home from './pages/Home';
import LotDetail from './pages/LotDetail';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import MyBookings from './pages/Dashboard/MyBookings';
import Dashboard from './pages/Dashboard/Dashboard';

import { AuthProvider } from './context/AuthContext';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import ProtectedRoute from './Components/ProtectedRoute';
import AdminProtectedRoute from './Components/AdminProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Wallet from './pages/Wallet';

// REPLACE WITH YOUR ACTUAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "893475914288-p2g2rv5b2ghboapt5rau18g0nd9818la.apps.googleusercontent.com";

const AdminDashboard = React.lazy(() => import('./pages/Admin/AdminDashboard'));
const AdminPastListings = React.lazy(() => import('./pages/Admin/AdminPastListings'));
const AdminCreateListing = React.lazy(() => import('./pages/Admin/AdminCreateListing'));

const App: React.FC = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
              <Route path="/lot/:id" element={
                <ProtectedRoute>
                  <LotDetail />
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
              <Route path="/admin/dashboard" element={
                <AdminProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <AdminDashboard />
                  </React.Suspense>
                </AdminProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <AdminProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <AdminDashboard />
                  </React.Suspense>
                </AdminProtectedRoute>
              } />
              <Route path="/admin/listings" element={
                <AdminProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <AdminPastListings />
                  </React.Suspense>
                </AdminProtectedRoute>
              } />
              <Route path="/marketplace" element={
                <AdminProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <AdminPastListings />
                  </React.Suspense>
                </AdminProtectedRoute>
              } />
              <Route path="/admin/create" element={
                <AdminProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <AdminCreateListing />
                  </React.Suspense>
                </AdminProtectedRoute>
              } />
              <Route path="/my-bookings" element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="*" element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              } />
            </Routes>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
};

export default App;
