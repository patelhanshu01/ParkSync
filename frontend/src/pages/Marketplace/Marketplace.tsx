import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Grid, Button, CircularProgress } from '@mui/material';
import { getListings } from '../../api/listingApi';
import ListingCard from '../../Components/ListingCard';
import { Listing } from '../../types/Listing';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../Components/MainLayout';

const Marketplace: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await getListings();
      setListings(res.data.results || []);
    } catch (e) {
      console.error('Failed to fetch listings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <MainLayout>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>Private Marketplace</Typography>
            <Typography variant="body2" color="text.secondary">
              Discover exclusive parking spaces from private owners
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/marketplace/create')}
            sx={{ px: 3, py: 1.5 }}
          >
            List Your Space
          </Button>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 3 }}>
          {loading ? (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}><CircularProgress /></Box>
          ) : listings.length === 0 ? (
            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">No listings available</Typography>
            </Box>
          ) : listings.map(l => (
            <Box key={l.id}><ListingCard listing={l} onView={(id) => navigate(`/marketplace/${id}`)} /></Box>
          ))}
        </Box>
      </Container>
    </MainLayout>
  );
};

export default Marketplace;