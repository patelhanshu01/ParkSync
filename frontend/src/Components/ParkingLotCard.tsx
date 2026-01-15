import React, { useEffect, useState } from 'react';
import { keyframes } from '@emotion/react';
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    Box,
    Stack,
    Chip,
    Divider
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import EvStationIcon from '@mui/icons-material/EvStation';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { ParkingLot } from '../types/Parking';
import EcoBadge from './badges/EcoBadge';

interface ParkingLotCardProps {
    parkingLot: ParkingLot;
    onClick: (lot: ParkingLot) => void;
    isCheapest?: boolean;
    isClosest?: boolean;
}

const fadeInUp = keyframes`
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
`;

const FALLBACK_IMAGES = [
    '/mock-images/parking_lot_1.png',
    '/mock-images/parking_lot_2.png',
    '/mock-images/parking_lot_3.png',
    '/mock-images/parking_lot_4.png',
    '/mock-images/parking_lot_5.png'
];

const UNSPLASH_FALLBACKS = [
    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526626607727-42c162f7ab06?auto=format&fit=crop&w=800&q=80'
];

const ParkingLotCard: React.FC<ParkingLotCardProps> = ({ parkingLot, onClick, isCheapest, isClosest }) => {
    const fallbackIndex = Number.isFinite(parkingLot.id)
        ? Math.abs(Number(parkingLot.id)) % FALLBACK_IMAGES.length
        : 0;
    const fallbackImage = FALLBACK_IMAGES[fallbackIndex];
    const lat = Number(parkingLot.latitude);
    const lng = Number(parkingLot.longitude);
    const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
    const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const streetViewUrl = hasCoords && mapKey
        ? `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${lat},${lng}&fov=80&pitch=0&key=${mapKey}`
        : null;
    const rawImageUrl = typeof parkingLot.imageUrl === 'string' ? parkingLot.imageUrl : null;
    const isProxyPhoto = !!rawImageUrl && rawImageUrl.includes('/api/parking/photo');
    const isValidImageUrl = !!rawImageUrl && (/^https?:\/\//i.test(rawImageUrl) || rawImageUrl.startsWith('/'));
    const isGenericFallback = isValidImageUrl && (UNSPLASH_FALLBACKS.includes(rawImageUrl) || isProxyPhoto);
    const preferredImage = isGenericFallback && streetViewUrl
        ? streetViewUrl
        : (isValidImageUrl && !isProxyPhoto ? rawImageUrl : null);
    const initialImageUrl = preferredImage || streetViewUrl || fallbackImage;
    const [resolvedImageUrl, setResolvedImageUrl] = useState(initialImageUrl);

    useEffect(() => {
        setResolvedImageUrl(initialImageUrl);
    }, [initialImageUrl]);

    const badges = [];
    if (isCheapest) badges.push({ label: 'Cheapest', color: 'success' as const });
    if (isClosest) badges.push({ label: 'Closest', color: 'primary' as const });
    if (parkingLot.has_ev_charging) badges.push({ label: 'EV Charging', color: 'info' as const, icon: <EvStationIcon sx={{ fontSize: 16 }} /> });
    if (parkingLot.is_covered) badges.push({ label: 'Covered', color: 'secondary' as const });
    if (parkingLot.has_cctv) badges.push({ label: 'CCTV', color: 'warning' as const, icon: <VisibilityIcon sx={{ fontSize: 16 }} /> });

    return (
        <Card
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                opacity: 0,
                animation: `${fadeInUp} 0.5s ease forwards`,
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                }
            }}
            onClick={() => onClick(parkingLot)}
        >
            <CardMedia
                component="img"
                height="140"
                image={resolvedImageUrl}
                alt={parkingLot.name}
                onError={() => {
                    if (streetViewUrl && resolvedImageUrl !== streetViewUrl) {
                        setResolvedImageUrl(streetViewUrl);
                        return;
                    }
                    if (resolvedImageUrl !== fallbackImage) {
                        setResolvedImageUrl(fallbackImage);
                    }
                }}
                sx={{
                    objectFit: 'cover',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                        transform: 'scale(1.05)'
                    }
                }}
            />
            <CardContent sx={{ flexGrow: 1, p: 2, '&:last-child': { pb: 2 } }}>
                {/* Header */}
                <Box sx={{ mb: 1.5 }}>
                    <Typography variant="h6" fontWeight="700" noWrap gutterBottom sx={{ fontSize: '1.1rem' }}>
                        {parkingLot.name}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                        <LocationOnIcon sx={{ fontSize: 16 }} />
                        <Typography variant="caption" noWrap>
                            {parkingLot.location}
                        </Typography>
                    </Stack>
                </Box>

                {/* Badges */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {badges.map((badge, idx) => (
                        <Chip
                            key={idx}
                            label={badge.label}
                            color={badge.color}
                            size="small"
                            variant="filled"
                            icon={badge.icon}
                            sx={{ fontWeight: 600, fontSize: '0.65rem' }}
                        />
                    ))}
                    {parkingLot.co2_impact && (
                        <Box sx={{ scale: '0.85', originX: 0 }}>
                            <EcoBadge co2Impact={parkingLot.co2_impact} showDetails={false} />
                        </Box>
                    )}
                </Box>

                {/* Price and Availability */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Box>
                        <Typography variant="h4" component="span" fontWeight="800" color="primary">
                            ${Number(parkingLot.pricePerHour).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                            /hr
                        </Typography>
                    </Box>
                    <Chip
                        icon={parkingLot.isAvailable ? <CheckCircleIcon /> : <CancelIcon />}
                        label={parkingLot.isAvailable ? 'Available' : 'Full'}
                        color={parkingLot.isAvailable ? 'success' : 'error'}
                        size="small"
                        sx={{ fontWeight: 700 }}
                    />
                </Stack>

                <Divider sx={{ my: 2, opacity: 0.6 }} />

                {/* Stats */}
                <Stack spacing={1}>
                    {parkingLot.availableSpots !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                            🚗 <strong>{parkingLot.availableSpots}</strong> / {parkingLot.totalSpots} spots free
                        </Typography>
                    )}
                    {parkingLot.distance_km !== undefined && (
                        <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
                            <DirectionsWalkIcon sx={{ fontSize: 16 }} />
                            <Typography variant="body2">
                                {Number(parkingLot.distance_km).toFixed(1)} km away
                            </Typography>
                        </Stack>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default ParkingLotCard;
