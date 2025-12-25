import React from 'react';
import {
    Card,
    CardContent,
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
    onClick: (id: number) => void;
    isCheapest?: boolean;
    isClosest?: boolean;
}

const ParkingLotCard: React.FC<ParkingLotCardProps> = ({ parkingLot, onClick, isCheapest, isClosest }) => {

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
                '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                }
            }}
            onClick={() => parkingLot.id && onClick(parkingLot.id)}
        >
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
