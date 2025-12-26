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
import { GoogleOAuthProvider } from '@react-oauth/google';
import Wallet from './pages/Wallet';

// REPLACE WITH YOUR ACTUAL GOOGLE CLIENT ID
const GOOGLE_CLIENT_ID = "893475914288-p2g2rv5b2ghboapt5rau18g0nd9818la.apps.googleusercontent.com";

const MarketplacePage = React.lazy(() => import('./pages/Marketplace/Marketplace'));
const CreateListingPage = React.lazy(() => import('./pages/Marketplace/CreateListing'));
const ListingDetailPage = React.lazy(() => import('./pages/Marketplace/ListingDetail'));

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
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/wallet" element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              } />
              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <MarketplacePage />
                  </React.Suspense>
                </ProtectedRoute>
              } />
              <Route path="/marketplace/create" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <CreateListingPage />
                  </React.Suspense>
                </ProtectedRoute>
              } />
              <Route path="/marketplace/:id" element={
                <ProtectedRoute>
                  <React.Suspense fallback={<div>Loading...</div>}>
                    <ListingDetailPage />
                  </React.Suspense>
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
