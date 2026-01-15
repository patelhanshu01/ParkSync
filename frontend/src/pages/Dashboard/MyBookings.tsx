import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Container, Typography, Box, Paper, Stack, Chip, Button, Divider, CircularProgress, Alert, Dialog, DialogContent, DialogTitle, IconButton, Switch, FormControlLabel, Tabs, Tab } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import { getMyBookings, Reservation, setAutoExtend, extendReservation, endReservation } from '../../api/reservationApi';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleMap, MarkerF, DirectionsRenderer, useJsApiLoader, Libraries } from '@react-google-maps/api';

const MAP_LIBRARIES: Libraries = ['places'];
const EXTEND_OPTIONS = [15, 30, 60];
const DEFAULT_AUTO_EXTEND_INTERVAL = 15;
const DEFAULT_AUTO_EXTEND_CAP = 120;

type BookingStatus = 'ended' | 'upcoming' | 'active' | 'completed';
type BookingSection = 'current' | 'upcoming' | 'past';
type BookingSummary = {
    booking: Reservation;
    id: number;
    displayName: string;
    displayLocation: string;
    totalPaid: number;
    status: BookingStatus;
    isActive: boolean;
    startMs: number;
    endMs: number;
    startDateLabel: string;
    timeRangeLabel: string;
    destination: { lat: number; lng: number } | null;
};

const MyBookings: React.FC = () => {
    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
    const [selectedDest, setSelectedDest] = useState<{ lat: number; lng: number } | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [navError, setNavError] = useState<string | null>(null);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [actionError, setActionError] = useState<string | null>(null);
    const [autoExtendSaving, setAutoExtendSaving] = useState(false);
    const [extendSaving, setExtendSaving] = useState(false);
    const [endSaving, setEndSaving] = useState(false);
    const { isLoaded: mapLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        libraries: MAP_LIBRARIES
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

    const resolvedSection = useMemo<BookingSection>(() => {
        const section = searchParams.get('section');
        if (section === 'current' || section === 'upcoming' || section === 'past') {
            return section;
        }
        return 'current';
    }, [searchParams]);
    const [section, setSection] = useState<BookingSection>(resolvedSection);

    useEffect(() => {
        if (section !== resolvedSection) {
            setSection(resolvedSection);
        }
    }, [resolvedSection, section]);

    const fetchBookings = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const data = await getMyBookings();
            setBookings(data);
            setSelectedBooking((prev) => {
                if (!prev) return prev;
                return data.find((b) => b.id === prev.id) || null;
            });
        } catch (err) {
            setError('Failed to load bookings. Please try again.');
        } finally {
            if (showLoading) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const renderStatusChip = (status: BookingStatus) => {
        if (status === 'ended') {
            return <Chip label="Ended" color="default" size="small" />;
        }
        if (status === 'upcoming') {
            return <Chip label="Upcoming" color="primary" size="small" />;
        }
        if (status === 'active') {
            return <Chip label="Active" color="success" size="small" />;
        }
        return <Chip label="Completed" color="default" size="small" />;
    };

    // Queue feature removed: no polling needed.

    // Queue actions removed.

    const resolveDestination = (booking: Reservation) => {
        const lotAny = booking.parkingLot as any;
        const lat = lotAny?.latitude ?? lotAny?.lat ?? booking.listing?.latitude;
        const lng = lotAny?.longitude ?? lotAny?.lng ?? booking.listing?.longitude;
        if (lat === undefined || lng === undefined || lat === null || lng === null) return null;
        return { lat: Number(lat), lng: Number(lng) };
    };

    const getDisplayName = (booking: Reservation) => booking.parkingLot?.name || booking.listing?.title || 'Unknown Lot';
    const getDisplayLocation = (booking: Reservation) => booking.parkingLot?.location || booking.listing?.address || booking.listing?.location || 'Location not available';
    const getTotalPaid = (booking: Reservation) => {
        if (!booking.payments?.length) return 0;
        return booking.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    };

    const bookingSummaries = useMemo(() => {
        const nowMs = Date.now();
        const out = new Array<BookingSummary>(bookings.length);
        for (let i = 0; i < bookings.length; i++) {
            const booking = bookings[i];
            const startMs = Date.parse(booking.startTime);
            const endMs = Date.parse(booking.endTime);
            let status: BookingStatus;
            if (booking.endedAt) {
                status = 'ended';
            } else if (nowMs < startMs) {
                status = 'upcoming';
            } else if (nowMs >= startMs && nowMs <= endMs) {
                status = 'active';
            } else {
                status = 'completed';
            }
            const startDate = new Date(startMs);
            const endDate = new Date(endMs);
            const displayName = getDisplayName(booking);
            const displayLocation = getDisplayLocation(booking);
            const totalPaid = getTotalPaid(booking);
            const destination = resolveDestination(booking);
            out[i] = {
                booking,
                id: booking.id,
                displayName,
                displayLocation,
                totalPaid,
                status,
                isActive: status === 'active',
                startMs,
                endMs,
                startDateLabel: startDate.toLocaleDateString(),
                timeRangeLabel: `${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                destination
            };
        }
        return out;
    }, [bookings]);

    const sectionCounts = useMemo(() => {
        let current = 0;
        let upcoming = 0;
        let past = 0;
        for (let i = 0; i < bookingSummaries.length; i++) {
            const status = bookingSummaries[i].status;
            if (status === 'active') {
                current += 1;
            } else if (status === 'upcoming') {
                upcoming += 1;
            } else {
                past += 1;
            }
        }
        return { current, upcoming, past };
    }, [bookingSummaries]);

    const filteredSummaries = useMemo(() => {
        if (section === 'current') {
            return bookingSummaries.filter((summary) => summary.status === 'active');
        }
        if (section === 'upcoming') {
            return bookingSummaries.filter((summary) => summary.status === 'upcoming');
        }
        return bookingSummaries.filter((summary) => summary.status === 'ended' || summary.status === 'completed');
    }, [bookingSummaries, section]);

    const handleSectionChange = (_event: React.SyntheticEvent, value: BookingSection) => {
        if (value === section) return;
        setSection(value);
        setSearchParams({ section: value }, { replace: true });
    };

    const selectedSummary = useMemo(() => {
        if (!selectedBooking) return null;
        for (let i = 0; i < bookingSummaries.length; i++) {
            if (bookingSummaries[i].id === selectedBooking.id) {
                return bookingSummaries[i];
            }
        }
        return null;
    }, [bookingSummaries, selectedBooking]);

    const selectedMinutesLeft = useMemo(() => {
        if (!selectedSummary) return null;
        return Math.ceil((selectedSummary.endMs - Date.now()) / 60000);
    }, [selectedSummary]);
    const selectedDestination = selectedDest || selectedSummary?.destination || null;

    const startInAppNavigation = (booking: Reservation, destOverride?: { lat: number; lng: number } | null) => {
        setNavError(null);
        setDirections(null);
        setUserPos(null);
        const destination = destOverride || resolveDestination(booking);
        if (!destination) {
            setNavError('No coordinates available for this booking.');
            return;
        }
        setMapCenter(destination);

        // Also open external Google Maps as a fallback
        const mapsLink = `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}`;
        window.open(mapsLink, '_blank');

        if (!navigator.geolocation) {
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
                    undefined,
                    { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
                );
                setWatchId(id);
            },
            undefined
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

    useEffect(() => {
        if (!selectedBooking || !mapLoaded) return;
        const dest = resolveDestination(selectedBooking);
        setSelectedDest(dest);
        setMapCenter(dest);

        if (!dest && (selectedBooking.listing?.address || selectedBooking.listing?.location) && window.google?.maps?.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            geocoder.geocode(
                { address: selectedBooking.listing.address || selectedBooking.listing.location || '' },
                (results, status) => {
                    if (status === 'OK' && results?.[0]?.geometry?.location) {
                        const loc = results[0].geometry.location;
                        const resolved = { lat: loc.lat(), lng: loc.lng() };
                        setSelectedDest(resolved);
                        setMapCenter(resolved);
                    }
                }
            );
        }
    }, [selectedBooking, mapLoaded]);

    const handleAutoExtendToggle = async (booking: Reservation, enabled: boolean) => {
        setActionError(null);
        setAutoExtendSaving(true);
        try {
            const intervalMinutes = booking.autoExtendIntervalMinutes ?? DEFAULT_AUTO_EXTEND_INTERVAL;
            const capMinutes = booking.autoExtendCapMinutes ?? DEFAULT_AUTO_EXTEND_CAP;
            await setAutoExtend(booking.id, { enabled, intervalMinutes, capMinutes });
            await fetchBookings(false);
        } catch (err) {
            setActionError('Failed to update auto-extend settings.');
        } finally {
            setAutoExtendSaving(false);
        }
    };

    const handleExtend = async (booking: Reservation, minutes: number) => {
        setActionError(null);
        setExtendSaving(true);
        try {
            await extendReservation(booking.id, minutes);
            await fetchBookings(false);
        } catch (err) {
            setActionError('Failed to extend reservation.');
        } finally {
            setExtendSaving(false);
        }
    };

    const handleEndParking = async (booking: Reservation) => {
        setActionError(null);
        setEndSaving(true);
        try {
            await endReservation(booking.id);
            await fetchBookings(false);
        } catch (err) {
            setActionError('Failed to end reservation.');
        } finally {
            setEndSaving(false);
        }
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
                <Box>
                    <Tabs
                        value={section}
                        onChange={handleSectionChange}
                        sx={{ mb: 3 }}
                        textColor="primary"
                        indicatorColor="primary"
                        variant="scrollable"
                        allowScrollButtonsMobile
                    >
                        <Tab label={`Current (${sectionCounts.current})`} value="current" />
                        <Tab label={`Upcoming (${sectionCounts.upcoming})`} value="upcoming" />
                        <Tab label={`Past (${sectionCounts.past})`} value="past" />
                    </Tabs>

                    {filteredSummaries.length === 0 ? (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
                            <Typography variant="h6" color="text.secondary">
                                {section === 'current' ? 'No current bookings' : section === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
                            </Typography>
                            <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
                                Find Parking
                            </Button>
                        </Paper>
                    ) : (
                        <Stack spacing={3}>
                            {filteredSummaries.map((summary) => {
                                const booking = summary.booking;
                                return (
                                    <Box key={summary.id}>
                                        <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { sm: 'center' }, gap: 2 }}>
                                            <Box>
                                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                                    <Typography variant="h6" fontWeight="bold">
                                                        {summary.displayName}
                                                    </Typography>
                                                    {renderStatusChip(summary.status)}
                                                    {booking.autoExtendEnabled && (
                                                        <Chip label="Auto-extend" color="info" size="small" />
                                                    )}
                                                </Box>

                                                <Box display="flex" alignItems="center" gap={1} color="text.secondary" mb={0.5}>
                                                    <LocationOnIcon fontSize="small" />
                                                    <Typography variant="body2">
                                                        {summary.displayLocation}
                                                    </Typography>
                                                </Box>

                                                <Box display="flex" alignItems="center" gap={2} mt={1}>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <EventIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {summary.startDateLabel}
                                                        </Typography>
                                                    </Box>
                                                    <Box display="flex" alignItems="center" gap={0.5}>
                                                        <AccessTimeIcon fontSize="small" color="action" />
                                                        <Typography variant="body2">
                                                            {summary.timeRangeLabel}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>

                                            <Box textAlign={{ xs: 'left', sm: 'right' }}>
                                                <Typography variant="h6" color="primary.main" fontWeight="bold">
                                                    ${summary.totalPaid.toFixed(2)}
                                                </Typography>
                                                <Button size="small" sx={{ mt: 1 }} onClick={() => {
                                                    setSelectedBooking(booking);
                                                    setSelectedDest(summary.destination);
                                                    setMapCenter(summary.destination);
                                                }}>
                                                    View Details
                                                </Button>
                                            </Box>
                                        </Paper>
                                    </Box>
                                );
                            })}
                        </Stack>
                    )}
                </Box>
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
                            {selectedSummary?.isActive && selectedMinutesLeft !== null && selectedMinutesLeft <= 10 && selectedMinutesLeft >= 0 && (
                                <Alert severity="warning" sx={{ mb: 2 }}>
                                    {selectedMinutesLeft} minutes left. Extend now to avoid overage.
                                </Alert>
                            )}

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
                                {selectedSummary?.displayName || getDisplayName(selectedBooking)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                {selectedSummary?.displayLocation || getDisplayLocation(selectedBooking)}
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
                                        ${(selectedSummary?.totalPaid ?? getTotalPaid(selectedBooking)).toFixed(2)}
                                    </Typography>
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary">Status</Typography>
                                    <Box>{renderStatusChip(selectedSummary?.status || 'completed')}</Box>
                                </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Auto-extend</Typography>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={!!selectedBooking.autoExtendEnabled}
                                            onChange={(e) => handleAutoExtendToggle(selectedBooking, e.target.checked)}
                                            disabled={autoExtendSaving || !!selectedBooking.endedAt}
                                        />
                                    }
                                    label={`Extend every ${selectedBooking.autoExtendIntervalMinutes ?? DEFAULT_AUTO_EXTEND_INTERVAL} min, up to ${selectedBooking.autoExtendCapMinutes ?? DEFAULT_AUTO_EXTEND_CAP} min`}
                                />
                                <Typography variant="caption" color="text.secondary">
                                    Auto-extend charges in small increments until you tap End Parking or reach the cap.
                                </Typography>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'grid', gap: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Extend now</Typography>
                                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                                    {EXTEND_OPTIONS.map((minutes) => (
                                        <Button
                                            key={minutes}
                                            variant="outlined"
                                            onClick={() => handleExtend(selectedBooking, minutes)}
                                            disabled={extendSaving || !!selectedBooking.endedAt}
                                        >
                                            +{minutes} min
                                        </Button>
                                    ))}
                                </Stack>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ display: 'grid', gap: 1 }}>
                                <Typography variant="subtitle2" fontWeight="bold">End parking</Typography>
                                <Button
                                    variant="contained"
                                    color="error"
                                    onClick={() => handleEndParking(selectedBooking)}
                                    disabled={endSaving || !selectedSummary?.isActive}
                                >
                                    End Parking
                                </Button>
                                <Typography variant="caption" color="text.secondary">
                                    Tap when you exit so auto-extend stops.
                                </Typography>
                            </Box>

                            {actionError && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {actionError}
                                </Alert>
                            )}

                            <Box sx={{ mt: 3, display: 'grid', gap: 1.5 }}>
                                <Typography variant="subtitle2" fontWeight="bold">Navigation</Typography>
                                {mapLoaded && (selectedDestination || resolveDestination(selectedBooking)) ? (
                                    <Box sx={{ height: 240, borderRadius: 2, overflow: 'hidden' }}>
                                        <GoogleMap
                                            mapContainerStyle={{ width: '100%', height: '100%' }}
                                            center={mapCenter || selectedDestination || resolveDestination(selectedBooking)!}
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
                                            <MarkerF position={(selectedDestination || resolveDestination(selectedBooking))!} />
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
                                        onClick={() => startInAppNavigation(selectedBooking, selectedDestination)}
                                        disabled={!selectedDestination || !mapLoaded}
                                    >
                                        Start navigation
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        fullWidth
                                        onClick={() => {
                                            setDirections(null);
                                            setMapCenter(selectedDestination);
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
