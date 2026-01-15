import React, { useMemo } from 'react';
import { Box, Container, Divider, Paper, Stack, Typography } from '@mui/material';

type Endpoint = {
  method: string;
  path: string;
  auth?: 'user' | 'admin';
  notes?: string;
};

type Route = {
  path: string;
  guard?: 'user' | 'admin' | 'public';
  notes?: string;
};

const backendEndpoints: Endpoint[] = [
  { method: 'GET', path: '/health', notes: 'Server health check' },
  { method: 'POST', path: '/api/auth/register' },
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/google-login' },
  { method: 'GET', path: '/api/auth/me', auth: 'user' },
  { method: 'POST', path: '/api/auth/validate' },
  { method: 'GET', path: '/api/parking' },
  { method: 'GET', path: '/api/parking/:id' },
  { method: 'POST', path: '/api/parking' },
  { method: 'PUT', path: '/api/parking/:id' },
  { method: 'DELETE', path: '/api/parking/:id' },
  { method: 'GET', path: '/api/parking/stream', notes: 'SSE; supports ?lotId=123' },
  { method: 'GET', path: '/api/parking/photo/:reference' },
  { method: 'GET', path: '/api/listings' },
  { method: 'GET', path: '/api/listings/:id' },
  { method: 'POST', path: '/api/listings' },
  { method: 'PUT', path: '/api/listings/:id' },
  { method: 'DELETE', path: '/api/listings/:id' },
  { method: 'POST', path: '/api/listings/:id/reserve', auth: 'user' },
  { method: 'GET', path: '/api/payment', auth: 'user' },
  { method: 'GET', path: '/api/payment/:id', auth: 'user' },
  { method: 'POST', path: '/api/payment', auth: 'user' },
  { method: 'PUT', path: '/api/payment/:id' },
  { method: 'DELETE', path: '/api/payment/:id' },
  { method: 'GET', path: '/api/reservation/my-bookings', auth: 'user' },
  { method: 'GET', path: '/api/reservation' },
  { method: 'GET', path: '/api/reservation/:id' },
  { method: 'POST', path: '/api/reservation', auth: 'user' },
  { method: 'PUT', path: '/api/reservation/:id' },
  { method: 'DELETE', path: '/api/reservation/:id' },
  { method: 'GET', path: '/api/user' },
  { method: 'GET', path: '/api/user/:id' },
  { method: 'POST', path: '/api/user' },
  { method: 'PUT', path: '/api/user/:id' },
  { method: 'DELETE', path: '/api/user/:id' },
  { method: 'POST', path: '/api/co2/score' },
  { method: 'POST', path: '/api/co2/compare' },
  { method: 'POST', path: '/api/waitlist' },
  { method: 'GET', path: '/api/waitlist/:lotId' },
  { method: 'POST', path: '/api/waitlist/:id/notify' },
  { method: 'GET', path: '/api/analytics/summary' },
  { method: 'GET', path: '/api/wallet', auth: 'user' },
  { method: 'POST', path: '/api/wallet/top-up', auth: 'user' },
  { method: 'POST', path: '/api/wallet/apply', auth: 'user' }
];

const frontendRoutes: Route[] = [
  { path: '/login', guard: 'public' },
  { path: '/signup', guard: 'public' },
  { path: '/', guard: 'user' },
  { path: '/lot/:id', guard: 'user' },
  { path: '/payment', guard: 'user' },
  { path: '/payment-success', guard: 'user' },
  { path: '/my-bookings', guard: 'user' },
  { path: '/wallet', guard: 'user' },
  { path: '/host/dashboard', guard: 'admin' },
  { path: '/dashboard', guard: 'admin' },
  { path: '/host/listings', guard: 'admin' },
  { path: '/host/analytics', guard: 'admin' },
  { path: '/host/marketplace', guard: 'admin' },
  { path: '/host/create', guard: 'admin' },
  { path: '/debug/memory', guard: 'user' },
  { path: '/debug/endpoints', guard: 'user' },
  { path: '*', guard: 'user', notes: 'Fallback to Home' }
];

const Badge: React.FC<{ label: string }> = React.memo(({ label }) => (
  <Box
    component="span"
    sx={{
      px: 1,
      py: 0.25,
      borderRadius: 1,
      bgcolor: 'rgba(0,0,0,0.08)',
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: 0.3
    }}
  >
    {label}
  </Box>
));

const Endpoints: React.FC = () => {
  const backendRows = useMemo(() => {
    return backendEndpoints.map((endpoint) => (
      <Box key={`${endpoint.method}:${endpoint.path}`} sx={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 1, alignItems: 'center' }}>
        <Badge label={endpoint.method} />
        <Typography sx={{ fontFamily: 'monospace' }}>{endpoint.path}</Typography>
        {endpoint.auth ? <Badge label={`auth:${endpoint.auth}`} /> : <Box />}
        {endpoint.notes && (
          <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '2 / span 2' }}>
            {endpoint.notes}
          </Typography>
        )}
      </Box>
    ));
  }, []);

  const frontendRows = useMemo(() => {
    return frontendRoutes.map((route) => (
      <Box key={route.path} sx={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1, alignItems: 'center' }}>
        {route.guard ? <Badge label={`guard:${route.guard}`} /> : <Box />}
        <Typography sx={{ fontFamily: 'monospace' }}>{route.path}</Typography>
        {route.notes && (
          <Typography variant="caption" color="text.secondary" sx={{ gridColumn: '2 / span 1' }}>
            {route.notes}
          </Typography>
        )}
      </Box>
    ));
  }, []);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 2 }}>
        Endpoints & Routes
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Backend API endpoints and frontend routes currently wired in the app.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Backend API
        </Typography>
        <Stack spacing={1.5}>
          {backendRows}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Frontend Routes
        </Typography>
        <Stack spacing={1.5}>
          {frontendRows}
        </Stack>
      </Paper>
    </Container>
  );
};

export default Endpoints;
