import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Grid, Button, CircularProgress, Paper, Chip } from '@mui/material';
import { getListings } from '../../api/listingApi';
import { Listing } from '../../types/Listing';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../Components/MainLayout';
import AddIcon from '@mui/icons-material/Add';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const AdminPastListings: React.FC = () => {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetch = async () => {
        setLoading(true);
        try {
            const res = await getListings();
            // Filter or just show all if we assuming this is the user's dashboard
            setListings(res.data.results || []);
        } catch (e) {
            console.error('Failed to fetch listings', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetch(); }, []);

    return (
        <MainLayout>
            <Container maxWidth="xl" sx={{ py: 6 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 6 }}>
                    <Box>
                        <Typography variant="h3" sx={{ fontWeight: 800, mb: 1, color: 'text.primary' }}>
                            Your Listing
                        </Typography>
                        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                            Manage your private parking spots and view their performance.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => navigate('/admin/create')}
                        sx={{
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            fontWeight: 700,
                            textTransform: 'none',
                            fontSize: '1rem',
                            boxShadow: '0 8px 16px rgba(0, 212, 170, 0.2)',
                        }}
                    >
                        Create New Listing
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
                        <CircularProgress size={60} thickness={4} />
                    </Box>
                ) : listings.length === 0 ? (
                    <Paper sx={{ p: 8, textAlign: 'center', borderRadius: 4, background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
                        <Typography variant="h5" color="text.secondary" gutterBottom>
                            No listings found
                        </Typography>
                        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                            You haven't listed any parking spots yet. Start earning money by listing your driveway today!
                        </Typography>
                        <Button variant="outlined" onClick={() => navigate('/admin/create')} sx={{ borderRadius: 2 }}>
                            Get Started
                        </Button>
                    </Paper>
                ) : (
                    <Grid container spacing={4}>
                        {listings.map((l) => (
                            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={l.id}>
                                <Paper
                                    elevation={0}
                                    sx={{
                                        borderRadius: 4,
                                        overflow: 'hidden',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': {
                                            transform: 'translateY(-6px)',
                                            borderColor: 'primary.main',
                                            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                                        }
                                    }}
                                >
                                    <Box sx={{ position: 'relative', height: 220 }}>
                                        <img
                                            src={l.imageUrl || 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80'}
                                            alt={l.title}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
                                            <Chip
                                                label={l.isActive ? 'Active' : 'Inactive'}
                                                color={l.isActive ? 'primary' : 'default'}
                                                sx={{ fontWeight: 700, borderRadius: 2 }}
                                            />
                                        </Box>
                                    </Box>
                                    <Box sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, height: 60, overflow: 'hidden' }}>
                                            {l.title}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                                            <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {l.address || 'Local Driveway, Brampton'}
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                            <Typography variant="h5" color="primary.main" sx={{ fontWeight: 800 }}>
                                                ${l.pricePerHour}/hr
                                            </Typography>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                            >
                                                Details
                                            </Button>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Container>
        </MainLayout>
    );
};

export default AdminPastListings;
