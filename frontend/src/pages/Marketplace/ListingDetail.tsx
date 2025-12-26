import React, { useEffect, useState } from 'react';
import { Container, Box, Typography, Button } from '@mui/material';
import { getListingById } from '../../api/listingApi';
import { useParams } from 'react-router-dom';
import { Listing } from '../../types/Listing';

const ListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        const res = await getListingById(Number(id));
        setListing(res.data);
      } catch (e) {
        console.error('Failed to fetch listing', e);
      }
    };
    fetch();
  }, [id]);

  if (!listing) return <Container><Typography>Loading...</Typography></Container>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4">{listing.title}</Typography>
      <Typography variant="subtitle1" color="text.secondary">{listing.location}</Typography>
      <Typography sx={{ mt: 2 }}>{listing.description}</Typography>
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6">${Number(listing.pricePerHour || 0).toFixed(2)}/hr</Typography>
        <Typography variant="caption">Private listing: {listing.isPrivate ? 'Yes' : 'No'}</Typography>
      </Box>
    </Container>
  );
};

export default ListingDetail;