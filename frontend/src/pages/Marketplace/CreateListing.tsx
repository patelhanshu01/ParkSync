import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography } from '@mui/material';
import { createListing } from '../../api/listingApi';
import { useNavigate } from 'react-router-dom';

const CreateListing: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
    setLoading(true);
    try {
      const body = {
        title,
        description,
        pricePerHour: price || 0,
        location,
        isActive: true
      };
      const res = await createListing(body as any);
      navigate(`/marketplace/${res.data.id}`);
    } catch (e) {
      console.error('Failed to create listing', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h5" gutterBottom>Create Listing</Typography>

      <Box sx={{ display: 'grid', gap: 2 }}>
        <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} fullWidth />
        <TextField label="Description" value={description} onChange={e => setDescription(e.target.value)} fullWidth multiline rows={4} />
        <TextField label="Price per hour" type="number" value={price} onChange={e => setPrice(Number(e.target.value))} fullWidth />
        <TextField label="Location" value={location} onChange={e => setLocation(e.target.value)} fullWidth />
        <Button variant="contained" onClick={handleSave} disabled={loading || !title}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </Box>
    </Container>
  );
};

export default CreateListing;