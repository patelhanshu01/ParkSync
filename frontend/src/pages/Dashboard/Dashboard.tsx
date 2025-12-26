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
import PeopleIcon from '@mui/icons-material/People';
import SpeedIcon from '@mui/icons-material/Speed';

// Mock data matching the design
const stats = [
    {
        label: 'Carbon Footprint Reduction',
        value: 85,
        unit: '%',
        subtitle: 'Previous 1 month',
        icon: <EnergySavingsLeafIcon />,
        color: '#00d4aa'
    },
    {
        label: 'Total Revenue',
        value: 92,
        unit: '%',
        subtitle: 'Previous 1 month',
        icon: <TrendingUpIcon />,
        color: '#5fb3f6'
    },
    {
        label: 'Live Occupancy Rate',
        value: 67,
        unit: '%',
        subtitle: 'Current',
        icon: <SpeedIcon />,
        color: '#ffa502'
    },
];

const queueItems = [
    { label: 'Queue Management', value: '45 min' },
    { label: 'Pricing per Hour', value: '$8.5/hr' },
    { label: 'Upload Lot Photos', value: 'Next 6 hrs' },
    { label: 'Renewal Package', value: 'Next 6 hrs' },
];

// Custom circular progress component
const CircularProgressWithLabel: React.FC<{ value: number; color: string; label: string; subtitle: string }> = ({
    value,
    color,
    label,
    subtitle
}) => {
    return (
        <Box sx={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                    variant="determinate"
                    value={100}
                    size={140}
                    thickness={4}
                    sx={{ color: 'rgba(255, 255, 255, 0.1)' }}
                />
                <CircularProgress
                    variant="determinate"
                    value={value}
                    size={140}
                    thickness={4}
                    sx={{
                        color: color,
                        position: 'absolute',
                        left: 0,
                        strokeLinecap: 'round',
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
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, color: 'text.primary' }}>
                        {`${value}%`}
                    </Typography>
                </Box>
            </Box>
            <Typography variant="subtitle2" sx={{ mt: 2, fontWeight: 600, textAlign: 'center' }}>
                {label}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                {subtitle}
            </Typography>
        </Box>
    );
};

const Dashboard: React.FC = () => {
    return (
        <MainLayout>
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {/* Top Metrics */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    {stats.map((stat, index) => (
                        <Grid size={{ xs: 12, md: 4 }} key={index}>
                            <Paper elevation={0} sx={{
                                p: 4,
                                borderRadius: 3,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                minHeight: 260,
                            }}>
                                <CircularProgressWithLabel
                                    value={stat.value}
                                    color={stat.color}
                                    label={stat.label}
                                    subtitle={stat.subtitle}
                                />
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Bottom Section */}
                <Grid container spacing={3}>
                    {/* Queue Management */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Queue Management</Typography>
                            <Box>
                                {queueItems.map((item, i) => (
                                    <Box key={i} sx={{ mb: 2 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                            <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{item.value}</Typography>
                                        </Box>
                                        {i < queueItems.length - 1 && <Divider sx={{ my: 1.5 }} />}
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Sustainability Goals */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Sustainability Goals</Typography>

                            <Box sx={{ mb: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">CO₂ Reduction Target</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>85%</Typography>
                                </Box>
                                <LinearProgress variant="determinate" value={85} sx={{ height: 8, borderRadius: 4 }} />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    You've prevented 850kg of CO₂ this month!
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>Top Performing Lots</Typography>
                            {[
                                { name: 'Downtown Central', score: 98, color: '#00d4aa' },
                                { name: 'Maple Avenue', score: 92, color: '#5fb3f6' },
                                { name: 'Tech Central', score: 75, color: '#ffa502' }
                            ].map((lot, i) => (
                                <Box key={i} sx={{ mb: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="caption">{lot.name}</Typography>
                                        <Typography variant="caption" sx={{ fontWeight: 700 }}>{lot.score}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={lot.score}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: `${lot.color}20`,
                                            '& .MuiLinearProgress-bar': { bgcolor: lot.color, borderRadius: 3 }
                                        }}
                                    />
                                </Box>
                            ))}
                        </Paper>
                    </Grid>

                    {/* Recent Activity */}
                    <Grid size={{ xs: 12, md: 4 }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                            <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Recent Activity</Typography>
                            <Box>
                                {[
                                    { action: 'New booking', location: 'Downtown Central', time: '2 min ago' },
                                    { action: 'Spot released', location: 'Maple Avenue', time: '15 min ago' },
                                    { action: 'Payment received', location: 'Tech Central', time: '1 hour ago' },
                                    { action: 'New listing', location: 'Eco-Park', time: '2 hours ago' },
                                ].map((activity, i) => (
                                    <Box key={i} sx={{ mb: 2, pb: 2, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.08)' : 'none' }}>
                                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{activity.action}</Typography>
                                        <Typography variant="caption" color="text.secondary">{activity.location}</Typography>
                                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                            {activity.time}
                                        </Typography>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Container>
        </MainLayout>
    );
};

export default Dashboard;
