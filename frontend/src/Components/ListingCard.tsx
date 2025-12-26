import React from 'react';
import { Listing } from '../types/Listing';
import { Card, CardContent, CardMedia, Typography, Box, Button, Divider } from '@mui/material';

interface Props {
  listing: Listing;
  onView?: (id: number) => void;
}

const ListingCard: React.FC<Props> = ({ listing, onView }) => {
  return (
    <Card elevation={0} sx={{
      borderRadius: 3,
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      transition: 'all 0.3s ease',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 24px rgba(0, 212, 170, 0.15)',
        borderColor: 'primary.main',
      }
    }}>
      {listing.imageUrl && (
        <Box sx={{ position: 'relative', overflow: 'hidden' }}>
          <CardMedia
            component="img"
            height="200"
            image={listing.imageUrl}
            alt={listing.title}
            sx={{
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)',
              }
            }}
          />
          {listing.isPrivate && (
            <Box sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              bgcolor: 'primary.main',
              color: '#0a1929',
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontWeight: 700,
              fontSize: '0.75rem',
            }}>
              PRIVATE
            </Box>
          )}
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, color: 'text.primary' }}>
              {listing.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              📍 {listing.address || listing.location}
            </Typography>
          </Box>
        </Box>

        <Typography
          sx={{
            mt: 1.5,
            mb: 2,
            color: 'text.secondary',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            fontSize: '0.875rem',
            lineHeight: 1.5,
          }}
          variant="body2"
        >
          {listing.description || 'No description provided.'}
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Price per hour
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>
              ${Number(listing.pricePerHour || 0).toFixed(2)}
            </Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => listing.id && onView?.(listing.id)}
            sx={{
              px: 3,
              py: 1,
            }}
          >
            View Details
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ListingCard;