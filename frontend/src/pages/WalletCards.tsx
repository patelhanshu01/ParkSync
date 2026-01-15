import React, { useEffect, useMemo, useState } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Stack,
    Divider,
    TextField,
    CircularProgress,
    Alert,
    FormControlLabel,
    Switch,
    Chip
} from '@mui/material';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { addSavedCard, getWalletDetails, SavedCard, WalletDetails } from '../api/walletApi';
import { useNavigate } from 'react-router-dom';

const detectBrand = (digits: string) => {
    if (/^4/.test(digits)) return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
    if (/^3[47]/.test(digits)) return 'Amex';
    if (/^6(?:011|5)/.test(digits)) return 'Discover';
    return 'Card';
};

const parseExpiry = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const match = cleaned.match(/^(\d{2})\/?(\d{2}|\d{4})$/);
    if (!match) return null;
    const month = Number(match[1]);
    let year = Number(match[2]);
    if (year < 100) {
        year += 2000;
    }
    if (!Number.isFinite(month) || month < 1 || month > 12) return null;
    if (!Number.isFinite(year) || year < 2000) return null;
    return { month, year };
};

const WalletCards: React.FC = () => {
    const [wallet, setWallet] = useState<WalletDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cardholder, setCardholder] = useState('');
    const [makeDefault, setMakeDefault] = useState(false);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();

    const savedCards = useMemo<SavedCard[]>(() => wallet?.savedCards ?? [], [wallet]);

    const fetchWallet = async () => {
        setError(null);
        setLoading(true);
        try {
            const data = await getWalletDetails();
            setWallet(data);
        } catch (err) {
            setError('Failed to load saved cards. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const handleAddCard = async () => {
        setError(null);
        const digits = cardNumber.replace(/\D/g, '');
        if (digits.length < 12) {
            setError('Enter a valid card number.');
            return;
        }
        const expiryInfo = parseExpiry(expiry);
        if (!expiryInfo) {
            setError('Enter a valid expiration date (MM/YY).');
            return;
        }
        const last4 = digits.slice(-4);
        const brand = detectBrand(digits);
        const shouldDefault = savedCards.length === 0 ? true : makeDefault;
        const cardholderName = cardholder.trim();

        setSaving(true);
        try {
            await addSavedCard({
                brand,
                last4,
                expMonth: expiryInfo.month,
                expYear: expiryInfo.year,
                cardholder: cardholderName ? cardholderName : undefined,
                isDefault: shouldDefault
            });
            setCardNumber('');
            setExpiry('');
            setCardholder('');
            setMakeDefault(false);
            await fetchWallet();
        } catch (err) {
            setError('Failed to save card. Please try again.');
        } finally {
            setSaving(false);
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
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    Saved Cards
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/wallet')}>
                    Back to Wallet
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
                {savedCards.length === 0 ? (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">No saved cards yet.</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Add a card below to save it for faster checkout.
                        </Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />}>
                        {savedCards.map((card) => (
                            <Box
                                key={card.id}
                                p={2}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                            >
                                <Box>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="subtitle1" fontWeight="600">
                                            {card.brand} **** {card.last4}
                                        </Typography>
                                        {card.isDefault && <Chip size="small" label="Default" color="success" />}
                                    </Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                                    </Typography>
                                    {card.cardholder && (
                                        <Typography variant="caption" color="text.secondary" display="block">
                                            {card.cardholder}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon /> Add a card
                </Typography>
                <Stack spacing={2}>
                    <TextField
                        label="Card number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        fullWidth
                    />
                    <TextField
                        label="Expiration (MM/YY)"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        placeholder="08/27"
                        fullWidth
                    />
                    <TextField
                        label="Cardholder name"
                        value={cardholder}
                        onChange={(e) => setCardholder(e.target.value)}
                        placeholder="Name on card"
                        fullWidth
                    />
                    <FormControlLabel
                        control={
                            <Switch
                                checked={savedCards.length === 0 ? true : makeDefault}
                                onChange={(e) => setMakeDefault(e.target.checked)}
                                disabled={savedCards.length === 0}
                            />
                        }
                        label="Set as default"
                    />
                    <Button
                        variant="contained"
                        onClick={handleAddCard}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save card'}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                        For your security, we only store the last 4 digits and expiration date.
                    </Typography>
                </Stack>
            </Paper>
        </Container>
    );
};

export default WalletCards;
