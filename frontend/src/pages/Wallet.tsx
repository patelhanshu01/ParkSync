import React, { useEffect, useMemo, useState } from 'react';
import { Container, Typography, Box, Paper, Button, Stack, Divider, CircularProgress, Alert, Dialog, DialogTitle, DialogContent, TextField, Chip, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import HistoryIcon from '@mui/icons-material/History';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { getWalletDetails, addFunds, SavedCard, WalletDetails } from '../api/walletApi';
import { useNavigate } from 'react-router-dom';

const TOP_UP_AMOUNTS = [10, 20, 50, 100];

const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<WalletDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openTopUp, setOpenTopUp] = useState(false);
    const [topUpAmount, setTopUpAmount] = useState<string>('');
    const [processing, setProcessing] = useState(false);
    const [topUpCardId, setTopUpCardId] = useState<number | null>(null);
    const [topUpError, setTopUpError] = useState<string | null>(null);

    const navigate = useNavigate();
    const parsedTopUpAmount = useMemo(() => {
        const value = Number(topUpAmount);
        return Number.isFinite(value) ? value : 0;
    }, [topUpAmount]);

    const fetchWallet = async () => {
        try {
            const data = await getWalletDetails();
            setWallet(data);
        } catch (err) {
            setError('Failed to load wallet details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWallet();
    }, []);

    const transactionItems = useMemo(() => {
        if (!wallet) return [];
        return wallet.transactions.map((transaction) => ({
            ...transaction,
            dateLabel: new Date(transaction.date).toLocaleString(),
            isCredit: transaction.type === 'credit'
        }));
    }, [wallet]);

    const savedCards = useMemo<SavedCard[]>(() => {
        return wallet?.savedCards ?? [];
    }, [wallet]);

    useEffect(() => {
        if (!openTopUp) return;
        if (savedCards.length === 0) {
            setTopUpCardId(null);
            return;
        }
        if (topUpCardId === null) {
            const defaultCard = savedCards.find((card) => card.isDefault) || savedCards[0];
            setTopUpCardId(defaultCard?.id ?? null);
        }
    }, [openTopUp, savedCards, topUpCardId]);

    const handleTopUp = async () => {
        if (parsedTopUpAmount <= 0) return;
        if (savedCards.length > 0 && topUpCardId === null) {
            setTopUpError('Select a saved card to top up your wallet.');
            return;
        }

        setProcessing(true);
        try {
            await addFunds(parsedTopUpAmount, topUpCardId ?? undefined);
            setOpenTopUp(false);
            setTopUpAmount('');
            setTopUpError(null);
            fetchWallet(); // Refresh balance
        } catch (err) {
            setTopUpError('Failed to add funds. Please try again.');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (!wallet) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Alert severity="error" action={
                    <Button color="inherit" size="small" onClick={fetchWallet}>
                        Retry
                    </Button>
                }>
                    {error || 'Failed to load wallet information.'}
                </Alert>
                <Button variant="outlined" onClick={() => navigate('/')} sx={{ mt: 2 }}>
                    Back to Map
                </Button>
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1" fontWeight="bold">
                    My Wallet
                </Typography>
                <Button variant="outlined" onClick={() => navigate('/')}>
                    Back to Map
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Balance Card */}
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    mb: 4,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)',
                    color: 'white',
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 3
                }}
            >
                <Box>
                    <Typography variant="subtitle1" sx={{ opacity: 0.9, mb: 1 }}>
                        Current Balance
                    </Typography>
                    <Typography variant="h2" fontWeight="bold">
                        ${wallet?.balance.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {wallet?.currency}
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<AddCircleIcon />}
                    onClick={() => {
                        setTopUpError(null);
                        setOpenTopUp(true);
                    }}
                    sx={{
                        bgcolor: 'white',
                        color: 'primary.main',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' },
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 'bold'
                    }}
                >
                    Add Money
                </Button>
            </Paper>

            {/* Saved Cards */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="h5" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CreditCardIcon /> Saved Card Details
                </Typography>
                <Button size="small" variant="outlined" onClick={() => navigate('/wallet/cards')}>
                    Add card
                </Button>
            </Box>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 4 }}>
                {savedCards.length === 0 ? (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">No saved cards yet.</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Use Add card to save a payment method.
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

            {/* Transactions List */}
            <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HistoryIcon /> Transaction History
            </Typography>

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                {transactionItems.length === 0 ? (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">No transactions yet.</Typography>
                    </Box>
                ) : (
                    <Stack divider={<Divider />}>
                        {transactionItems.map((transaction) => (
                            <Box
                                key={transaction.id}
                                p={2}
                                display="flex"
                                justifyContent="space-between"
                                alignItems="center"
                                sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                            >
                                <Box display="flex" alignItems="center" gap={2}>
                                    <Box
                                        sx={{
                                            bgcolor: transaction.isCredit ? 'success.light' : 'error.light',
                                            color: 'white',
                                            p: 1,
                                            borderRadius: '50%',
                                            display: 'flex'
                                        }}
                                    >
                                        {transaction.isCredit ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle1" fontWeight="600">
                                            {transaction.description}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {transaction.dateLabel}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Typography
                                    variant="h6"
                                    fontWeight="bold"
                                    color={transaction.isCredit ? 'success.main' : 'error.main'}
                                >
                                    {transaction.isCredit ? '+' : '-'}${transaction.amount.toFixed(2)}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Paper>

            {/* Top Up Modal */}
            <Dialog
                open={openTopUp}
                onClose={() => {
                    setOpenTopUp(false);
                    setTopUpError(null);
                }}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Add Funds to Wallet</DialogTitle>
                <DialogContent>
                    <Box py={2}>
                        {topUpError && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {topUpError}
                            </Alert>
                        )}
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Select an amount to add to your parking wallet.
                        </Typography>
                        <Stack direction="row" spacing={1} mb={3}>
                            {TOP_UP_AMOUNTS.map((amt) => (
                                <Chip
                                    key={amt}
                                    label={`$${amt}`}
                                    onClick={() => setTopUpAmount(amt.toString())}
                                    color={topUpAmount === amt.toString() ? 'primary' : 'default'}
                                    variant={topUpAmount === amt.toString() ? 'filled' : 'outlined'}
                                    clickable
                                />
                                ))}
                            </Stack>

                        {savedCards.length === 0 ? (
                            <Box
                                sx={{
                                    border: '1px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                    p: 2,
                                    mb: 3,
                                    textAlign: 'center'
                                }}
                            >
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    No saved cards available.
                                </Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        setOpenTopUp(false);
                                        navigate('/wallet/cards');
                                    }}
                                >
                                    Add a card
                                </Button>
                            </Box>
                        ) : (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                    Pay with
                                </Typography>
                                <FormControl component="fieldset" fullWidth>
                                    <RadioGroup
                                        value={topUpCardId !== null ? String(topUpCardId) : ''}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            if (Number.isFinite(value)) {
                                                setTopUpCardId(value);
                                            }
                                        }}
                                    >
                                        {savedCards.map((card) => (
                                            <FormControlLabel
                                                key={card.id}
                                                value={String(card.id)}
                                                control={<Radio />}
                                                label={
                                                    <Box>
                                                        <Typography fontWeight={600}>
                                                            {card.brand} **** {card.last4}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Expires {card.expMonth.toString().padStart(2, '0')}/{card.expYear}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        ))}
                                    </RadioGroup>
                                </FormControl>
                            </Box>
                        )}
                        <TextField
                            label="Amount ($)"
                            type="number"
                            fullWidth
                            value={topUpAmount}
                            onChange={(e) => setTopUpAmount(e.target.value)}
                            InputProps={{ inputProps: { min: 5 } }}
                            helperText="Minimum deposit: $5.00"
                        />
                        <Button
                            variant="contained"
                            fullWidth
                            size="large"
                            sx={{ mt: 3 }}
                            onClick={handleTopUp}
                            disabled={!topUpAmount || parsedTopUpAmount < 5 || processing || savedCards.length === 0 || topUpCardId === null}
                        >
                            {processing ? 'Processing...' : `Pay $${parsedTopUpAmount.toFixed(2)}`}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>
        </Container>
    );
};

export default Wallet;
