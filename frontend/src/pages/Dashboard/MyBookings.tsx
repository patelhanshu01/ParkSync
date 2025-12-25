import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Stack, Chip, Button, Divider, CircularProgress, Alert, Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloseIcon from '@mui/icons-material/Close';
import { QRCodeSVG } from 'qrcode.react';
import { getMyBookings, Reservation } from '../../api/reservationApi';
import { useNavigate } from 'react-router-dom';

const MyBookings: React.FC = () => {
    const [bookings, setBookings] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBooking, setSelectedBooking] = useState<Reservation | null>(null);
    const navigate = useNavigate();

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
                        </DialogContent>
                    </>
                )}
            </Dialog>
        </Container>
    );
};

export default MyBookings;
