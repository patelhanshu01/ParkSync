import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    Typography,
    Chip,
    Slider,
    CircularProgress,
    Alert,
    Paper,
    TextField,
    Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { ParkingLot, ParkingSpot } from '../types/Parking';
import { getParkingLotById } from '../api/parkingApi';
import SpotVisualization from '../Components/SpotVisualization';
import EcoBadge from '../Components/badges/EcoBadge';
import FeatureBadge from '../Components/badges/FeatureBadge';

const LotDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [lot, setLot] = useState<ParkingLot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
    const [duration, setDuration] = useState(2); // hours
    // Initialize with current time in local format for datetime-local input
    const [startTime, setStartTime] = useState(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        return now.toISOString().slice(0, 16);
    });

    useEffect(() => {
        const fetchLot = async () => {
            try {
                const response = await getParkingLotById(parseInt(id!), { includeReservations: true });
                console.log('Fetched Lot:', response.data);
                console.log('Spots:', response.data.spots);
                const fetchedLot = response.data;
                const state = location.state as { distance_km?: number };

                if (state?.distance_km !== undefined) {
                    fetchedLot.distance_km = state.distance_km;
                }

                setLot(fetchedLot);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch parking lot details');
                setLoading(false);
            }
        };

        if (id) fetchLot();
    }, [id, location.state]);

    const handleReserve = () => {
        if (!selectedSpot && lot?.spots && lot.spots.length > 0) {
            alert('Please select a parking spot');
            return;
        }
        const selectedDate = new Date(startTime);
        navigate('/payment', {
            state: {
                lot,
                selectedSpot,
                duration,
                startTime: selectedDate.toISOString(),
                totalCost: (Number(lot?.pricePerHour) || 0) * duration
            }
        });
    };

    if (loading) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <CircularProgress size={60} />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
                Loading parking lot details...
            </Typography>
        </Box>
    );

    if (error || !lot) return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 3 }}>
            <Typography variant="h1" sx={{ fontSize: '48px', mb: 2 }}>⚠️</Typography>
            <Alert severity="error">{error || 'Parking lot not found'}</Alert>
        </Box>
    );

    const totalCost = Number(lot.pricePerHour) * duration;
    const isSelectedSpotReserved = !!(selectedSpot && selectedSpot.nextReservation && new Date(selectedSpot.nextReservation.endTime) > new Date());
    let selectedSpotAvailabilityStr = '';
    if (isSelectedSpotReserved && selectedSpot && selectedSpot.nextReservation) {
        const end = new Date(selectedSpot.nextReservation.endTime);
        const now = new Date();
        const minutesRemaining = Math.ceil((end.getTime() - now.getTime()) / 60000);
        selectedSpotAvailabilityStr = minutesRemaining < 60 ? `${minutesRemaining} min` : `${Math.ceil(minutesRemaining / 60)} hr`;
    }

    return (
        <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Back Button */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/')}
                variant="outlined"
                sx={{ mb: 3 }}
            >
                Back to Search
            </Button>

            {/* Lot Header */}
            <Card elevation={2} sx={{ mb: 3, overflow: 'hidden' }}>
                {lot.imageUrl && (
                    <CardMedia
                        component="img"
                        height="300"
                        image={lot.imageUrl}
                        alt={lot.name}
                        sx={{
                            objectFit: 'cover',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                        }}
                    />
                )}
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h3" gutterBottom fontWeight={700}>
                        {lot.name}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        📍 {lot.location}
                    </Typography>

                    {/* Badges */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 2 }}>
                        {lot.co2_impact && <EcoBadge co2Impact={lot.co2_impact} />}
                        {lot.has_ev_charging && <FeatureBadge type="ev" />}
                        {lot.is_covered && <FeatureBadge type="covered" />}
                        {lot.has_cctv && <FeatureBadge type="cctv" />}
                    </Box>

                    {/* Key Info Grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mt: 2 }}>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Price per Hour
                            </Typography>
                            <Typography variant="h4" color="primary" fontWeight={700}>
                                ${Number(lot.pricePerHour).toFixed(2)}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography variant="caption" color="text.secondary" display="block">
                                Availability
                            </Typography>
                            <Typography variant="h6" fontWeight={600}>
                                <Box component="span" color="primary.main">{lot.availableSpots || 0}</Box> / {lot.totalSpots || 0} spots
                            </Typography>
                        </Box>
                        {lot.distance_km !== undefined && (
                            <Box>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Distance
                                </Typography>
                                <Typography variant="h6" fontWeight={600}>
                                    {Number(lot.distance_km).toFixed(1)} km
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* EV Chargers */}
                    {lot.ev_chargers && lot.ev_chargers.length > 0 && (
                        <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'rgba(26, 115, 232, 0.08)' }}>
                            <Typography variant="h6" color="primary" gutterBottom>
                                ⚡ EV Charging Options
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {lot.ev_chargers.map((charger, idx) => (
                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', pb: 1, borderBottom: idx < lot.ev_chargers!.length - 1 ? 1 : 0, borderColor: 'divider' }}>
                                        <Typography variant="body2">
                                            <strong>{charger.connector_type}</strong> - {Number(charger.power_kw).toFixed(0)}kW
                                        </Typography>
                                        <Chip
                                            label={charger.availability ? 'Available' : 'In Use'}
                                            color={charger.availability ? 'success' : 'error'}
                                            size="small"
                                        />
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    )}
                </CardContent>
            </Card>

            {/* Spot Visualization Section */}
            <Card elevation={2} sx={{ mb: 3 }}>
                <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight={600}>
                            Select Your Parking Spot
                        </Typography>
                    </Box>

                    <Box sx={{ minHeight: '400px' }}>
                        <SpotVisualization
                            spots={lot.spots || []}
                            onSpotClick={setSelectedSpot}
                            selectedSpotId={selectedSpot?.id}
                        />
                    </Box>

                    {selectedSpot && (
                        <Paper elevation={0} sx={{ mt: 2, p: 2, bgcolor: 'rgba(26, 115, 232, 0.08)', border: 1, borderColor: 'primary.main' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">
                                        Selected Spot:
                                    </Typography>
                                    <Typography variant="h6" color="primary" fontWeight={700} sx={{ ml: 1 }} component="span">
                                        S-{selectedSpot.spot_number}
                                    </Typography>
                                    {selectedSpot.nextReservation && (() => {
                                        const end = new Date(selectedSpot.nextReservation!.endTime);
                                        const now = new Date();
                                        if (end > now) {
                                            const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                                            return (
                                                <Typography variant="body2" color="error" sx={{ display: 'block', mt: 0.5 }}>
                                                    🔒 Reserved until {endTimeStr} ({selectedSpotAvailabilityStr}). This spot is reserved by another user — it cannot be booked now.
                                                </Typography>
                                            );
                                        }
                                        return null;
                                    })()}
                                </Box>
                            </Box>
                        </Paper>
                    )}
                </CardContent>
            </Card>

            {/* Reservation Panel */}
            <Card elevation={3} sx={{ overflow: 'hidden', borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 3, md: 4 }, background: 'linear-gradient(135deg, #0d1625 0%, #0c2236 100%)', color: 'white' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography variant="h5" fontWeight={800}>
                            Confirm Reservation
                        </Typography>
                        <Chip label={lot.isAvailable ? 'Available' : 'Full'} color={lot.isAvailable ? 'success' : 'error'} />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' }, gap: 3, alignItems: 'start' }}>
                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>Start Time</Typography>
                            <TextField
                                type="datetime-local"
                                fullWidth
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                    '& .MuiInputBase-root': { color: 'white' },
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '& input::-webkit-calendar-picker-indicator': {
                                        filter: 'invert(61%) sepia(82%) saturate(420%) hue-rotate(121deg) brightness(93%) contrast(92%)'
                                    },
                                    mb: 2
                                }}
                                InputProps={{
                                    sx: {
                                        '& .MuiSvgIcon-root': { color: '#22d3ee' }
                                    }
                                }}
                            />

                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>Duration</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Adjust hours</Typography>
                                <Typography variant="body1" fontWeight={700}>{duration}h</Typography>
                            </Box>
                            <Slider
                                value={duration}
                                onChange={(_e, value) => setDuration(value as number)}
                                min={1}
                                max={24}
                                marks={[
                                    { value: 1, label: '1h' },
                                    { value: 12, label: '12h' },
                                    { value: 24, label: '24h' }
                                ]}
                                valueLabelDisplay="auto"
                                valueLabelFormat={(value) => `${value}h`}
                                sx={{
                                    color: '#22d3ee'
                                }}
                            />

                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                {[1, 2, 4, 8, 12, 24].map((h) => (
                                    <Chip
                                        key={h}
                                        label={`${h}h`}
                                        onClick={() => setDuration(h)}
                                        color={duration === h ? 'primary' : 'default'}
                                        variant={duration === h ? 'filled' : 'outlined'}
                                        sx={{ color: duration === h ? 'white' : 'rgba(255,255,255,0.8)' }}
                                    />
                                ))}
                            </Box>
                        </Paper>

                        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>Summary</Typography>
                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Spot</Typography>
                                    <Typography fontWeight={700}>{selectedSpot ? selectedSpot.spot_number : 'Select a spot'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Duration</Typography>
                                    <Typography fontWeight={700}>{duration} hour{duration !== 1 ? 's' : ''}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Rate</Typography>
                                    <Typography fontWeight={700}>${Number(lot.pricePerHour).toFixed(2)}/hr</Typography>
                                </Box>
                                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" fontWeight={800}>Total</Typography>
                                    <Typography variant="h4" color="success.light" fontWeight={800}>
                                        ${totalCost.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>

                            {isSelectedSpotReserved && (
                                <Typography variant="body2" color="warning.main" sx={{ mt: 2 }}>
                                    Spot reserved; available in {selectedSpotAvailabilityStr}. Choose another or wait.
                                </Typography>
                            )}

                            <Button
                                onClick={handleReserve}
                                disabled={!lot.isAvailable || isSelectedSpotReserved}
                                variant="contained"
                                fullWidth
                                sx={{ mt: 3, py: 1.6, fontWeight: 800, borderRadius: 2 }}
                            >
                                {isSelectedSpotReserved ? '🔒 Spot reserved' : (!lot.isAvailable ? '❌ Lot Fully Booked' : '🅿️ Reserve Now')}
                            </Button>
                        </Paper>
                    </Box>
                </CardContent>
            </Card>
        </Container >
    );
};

export default LotDetail;
