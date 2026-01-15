import React, { useMemo, useState } from 'react';
import {
    Container,
    TextField,
    Button,
    Typography,
    Paper,
    Grid,
    InputAdornment,
    Divider
} from '@mui/material';
import { createListing } from '../../api/listingApi';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../Components/MainLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const FALLBACK_IMAGE =
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80';

const AdminCreateListing: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [location, setLocation] = useState('');
    const [address, setAddress] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [accountName, setAccountName] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [routingNumber, setRoutingNumber] = useState('');
    const [payoutEmail, setPayoutEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const isSaveDisabled = useMemo(() => {
        return (
            loading ||
            !title ||
            !price ||
            !address ||
            !accountName ||
            !bankName ||
            !accountNumber ||
            !routingNumber ||
            !payoutEmail
        );
    }, [loading, title, price, address, accountName, bankName, accountNumber, routingNumber, payoutEmail]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const payoutInfo = {
                accountName,
                bankName,
                accountNumber,
                routingNumber,
                payoutEmail
            };
            const body = {
                title,
                description,
                pricePerHour: Number(price) || 0,
                location,
                address,
                imageUrl: imageUrl || FALLBACK_IMAGE,
                isActive: true,
                isPrivate: true,
                contact_info: JSON.stringify({ payoutInfo })
            };
            await createListing(body as any);
            navigate('/host/listings');
        } catch (e) {
            console.error('Failed to create listing', e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <Container maxWidth="md" sx={{ py: 6 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/host/listings')}
                    sx={{ mb: 4, color: 'text.secondary' }}
                >
                    Back to Listings
                </Button>

                <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                    New Parking Listing
                </Typography>
                <Typography variant="h6" color="text.secondary" sx={{ mb: 6, fontWeight: 400 }}>
                    Fill in the details below to list your private parking spot.
                </Typography>

                <Paper elevation={0} sx={{ p: 5, borderRadius: 4, background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    <Grid container spacing={4}>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Listing Title"
                                placeholder="e.g., Spacious Driveway near Downtown"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                fullWidth
                                variant="outlined"
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                fullWidth
                                multiline
                                rows={4}
                                placeholder="Describe your parking spot (security, dimensions, etc.)"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Price per Hour"
                                type="number"
                                value={price}
                                onChange={e => {
                                    const value = e.target.value;
                                    setPrice(value === '' ? '' : Number(value));
                                }}
                                fullWidth
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Neighborhood / Location"
                                placeholder="e.g., Brampton South"
                                value={location}
                                onChange={e => setLocation(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Full Address"
                                placeholder="e.g., 210 Heart Lake Rd S, Brampton, ON"
                                value={address}
                                onChange={e => setAddress(e.target.value)}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Image URL"
                                placeholder="https://images.unsplash.com/..."
                                value={imageUrl}
                                onChange={e => setImageUrl(e.target.value)}
                                fullWidth
                                helperText="Provide a URL for an image of your parking spot."
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 2 }} />
                            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                                Payout details
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                Add bank info so we can deposit your earnings from this listing.
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Account holder name"
                                value={accountName}
                                onChange={e => setAccountName(e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Bank name"
                                value={bankName}
                                onChange={e => setBankName(e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Account number / IBAN"
                                value={accountNumber}
                                onChange={e => setAccountNumber(e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Routing / SWIFT / IFSC"
                                value={routingNumber}
                                onChange={e => setRoutingNumber(e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                            <TextField
                                label="Payout email (for confirmations)"
                                type="email"
                                value={payoutEmail}
                                onChange={e => setPayoutEmail(e.target.value)}
                                fullWidth
                                required
                            />
                        </Grid>
                        <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                            <Button
                                variant="contained"
                                onClick={handleSave}
                                disabled={isSaveDisabled}
                                fullWidth
                                sx={{
                                    py: 2,
                                    borderRadius: 3,
                                    fontWeight: 700,
                                    fontSize: '1.1rem',
                                    boxShadow: '0 8px 16px rgba(0, 212, 170, 0.2)',
                                }}
                            >
                                {loading ? 'Creating Listing...' : 'Publish Listing'}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            </Container>
        </MainLayout>
    );
};

export default AdminCreateListing;
