import React from 'react';
import MainLayout from '../../Components/MainLayout';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    LinearProgress,
    Divider,
    CircularProgress,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpeedIcon from '@mui/icons-material/Speed';

const stats = [
    {
        label: 'Total Revenue',
        value: 1250.50,
        unit: '$',
        subtitle: 'Earnings since account creation',
        icon: <TrendingUpIcon />,
        color: '#00d4aa',
        percentage: 85
    },
    {
        label: 'Money Earned (This Month)',
        value: 340.00,
        unit: '$',
        subtitle: 'Monthly profit',
        icon: <AttachMoneyIcon />,
        color: '#5fb3f6',
        percentage: 92
    },
    {
        label: 'CO₂ Saved',
        value: 125,
        unit: 'kg',
        subtitle: 'Your environmental impact',
        icon: <EnergySavingsLeafIcon />,
        color: '#ffa502',
        percentage: 67
    },
];

const CircularProgressWithLabel: React.FC<{ value: number; color: string; label: string; amount: string; subtitle: string }> = ({
    value,
    color,
    label,
    amount,
    subtitle
}) => {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={160}
                    thickness={4}
                    sx={{ color: 'rgba(255, 255, 255, 0.1)' }}
                />
                <CircularProgress
                    variant="determinate"
                    value={value}
                    size={160}
                    thickness={5}
                    sx={{
                        color: color,
                        position: 'absolute',
                        left: 0,
                        strokeLinecap: 'round',
                        filter: `drop-shadow(0 0 8px ${color}40)`
                    }}
                />
                <Box
                    sx={{
                        top: 0,
                        left: 0,
                        bottom: 0,
                        right: 0,
                        position: 'absolute',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="h4" component="div" sx={{ fontWeight: 800, color: 'text.primary' }}>
                        {amount}
                    </Typography>
                </Box>
            </Box>
            <Typography variant="subtitle1" sx={{ mt: 3, fontWeight: 700, textAlign: 'center' }}>
                {label}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 140 }}>
                {subtitle}
            </Typography>
        </Box>
    );
};

const AdminDashboard: React.FC = () => {
    return (
        <MainLayout>
            <Container maxWidth="xl" sx={{ py: 6 }}>
                <Box sx={{ mb: 5 }}>
                    <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, background: 'linear-gradient(45deg, #fff 30%, #444 90%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Admin Overview
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                        Track your earnings and environmental impact from your listings.
                    </Typography>
                </Box>

                <Grid container spacing={4}>
                    {stats.map((stat, index) => (
                        <Grid size={{ xs: 12, md: 4 }} key={index}>
                            <Paper elevation={0} sx={{
                                p: 5,
                                borderRadius: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: 320,
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                                '&:hover': {
                                    transform: 'translateY(-8px)',
                                    boxShadow: '0 12px 24px rgba(0,0,0,0.3)',
                                    borderColor: `${stat.color}40`,
                                }
                            }}>
                                <CircularProgressWithLabel
                                    value={stat.percentage}
                                    color={stat.color}
                                    label={stat.label}
                                    amount={`${stat.unit === '$' ? '$' : ''}${stat.value}${stat.unit === 'kg' ? 'kg' : ''}`}
                                    subtitle={stat.subtitle}
                                />
                            </Paper>
                        </Grid>
                    ))}

                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Typography variant="h5" sx={{ mb: 4, fontWeight: 700 }}>Performance Analysis</Typography>

                            <Box sx={{ mb: 4 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body1" fontWeight={600}>Listing Occupancy Rate</Typography>
                                    <Typography variant="h6" color="primary.main" fontWeight={800}>78%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={78} sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(0, 212, 170, 0.1)', '& .MuiLinearProgress-bar': { borderRadius: 6 } }} />
                            </Box>

                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                    <Typography variant="body1" fontWeight={600}>Customer Satisfaction</Typography>
                                    <Typography variant="h6" color="secondary.main" fontWeight={800}>4.8/5</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={96} sx={{ height: 12, borderRadius: 6, bgcolor: 'rgba(95, 179, 246, 0.1)', '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: '#5fb3f6' } }} />
                            </Box>
                        </Paper>
                    </Grid>

                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(95, 179, 246, 0.1) 100%)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Quick Tips</Typography>
                            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                                    <EnergySavingsLeafIcon color="primary" />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Promoting your listing with <b>EV charging</b> can increase your revenue by up to <b>15%</b>.
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                                    <TrendingUpIcon sx={{ color: '#5fb3f6' }} />
                                </Box>
                                <Typography variant="body2" color="text.secondary">
                                    Weekend rates are currently trending upwards in <b>Brampton South</b>.
                                </Typography>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </MainLayout>
    );
};

export default AdminDashboard;
