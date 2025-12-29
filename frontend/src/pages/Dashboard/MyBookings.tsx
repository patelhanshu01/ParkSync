import React, { useEffect, useRef, useState } from 'react';
import { Container, Typography, Box, Paper, Stack, Chip, Button, Divider, CircularProgress, Alert, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import { getMyBookings, Reservation } from '../../api/reservationApi';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, MarkerF, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api';

const MyBookings: React.FC = () => {
    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [navError, setNavError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const navigate = useNavigate();
    const { isLoaded: mapLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries: ['places']
    });
    const mapRef = useRef<google.maps.Map | null>(null);
    const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);
    const recalcRef = useRef<number>(0);

    useEffect(() => {
        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [watchId]);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const data = await getMyBookings();
                setBookings(data);
            } catch (err) {
                setError('Failed to load bookings. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, []);

    const getStatusChip = (startTime: string, endTime: string) => {
        const now = new Date();
        const start = new Date(startTime);
        const end = new Date(endTime);

        if (now < start) {
            return <Chip label="Upcoming" color="primary" size="small" />;
        } else if (now >= start && now <= end) {
            return <Chip label="Active" color="success" size="small" />;
        } else {
            return <Chip label="Completed" color="default" size="small" />;
        }
    };

    

    // Queue feature removed: no polling needed.

    // Queue actions removed.

    const resolveDestination = (booking: Reservation) => {
        const lotAny = booking.parkingLot as any;
        const lat = lotAny?.latitude ?? lotAny?.lat;
        const lng = lotAny?.longitude ?? lotAny?.lng;
        if (lat === undefined || lng === undefined || lat === null || lng === null) return null;
        return { lat: Number(lat), lng: Number(lng) };
    };

    const startInAppNavigation = (booking: Reservation) => {
        setNavError(null);
        setDirections(null);
        setUserPos(null);
        const destination = resolveDestination(booking);
        if (!destination) {
            setNavError('No coordinates available for this parking lot.');
            return;
        }
        setMapCenter(destination);

        if (!navigator.geolocation) {
            setNavError('Geolocation is not supported by your browser.');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const origin = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(origin);
                calculateRoute(origin, destination);
                const id = navigator.geolocation.watchPosition(
                    (p) => {
                        const current = { lat: p.coords.latitude, lng: p.coords.longitude };
                        setUserPos(current);
                        const now = Date.now();
                        if (now - recalcRef.current > 15000) {
                            recalcRef.current = now;
                            calculateRoute(current, destination);
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

    const calculateRoute = (origin: { lat: number; lng: number }, destination: { lat: number; lng: number }) => {
        if (!window.google?.maps) {
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
                    if (mapRef.current) {
                        mapRef.current.setCenter(result.routes[0]?.legs?.[0]?.end_location || destination);
                        mapRef.current.setTilt(67.5);
                        mapRef.current.setHeading(45);
                    }
                } else {
                    setNavError('Unable to fetch directions right now.');
                }
            }
        );
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    My Bookings
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/')}>
                    Back to Map
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {bookings.length === 0 && !error ? (
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                    <DirectionsCarIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                        No bookings yet
                    </Typography>
                    <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                        Find Parking
                    </Button>
                </Paper>
            ) : (
                <Stack spacing={3}>
                    {bookings.map((booking) => (
                        <Box key={booking.id}>
                            <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                                <Box>
                                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                                        <Typography variant="h6" fontWeight="bold">
                                            {booking.parkingLot?.name || 'Unknown Lot'}
                                        </Typography>
                                        {getStatusChip(booking.startTime, booking.endTime)}
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={1} color="text.secondary" mb={0.5}>
                                        <LocationOnIcon fontSize="small" />
                                        <Typography variant="body2">
                                            {booking.parkingLot?.location || 'Location not available'}
                                        </Typography>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={2} mt={1}>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <EventIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {new Date(booking.startTime).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" alignItems="center" gap={0.5}>
                                            <AccessTimeIcon fontSize="small" color="action" />
                                            <Typography variant="body2">
                                                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(booking.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Box>

                                <Box textAlign={{ xs: 'left', sm: 'right' }}>
                                    <Typography variant="h6" color="primary.main" fontWeight="bold">
                                        ${booking.payments?.[0]?.amount ? Number(booking.payments[0].amount).toFixed(2) : '0.00'}
                                    </Typography>
                                    <Button size="small" sx={{ mt: 1 }} onClick={() => setSelectedBooking(booking)}>
                                        View Details
                                    </Button>
                                </Box>
                            </Paper>
                        </Box>
                    ))}
                </Stack>
            )}

            {/* Booking Details Modal */}
            <Dialog
                open={!!selectedBooking}
                onClose={() => setSelectedBooking(null)}
                maxWidth="sm"
                fullWidth
            >
                {selectedBooking && (
                    <>
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Booking Details
                            <IconButton onClick={() => setSelectedBooking(null)}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            {/* Queue feature removed - reserved/occupancy info will be shown on the floor layout */}
                            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                                <Paper elevation={3} sx={{ p: 2, borderRadius: 2, mb: 2 }}>
                                    <QRCodeSVG
                                        value={`PARKSYNC-RES-${selectedBooking.id}`}
                                        size={180}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </Paper>
                                <Typography variant="caption" color="text.secondary">
                                    Scan at entry
                                </Typography>
                                <Typography variant="h6" color="primary" fontWeight="bold">
                                    {selectedBooking.spot ? `Spot ${selectedBooking.spot.spot_number}` : `Ref: ${selectedBooking.id}`}
                                </Typography>
                            </Box>

                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                {selectedBooking.parkingLot?.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {selectedBooking.parkingLot?.location}
                            </Typography>

                            <Divider sx={{ my: 2 }} />

                            <Box display="grid" gridTemplateColumns="1fr 1fr" gap={2}>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Start Time</Typography>
                                    <Typography variant="body1">{new Date(selectedBooking.startTime).toLocaleString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">End Time</Typography>
                                    <Typography variant="body1">{new Date(selectedBooking.endTime).toLocaleString()}</Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Amount Paid</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="success.main">
                                        ${selectedBooking.payments?.[0]?.amount ? Number(selectedBooking.payments[0].amount).toFixed(2) : '0.00'}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Box>{getStatusChip(selectedBooking.startTime, selectedBooking.endTime)}</Box>
                                </Box>
                            </Box>

                            <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Navigation</Typography>
                                {mapLoaded && resolveDestination(selectedBooking) ? (
                                    <Box sx={{ height: 240, borderRadius: 2, overflow: 'hidden' }}>
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={mapCenter || resolveDestination(selectedBooking)!}
                                            zoom={15}
                                            options={{
                                                disableDefaultUI: true,
                                                zoomControl: true,
                                                mapTypeId: 'roadmap',
                                                gestureHandling: 'greedy'
                                            }}
                                            onLoad={(map) => { mapRef.current = map; }}
                                        >
                                            {userPos && <MarkerF position={userPos} />}
                                            <MarkerF position={resolveDestination(selectedBooking)!} />
                                            {directions && <DirectionsRenderer directions={directions} />}
                                        </GoogleMap>
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">
                                        Map unavailable for this booking. Coordinates not provided.
                                    </Typography>
                                )}
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        startIcon={<DirectionsCarIcon />}
                                        onClick={() => startInAppNavigation(selectedBooking)}
                                        disabled={!resolveDestination(selectedBooking) || !mapLoaded}
                                    >
                                        Start navigation
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => {
                                            setDirections(null);
                                            setMapCenter(resolveDestination(selectedBooking) || null);
                                            setUserPos(null);
                                            if (watchId !== null) {
                                                navigator.geolocation.clearWatch(watchId);
                                                setWatchId(null);
                                            }
                                        }}
                                    >
                                        Reset view
                                    </Button>
                                </Stack>
                                {navError && (
                                    <Alert severity="warning" sx={{ mt: 1 }}>
                                        {navError}
                                    </Alert>
                                )}
                                {!navError && (
                                    <Typography variant="caption" color="text.secondary">
                                        Tap when you are ready to drive. We use your device location and render the route in-app.
                                    </Typography>
                                )}
                            </Box>
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Container>
    );
};

export default MyBookings;
