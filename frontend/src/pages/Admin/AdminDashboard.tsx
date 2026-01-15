import React, { useState } from 'react';
import MainLayout from '../../Components/MainLayout';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    LinearProgress,
    CircularProgress,
    Button,
    TextField,
    Alert,
    Stack,
    Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import StorefrontIcon from '@mui/icons-material/Storefront';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { submitHostApplication } from '../../api/hostApi';

const formatStatAmount = (value: number, unit: string) => {
    if (unit === '$') return `$${value}`;
    if (unit === 'kg') return `${value}kg`;
    return `${value}${unit}`;
};

const stats = [
    {
        key: 'total-revenue',
        label: 'Total Revenue',
        value: 1250.50,
        unit: '$',
        amountLabel: formatStatAmount(1250.50, '$'),
        subtitle: 'Earnings since account creation',
        icon: <TrendingUpIcon />,
        color: '#00d4aa',
        percentage: 85
    },
    {
        key: 'monthly-revenue',
        label: 'Money Earned (This Month)',
        value: 340.00,
        unit: '$',
        amountLabel: formatStatAmount(340.00, '$'),
        subtitle: 'Monthly profit',
        icon: <AttachMoneyIcon />,
        color: '#5fb3f6',
        percentage: 92
    },
    {
        key: 'co2-saved',
        label: 'CO₂ Saved',
        value: 125,
        unit: 'kg',
        amountLabel: formatStatAmount(125, 'kg'),
        subtitle: 'Your environmental impact',
        icon: <EnergySavingsLeafIcon />,
        color: '#ffa502',
        percentage: 67
    },
];

const portalActions = [
    {
        label: 'Manage Listings',
        description: 'Edit pricing, availability, and photos.',
        icon: <StorefrontIcon />,
        path: '/host/listings',
        accent: '#00d4aa'
    },
    {
        label: 'Create Listing',
        description: 'Add a new parking space or garage.',
        icon: <AddCircleOutlineIcon />,
        path: '/host/create',
        accent: '#5fb3f6'
    },
    {
        label: 'Analytics',
        description: 'Track demand, occupancy, and revenue.',
        icon: <AnalyticsIcon />,
        path: '/host/analytics',
        accent: '#ffa502'
    },
    {
        label: 'All Bookings',
        description: 'Review active reservations and history.',
        icon: <ListAltIcon />,
        path: '/host/marketplace',
        accent: '#9b59b6'
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
    const { user, updateSession } = useAuth();
    const isAdmin = user?.role === 'admin';
    const navigate = useNavigate();
    const [applicationSent, setApplicationSent] = useState(false);
    const [applicationError, setApplicationError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        accountHolder: '',
        accountNumber: '',
        routingNumber: '',
        payoutEmail: '',
    });

    const handleBankChange = (field: keyof typeof bankDetails) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setBankDetails((prev) => ({ ...prev, [field]: event.target.value }));
    };

    const handleHostApply = async (event: React.FormEvent) => {
        event.preventDefault();
        setApplicationError(null);
        setSubmitting(true);
        try {
            const result = await submitHostApplication({
                bankName: bankDetails.bankName.trim(),
                accountHolder: bankDetails.accountHolder.trim(),
                accountNumber: bankDetails.accountNumber.trim(),
                routingNumber: bankDetails.routingNumber.trim(),
                payoutEmail: bankDetails.payoutEmail.trim() || undefined,
            });
            updateSession(result);
            setApplicationSent(true);
        } catch (err: any) {
            setApplicationError(err.response?.data?.message || 'Failed to submit host application.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <MainLayout>
            <Container maxWidth="xl" sx={{ py: 6 }}>
                <Box sx={{ mb: 5 }}>
                    <Typography
                        variant="h3"
                        sx={{
                            fontWeight: 800,
                            mb: 1,
                            background: 'linear-gradient(45deg, #fff 30%, #444 90%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}
                    >
                        {isAdmin ? 'Host Overview' : 'Host Dashboard'}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                        {isAdmin
                            ? 'Track your earnings and environmental impact from your listings.'
                            : 'Start earning by listing your parking spaces.'}
                    </Typography>
                </Box>

                {!isAdmin ? (
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12, md: 7 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    borderRadius: 4,
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            >
                                <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
                                    Apply to become a host
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Add your payout details to request host access for hosting.
                                </Typography>
                                {applicationSent && (
                                    <Alert severity="success" sx={{ mb: 3 }}>
                                        Application received. Host access is now enabled.
                                    </Alert>
                                )}
                                {applicationError && (
                                    <Alert severity="error" sx={{ mb: 3 }}>
                                        {applicationError}
                                    </Alert>
                                )}
                                <Box component="form" onSubmit={handleHostApply} sx={{ display: 'grid', gap: 2 }}>
                                    <TextField
                                        label="Bank Name"
                                        value={bankDetails.bankName}
                                        onChange={handleBankChange('bankName')}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Account Holder Name"
                                        value={bankDetails.accountHolder}
                                        onChange={handleBankChange('accountHolder')}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Account Number"
                                        value={bankDetails.accountNumber}
                                        onChange={handleBankChange('accountNumber')}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Routing Number"
                                        value={bankDetails.routingNumber}
                                        onChange={handleBankChange('routingNumber')}
                                        required
                                        fullWidth
                                    />
                                    <TextField
                                        label="Payout Email (optional)"
                                        value={bankDetails.payoutEmail}
                                        onChange={handleBankChange('payoutEmail')}
                                        fullWidth
                                    />
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        disabled={submitting}
                                        sx={{ mt: 1, fontWeight: 700 }}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit host application'}
                                    </Button>
                                </Box>
                            </Paper>
                        </Grid>

                        <Grid size={{ xs: 12, md: 5 }}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 4,
                                    borderRadius: 4,
                                    background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, rgba(95, 179, 246, 0.1) 100%)',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                }}
                            >
                                <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
                                    What hosts get
                                </Typography>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                                            <TrendingUpIcon sx={{ color: '#5fb3f6' }} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Automated pricing tips based on local demand.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                                            <EnergySavingsLeafIcon color="primary" />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Visibility in eco-friendly recommendations.
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center' }}>
                                            <AttachMoneyIcon sx={{ color: '#00d4aa' }} />
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            Weekly payouts directly to your bank account.
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Grid>
                    </Grid>
                ) : (
                    <>
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            {portalActions.map((action) => (
                                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={action.label}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 3,
                                            borderRadius: 4,
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.08)',
                                            cursor: 'pointer',
                                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                borderColor: `${action.accent}80`,
                                            }
                                        }}
                                        onClick={() => navigate(action.path)}
                                    >
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Box sx={{
                                                width: 44,
                                                height: 44,
                                                borderRadius: 2,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                bgcolor: `${action.accent}20`,
                                                color: action.accent
                                            }}>
                                                {action.icon}
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700 }}>
                                                {action.label}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" color="text.secondary">
                                            {action.description}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>

                        <Grid container spacing={4}>
                            {stats.map((stat) => (
                                <Grid size={{ xs: 12, md: 4 }} key={stat.key}>
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
                                            amount={stat.amountLabel}
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
                                    <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Portal Details</Typography>
                                    <Stack spacing={2}>
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Role</Typography>
                                            <Typography variant="body1" fontWeight={700}>Host</Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Payouts</Typography>
                                            <Typography variant="body1" fontWeight={700}>Bank details on file</Typography>
                                        </Box>
                                        <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">Support</Typography>
                                            <Typography variant="body1" fontWeight={700}>host@parksync.com</Typography>
                                        </Box>
                                    </Stack>
                                </Paper>
                            </Grid>
                        </Grid>
                    </>
                )}
            </Container>
        </MainLayout>
    );
};

export default AdminDashboard;
