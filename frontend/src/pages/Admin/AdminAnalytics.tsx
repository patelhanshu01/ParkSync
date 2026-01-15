import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Paper, Box, Chip, CircularProgress, Alert } from '@mui/material';
import Grid from '@mui/material/Grid';
import { getAnalyticsSummary } from '../../api/analyticsApi';
import MainLayout from '../../Components/MainLayout';

const StatCard: React.FC<{ title: string; value: string; subtitle?: string }> = ({ title, value, subtitle }) => (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="caption" color="text.secondary">{title}</Typography>
        <Typography variant="h4" fontWeight={800}>{value}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Paper>
);

const AdminAnalytics: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const revenueTotals = useMemo(() => {
        const revenue = data?.revenue || {};
        return {
            total: Number(revenue.total || 0),
            today: Number(revenue.today || 0)
        };
    }, [data]);
    const reservationTotals = useMemo(() => {
        const reservations = data?.reservations || {};
        return {
            activeCount: Number(reservations.activeCount || 0),
            totalCount: Number(reservations.totalCount || 0)
        };
    }, [data]);
    const occupancyRows = useMemo(() => {
        const occupancy = data?.occupancy || [];
        const out = new Array(occupancy.length);
        for (let i = 0; i < occupancy.length; i++) {
            const item = occupancy[i];
            const pct = Number(item.occupancyPct || 0);
            out[i] = {
                key: item.lotId ?? `${item.lotName}-${i}`,
                lotName: item.lotName,
                activeReservations: item.activeReservations,
                totalSpots: item.totalSpots,
                occupancyPct: pct,
                barColor: pct > 80 ? 'error.main' : 'success.main'
            };
        }
        return out;
    }, [data]);

    useEffect(() => {
        getAnalyticsSummary()
            .then(setData)
            .catch(() => setError('Failed to load analytics'))
            .finally(() => setLoading(false));
    }, []);

    return (
        <MainLayout>
            <Container maxWidth="lg" sx={{ py: 5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Box>
                        <Typography variant="h4" fontWeight={800}>Analytics</Typography>
                        <Typography variant="body2" color="text.secondary">Revenue, occupancy, and activity at a glance.</Typography>
                    </Box>
                    <Chip label="Live" color="success" />
                </Box>

                {loading && <CircularProgress />}
                {error && <Alert severity="error">{error}</Alert>}

                {data && (
                    <>
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <StatCard title="Total revenue" value={`$${revenueTotals.total.toFixed(2)}`} subtitle="Lifetime" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <StatCard title="Today revenue" value={`$${revenueTotals.today.toFixed(2)}`} subtitle="Since 12:00 AM" />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <StatCard title="Active reservations" value={String(reservationTotals.activeCount)} subtitle={`Total: ${reservationTotals.totalCount}`} />
                            </Grid>
                        </Grid>

                        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Occupancy</Typography>
                        <Grid container spacing={2}>
                            {occupancyRows.map((row) => (
                                <Grid size={{ xs: 12, md: 6 }} key={row.key}>
                                    <Paper sx={{ p: 2, borderRadius: 2 }}>
                                        <Typography variant="subtitle1" fontWeight={700}>{row.lotName}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {row.activeReservations} / {row.totalSpots} active • {row.occupancyPct}% occupancy
                                        </Typography>
                                        <Box sx={{ mt: 1, height: 8, bgcolor: 'divider', borderRadius: 999 }}>
                                            <Box sx={{ width: `${row.occupancyPct}%`, height: '100%', bgcolor: row.barColor, borderRadius: 999 }} />
                                        </Box>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </>
                )}
            </Container>
        </MainLayout>
    );
};

export default AdminAnalytics;
