import React, { useEffect, useRef, useState } from 'react';
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
    Chip,
    Alert
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { ParkingLot, ParkingSpot } from '../types/Parking';
import { GoogleMap, MarkerF, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const PaymentSuccess: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as {
        lot: ParkingLot;
        selectedSpot: ParkingSpot;
        duration: number;
        totalCost: number;
        reservationId: string;
    } | null;

    const { isLoaded: mapLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
    });

    const mapRef = useRef<google.maps.Map | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [navError, setNavError] = useState<string | null>(null);
    const [etaText, setEtaText] = useState<string | null>(null);
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const recalcRef = useRef<number>(0);

    const destination = state?.lot?.latitude && state.lot.longitude
        ? { lat: Number(state.lot.latitude), lng: Number(state.lot.longitude) }
        : null;

    useEffect(() => {
        if (watchId !== null) {
            return () => {
                navigator.geolocation.clearWatch(watchId);
            };
        }
        return;
    }, [watchId]);

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

    const { lot, selectedSpot, duration, totalCost, reservationId } = state;

    const startNavigation = () => {
        setNavError(null);
        setEtaText(null);
        setDirections(null);
        if (!destination) {
            setNavError('No coordinates for this parking lot.');
            return;
        }
        if (!navigator.geolocation) {
            setNavError('Geolocation is not supported on this device.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(origin);
                calculateRoute(origin);
                const id = navigator.geolocation.watchPosition(
                    (p) => {
                        const current = { lat: p.coords.latitude, lng: p.coords.longitude };
                        setUserPos(current);
                        const now = Date.now();
                        if (now - recalcRef.current > 15000) {
                            recalcRef.current = now;
                            calculateRoute(current);
                        }
                    },
                    () => setNavError('Location permission denied. Enable location to get turn-by-turn directions.'),
                    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
                );
                setWatchId(id);
            },
            () => setNavError('Location permission denied. Enable location to get turn-by-turn directions.')
        );
    };

    const calculateRoute = (origin: { lat: number; lng: number }) => {
        if (!window.google?.maps || !destination) {
            setNavError('Maps SDK not loaded. Please try again.');
            return;
        }
        const service = new google.maps.DirectionsService();
        service.route(
            {
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);
                    const leg = result.routes[0]?.legs?.[0];
                    if (leg?.duration?.text) setEtaText(leg.duration.text);
                    if (mapRef.current) {
                        mapRef.current.setCenter(leg?.end_location || destination);
                        mapRef.current.setZoom(14);
                        mapRef.current.setTilt(67.5);
                        mapRef.current.setHeading(25);
                    }
                } else {
                    setNavError('Unable to fetch directions. Try again.');
                }
            }
        );
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
                                <Typography fontWeight={700}>{lot.name}</Typography>
                            </Stack>
                            <Stack direction="row" justifyContent="space-between">
                                <Typography variant="body2" sx={{ opacity: 0.8 }}>Spot</Typography>
                                <Typography fontWeight={700}>{selectedSpot.spot_number}</Typography>
                            </Stack>
                            {selectedSpot.floor_level !== undefined && (
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
                            {destination && mapLoaded ? (
                                <Box sx={{ position: 'relative', height: 260, borderRadius: 2, overflow: 'hidden' }}>
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%' }}
                                        center={destination}
                                        zoom={16}
                                        options={{
                                            disableDefaultUI: true,
                                            zoomControl: true,
                                            mapTypeId: 'roadmap',
                                            gestureHandling: 'greedy'
                                        }}
                                        onLoad={(map) => {
                                            mapRef.current = map;
                                        }}
                                    >
                                        {userPos && <MarkerF position={userPos} />}
                                        <MarkerF position={destination} />
                                        {directions && <DirectionsRenderer directions={directions} />}
                                    </GoogleMap>
                                    <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', px: 1.5, py: 0.5, borderRadius: 1 }}>
                                        <Typography variant="caption">
                                            ETA: {etaText ? etaText : '—'}
                                        </Typography>
                                    </Box>
                                </Box>
                            ) : (
                                <Typography variant="body2" color="text.secondary">
                                    Navigation map unavailable. {destination ? 'Try again later.' : 'No coordinates provided.'}
                                </Typography>
                            )}
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                                <Button
                                    variant="contained"
                                    fullWidth
                                    onClick={startNavigation}
                                    disabled={!destination || !mapLoaded}
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
                            {etaText && (
                                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                    ETA: {etaText}
                                </Typography>
                            )}
                            {navError && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    {navError}
                                </Alert>
                            )}
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
