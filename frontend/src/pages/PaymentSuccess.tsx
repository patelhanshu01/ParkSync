import React from 'react';
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
} from '@mui/material';
import { QRCodeSVG } from 'qrcode.react';
import { ParkingLot, ParkingSpot } from '../types/Parking';

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

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h1" sx={{ fontSize: '64px', mb: 2 }}>✅</Typography>
                <Typography variant="h3" color="success.main" gutterBottom fontWeight={700}>
                    Payment Successful!
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                    Your parking spot is reserved.
                </Typography>

                {/* QR Code Section */}
                <Paper elevation={3} sx={{ display: 'inline-block', p: 4, my: 4, borderRadius: 3 }}>
                    <QRCodeSVG
                        value={`PARKSYNC-RES-${reservationId}`}
                        size={200}
                        level="H"
                        includeMargin={true}
                    />
                    <Typography variant="h6" fontWeight={700} sx={{ mt: 2 }}>
                        RESERVATION ID: {reservationId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Please scan this QR code at the entry gate.
                    </Typography>
                </Paper>

                {/* Booking Details */}
                <Card elevation={2}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom fontWeight={600} textAlign="left">
                            Booking Details
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, textAlign: 'left' }}>
                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                            <Typography variant="body2" fontWeight={600}>{lot.name}</Typography>

                            <Typography variant="body2" color="text.secondary">Spot Number:</Typography>
                            <Typography variant="body2" fontWeight={600}>
                                {selectedSpot.spot_number} ({selectedSpot.floor_level !== undefined && selectedSpot.floor_level > 0 ? `Floor ${selectedSpot.floor_level}` : 'Ground Floor'})
                            </Typography>

                            <Typography variant="body2" color="text.secondary">Duration:</Typography>
                            <Typography variant="body2" fontWeight={600}>{duration} hour{duration > 1 ? 's' : ''}</Typography>

                            <Typography variant="body2" color="text.secondary">Amount Paid:</Typography>
                            <Typography variant="body2" fontWeight={600} color="success.main">${totalCost.toFixed(2)}</Typography>
                        </Box>
                    </CardContent>
                </Card>

                <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => navigate('/')}
                    sx={{ mt: 3, py: 1.5, borderRadius: 3, fontWeight: 700 }}
                >
                    Back to Home
                </Button>
            </Box>
        </Container>
    );
};

export default PaymentSuccess;
