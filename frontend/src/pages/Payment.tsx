import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Container,
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    TextField,
    Radio,
    RadioGroup,
    FormControlLabel,
    FormControl,
    Alert,
    Divider,
    Paper,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AppleIcon from '@mui/icons-material/Apple';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import WalletDisplay from '../Components/WalletDisplay';
import { ParkingLot, ParkingSpot } from '../types/Parking';
import { createReservation } from '../api/reservationApi';
import { createPayment } from '../api/paymentApi';

const Payment: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const state = location.state as {
        lot: ParkingLot;
        selectedSpot?: ParkingSpot;
        duration: number;
        totalCost: number;
        startTime?: string;
    } | null;

    const [paymentMethod, setPaymentMethod] = useState<'card' | 'apple_google_pay' | 'wallet'>('card');
    const [walletAmount, setWalletAmount] = useState(0);
    const [processing, setProcessing] = useState(false);

    const [cardDetails, setCardDetails] = useState({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
    });
    const [validationError, setValidationError] = useState<string | null>(null);
    const [biometricAuthenticated, setBiometricAuthenticated] = useState(false);

    const { lot, selectedSpot, duration, totalCost, startTime } = state || { lot: {} as any, selectedSpot: undefined, duration: 0, totalCost: 0, startTime: undefined };
    const amountAfterWallet = Math.max(0, totalCost - walletAmount);

    if (!state) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
                    <Typography variant="h1" sx={{ fontSize: '48px', mb: 2 }}>⚠️</Typography>
                    <Alert severity="error" sx={{ mb: 2 }}>No booking information found</Alert>
                    <Button variant="contained" onClick={() => navigate('/')}>
                        Go to Home
                    </Button>
                </Box>
            </Container>
        );
    }



    const handlePayment = async () => {
        setValidationError(null);

        if (paymentMethod === 'card') {
            if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
                setValidationError('Please fill in all card details.');
                return;
            }
            if (cardDetails.number.replace(/\s/g, '').length < 16) {
                setValidationError('Please enter a valid 16-digit card number.');
                return;
            }
        }

        if (paymentMethod === 'apple_google_pay' && !biometricAuthenticated) {
            setValidationError('Please complete biometric authentication.');
            return;
        }

        setProcessing(true);
        try {
            // Create reservation in backend
            const start = startTime ? new Date(startTime) : new Date();
            const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

            const reservationData = {
                startTime: start.toISOString(),
                endTime: end.toISOString(),
                parkingLot: lot.id,
                co2_estimated_g: lot.co2_impact?.estimated_g || 0,
                spot: selectedSpot ? { id: selectedSpot.id } : undefined, // Link selected spot
            };

            const newReservation = await createReservation(reservationData);

            // Create payment record linked to reservation
            // Note: Backend endpoint expects: amount, method, reservation (ID)
            await createPayment({
                amount: amountAfterWallet > 0 ? amountAfterWallet : totalCost, // Track actual paid amount or total? Usually actual paid.
                method: paymentMethod,
                reservation: { id: newReservation.id }
            });

            // Navigate to success
            navigate('/payment-success', {
                state: {
                    lot,
                    selectedSpot,
                    duration,
                    totalCost,
                    reservationId: newReservation.id.toString()
                }
            });

        } catch (error) {
            setValidationError('Payment failed. Please try again.');
            console.error(error);
        } finally {
            setProcessing(false);
        }
    };

    const handleApplyWalletCredit = (amount: number) => {
        setWalletAmount(Math.min(amount, totalCost));
        if (amount >= totalCost) {
            setPaymentMethod('wallet');
        } else if (paymentMethod === 'wallet') {
            setPaymentMethod('card');
        }
    };

    const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCardDetails(prev => ({ ...prev, [name]: value }));
    };

    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate(-1)}
                variant="outlined"
                sx={{ mb: 3 }}
            >
                Back
            </Button>

            <Typography variant="h3" gutterBottom textAlign="center" fontWeight={700}>
                💳 Payment
            </Typography>

            {/* Booking Summary */}
            <Card elevation={2} sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                        Booking Summary
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Parking Lot:</Typography>
                            <Typography variant="body2" fontWeight={600}>{lot.name}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Location:</Typography>
                            <Typography variant="body2">{lot.location}</Typography>
                        </Box>
                        {selectedSpot && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Spot:</Typography>
                                <Typography variant="body2" fontWeight={600}>{selectedSpot.spot_number}</Typography>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Duration:</Typography>
                            <Typography variant="body2">{duration} hour{duration !== 1 ? 's' : ''}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" color="text.secondary">Rate:</Typography>
                            <Typography variant="body2">${lot.pricePerHour}/hr</Typography>
                        </Box>
                        {lot.co2_impact && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">CO₂ Impact:</Typography>
                                <Typography variant="body2" color="success.main" fontWeight={600}>
                                    {Number(lot.co2_impact.estimated_g).toFixed(0)}g ({Number(lot.co2_impact.savings_pct).toFixed(0)}% savings) 🌱
                                </Typography>
                            </Box>
                        )}
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="h6" fontWeight={700}>Total:</Typography>
                            <Typography variant="h6" color="success.main" fontWeight={700}>${totalCost.toFixed(2)}</Typography>
                        </Box>
                    </Box>
                </CardContent>
            </Card>

            {/* Wallet */}
            <WalletDisplay showTransactions={false} onApplyCredit={handleApplyWalletCredit} />

            {/* Cost Breakdown with Wallet */}
            {walletAmount > 0 && (
                <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'rgba(46, 125, 50, 0.08)', border: 1, borderColor: 'success.main' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Original Cost:</Typography>
                        <Typography variant="body2">${totalCost.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Wallet Credit Applied:</Typography>
                        <Typography variant="body2">-${walletAmount.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" fontWeight={700}>Amount to Pay:</Typography>
                        <Typography variant="body1" fontWeight={700}>${amountAfterWallet.toFixed(2)}</Typography>
                    </Box>
                </Paper>
            )}

            {/* Payment Method */}
            {amountAfterWallet > 0 && (
                <Card elevation={2} sx={{ mb: 3 }}>
                    <CardContent>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Payment Method
                        </Typography>

                        <FormControl component="fieldset" fullWidth>
                            <RadioGroup value={paymentMethod} onChange={(e) => {
                                setPaymentMethod(e.target.value as any);
                                setValidationError(null);
                            }}>
                                <Paper elevation={0} sx={{ p: 2, mb: 2, border: 2, borderColor: paymentMethod === 'card' ? 'primary.main' : 'divider', borderRadius: 2 }}>
                                    <FormControlLabel
                                        value="card"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <CreditCardIcon />
                                                <Typography fontWeight={600}>Credit/Debit Card</Typography>
                                            </Box>
                                        }
                                    />

                                    {paymentMethod === 'card' && (
                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <TextField
                                                label="Cardholder Name"
                                                name="name"
                                                value={cardDetails.name}
                                                onChange={handleCardChange}
                                                fullWidth
                                                placeholder="John Doe"
                                            />
                                            <TextField
                                                label="Card Number"
                                                name="number"
                                                value={cardDetails.number}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                                                    setCardDetails(prev => ({ ...prev, number: val }));
                                                }}
                                                fullWidth
                                                placeholder="XXXX XXXX XXXX XXXX"
                                                inputProps={{ maxLength: 19 }}
                                            />
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <TextField
                                                    label="Expiry (MM/YY)"
                                                    name="expiry"
                                                    value={cardDetails.expiry}
                                                    onChange={(e) => {
                                                        let val = e.target.value.replace(/\D/g, '');
                                                        if (val.length > 2) val = val.substring(0, 2) + '/' + val.substring(2);
                                                        setCardDetails(prev => ({ ...prev, expiry: val }));
                                                    }}
                                                    fullWidth
                                                    placeholder="MM/YY"
                                                    inputProps={{ maxLength: 5 }}
                                                />
                                                <TextField
                                                    label="CVV"
                                                    name="cvc"
                                                    value={cardDetails.cvc}
                                                    onChange={handleCardChange}
                                                    fullWidth
                                                    placeholder="123"
                                                    inputProps={{ maxLength: 3 }}
                                                />
                                            </Box>
                                        </Box>
                                    )}
                                </Paper>

                                <Paper elevation={0} sx={{ p: 2, border: 2, borderColor: paymentMethod === 'apple_google_pay' ? 'primary.main' : 'divider', borderRadius: 2 }}>
                                    <FormControlLabel
                                        value="apple_google_pay"
                                        control={<Radio />}
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AppleIcon />
                                                <Typography fontWeight={600}>Apple Pay / Google Pay</Typography>
                                            </Box>
                                        }
                                    />

                                    {paymentMethod === 'apple_google_pay' && (
                                        <Box sx={{ mt: 2, textAlign: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                                Simulating secure device authentication...
                                            </Typography>
                                            <Button
                                                variant="contained"
                                                color={biometricAuthenticated ? 'success' : 'primary'}
                                                onClick={() => setBiometricAuthenticated(true)}
                                                startIcon={<FingerprintIcon />}
                                                sx={{ mt: 1, borderRadius: 3 }}
                                            >
                                                {biometricAuthenticated ? '✓ Authenticated' : 'Confirm with FaceID/TouchID'}
                                            </Button>
                                        </Box>
                                    )}
                                </Paper>
                            </RadioGroup>
                        </FormControl>

                        {validationError && (
                            <Alert severity="error" sx={{ mt: 2 }}>
                                {validationError}
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Confirm Payment Button */}
            <Button
                onClick={handlePayment}
                disabled={processing}
                variant="contained"
                size="large"
                fullWidth
                sx={{
                    py: 2,
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    borderRadius: 3,
                }}
            >
                {processing ? '⏳ Processing...' :
                    paymentMethod === 'wallet' ? `Confirm Wallet Payment${amountAfterWallet > 0 ? ` ($${amountAfterWallet.toFixed(2)})` : ''}` :
                        paymentMethod === 'apple_google_pay' ? '🍎 Pay with Apple/Google' :
                            `💳 Pay $${amountAfterWallet.toFixed(2)}`
                }
            </Button>
        </Container>
    );
};

export default Payment;
