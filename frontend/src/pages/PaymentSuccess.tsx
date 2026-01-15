import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Paper,
    Divider,
    Stack,
    Chip
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { ParkingLot, ParkingSpot } from '../types/Parking';
import { Listing } from '../types/Listing';
import EmbeddedNavigation from '../Components/EmbeddedNavigation';

const PaymentSuccess: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as {
        lot?: ParkingLot;
        listing?: Listing;
        selectedSpot?: ParkingSpot;
        duration: number;
        totalCost: number;
        reservationId: string;
    } | null;

    const deriveDestination = () => {
        if (state?.lot?.latitude && state?.lot?.longitude) {
            return { lat: Number(state.lot.latitude), lng: Number(state.lot.longitude) };
        }
        if (state?.listing?.latitude && state?.listing?.longitude) {
            return { lat: Number(state.listing.latitude), lng: Number(state.listing.longitude) };
        }
        return null;
    };

    const [destination] = useState<{ lat: number; lng: number } | null>(deriveDestination);

    if (!state) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>No Reservation Found</Typography>
                    <Button variant="contained" onClick={() => navigate('/')}>Go Home</Button>
                </Box>
            </Container>
        );
    }

    const { lot, listing, selectedSpot, duration, totalCost, reservationId } = state;

    const buildExternalDirections = () => {
        if (!destination) return '';
        const name = encodeURIComponent(lot?.name || listing?.title || 'Destination');
        return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&destination_place_id=${name}`;
    };

    return (
        <Container maxWidth="md" sx={{ py: 4 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: 3, alignItems: 'stretch' }}>
                {/* Left: Confirmation summary */}
                <Card elevation={6} sx={{ borderRadius: 3, p: 2, bgcolor: 'linear-gradient(135deg, #0f172a, #0b1220)', color: 'white' }}>
                    <CardContent>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                            <Box>
                                <Typography variant="h5" fontWeight={800}>Reservation Confirmed</Typography>
                                <Typography variant="body2" sx={{ opacity: 0.7 }}>Show this at entry</Typography>
                            </Box>
                            <Chip label="Active" color="success" />
                        </Stack>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <QRCodeSVG
                                value={`PARKSYNC-RES-${reservationId}`}
                                size={200}
                                level="H"
                                includeMargin={true}
                            />
                            <Typography variant="h6" fontWeight={700} sx={{ mt: 2, textAlign: 'center' }}>
                                {reservationId}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', opacity: 0.8, mt: 0.5 }}>
                                Scan at the gate to enter
                            </Typography>
                        </Paper>

                        <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Location</Typography>
                                <Typography fontWeight={700}>{lot?.name || listing?.title}</Typography>
                            </Stack>
                            {selectedSpot && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Spot</Typography>
                                    <Typography fontWeight={700}>{selectedSpot.spot_number}</Typography>
                                </Stack>
                            )}
                            {selectedSpot?.floor_level !== undefined && (
                                <Stack direction="row" justifyContent="space-between">
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Level</Typography>
                                    <Typography fontWeight={700}>{selectedSpot.floor_level > 0 ? `Floor ${selectedSpot.floor_level}` : 'Ground'}</Typography>
                                </Stack>
                            )}
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Duration</Typography>
                                <Typography fontWeight={700}>{duration} hour{duration > 1 ? 's' : ''}</Typography>
                            </Stack>
                            <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.1)' }} />
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body1">Paid</Typography>
                                <Typography variant="h6" color="success.light" fontWeight={800}>${totalCost.toFixed(2)}</Typography>
                            </Stack>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 3 }}>
                            <Button fullWidth variant="contained" color="success" onClick={() => navigate('/')}>
                                Back to Home
                            </Button>
                            <Button fullWidth variant="outlined" onClick={() => navigate('/my-bookings')}>
                                View my bookings
                            </Button>
                        </Stack>
                    </CardContent>
                </Card>

                {/* Right: Info & next steps */}
                <Card elevation={3} sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ display: 'grid', gap: 2 }}>
                        <Typography variant="h6" fontWeight={700}>Get there</Typography>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            {destination || listing?.address || listing?.location ? (
                                <EmbeddedNavigation
                                    destination={{
                                        lat: destination?.lat,
                                        lng: destination?.lng,
                                        name: lot?.name || listing?.title || 'Destination',
                                        address: listing?.address || listing?.location || lot?.location
                                    }}
                                />
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Navigation map unavailable. No coordinates or address provided.
                                </Typography>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={() => {
                                        const link = buildExternalDirections();
                                        if (link) window.open(link, '_blank');
                                    }}
                                    disabled={!destination && !(listing?.address || listing?.location)}
                                >
                                    Start navigation
                                </Button>
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => navigate('/my-bookings')}
                                >
                                    Save for later
                                </Button>
                            </Stack>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Turn on location to see a live route from your current position to this lot.
                            </Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700}>Extend/Cancel</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Manage this reservation from “My Bookings” if your plans change.
                            </Typography>
                        </Paper>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="subtitle2" fontWeight={700}>Eco impact</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Guided parking reduces idle time and lowers CO₂. Thanks for choosing ParkSync.
                            </Typography>
                        </Paper>
                        <Divider />
                        <Typography variant="caption" color="text.secondary">
                            Need help? Contact support from the bookings tab.
                        </Typography>
                    </CardContent>
                </Card>
            </Box>
        </Container>
    );
};

export default PaymentSuccess;
