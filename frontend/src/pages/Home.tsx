import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import {
    Box,
    Container,
    Typography,
    Button,
    Paper,
    Stack,
    CircularProgress,
    Fade,
    Tooltip,
    Badge
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';

import SearchBar from '../Components/searchBar';
import ParkingLotCard from '../Components/ParkingLotCard';
import ListingCard from '../Components/ListingCard';
import FilterPanel from '../Components/FilterPanel';
import { ParkingLot, SearchFilters } from '../types/Parking';
import { Listing } from '../types/Listing';
import { getParkingLots } from '../api/parkingApi';
import { getMyBookings } from '../api/reservationApi';
import { getListings } from '../api/listingApi';
import { useAuth } from '../context/AuthContext';
import LogoutIcon from '@mui/icons-material/Logout';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import StorefrontIcon from '@mui/icons-material/Storefront';
import DashboardIcon from '@mui/icons-material/Dashboard';

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 43.6532, // Toronto
    lng: -79.3832
};

const LIBRARIES: any[] = ['places'];

const Home: React.FC = () => {
    const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [selectedMarker, setSelectedMarker] = useState<ParkingLot | null>(null);
    const [filters, setFilters] = useState<SearchFilters>({
        price_range: { min: 0, max: 100 },
        sort_by: 'distance_asc',
        only_available: false
    });
    const [showFilters, setShowFilters] = useState(false);
    const [bookingCount, setBookingCount] = useState(0);
    const [listings, setListings] = useState<Listing[]>([]);
    const [loadingListings, setLoadingListings] = useState(false);
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES
    });

    useEffect(() => {
        if (loadError) {
            console.error('Google Maps Load Error:', loadError);
        }
    }, [loadError]);

    const fetchParkingLots = async (searchQuery?: string) => {
        setLoading(true);
        try {
            let params: any = {};
            if (searchQuery) params.search = searchQuery;

            if (navigator.geolocation && !searchQuery) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
                    });
                    params.lat = position.coords.latitude;
                    params.lng = position.coords.longitude;
                    params.radius = 5;
                    setMapCenter({ lat: params.lat, lng: params.lng });
                } catch (e) {
                    console.log('Location access denied');
                }
            }

            const response = await getParkingLots(params);
            const { results, searchMetadata } = response.data;

            setParkingLots(results);
            if (searchMetadata) {
                setMapCenter({ lat: searchMetadata.lat, lng: searchMetadata.lng });
            }
            setLoading(false);
        } catch (err) {
            console.error('Error fetching parking lots:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchParkingLots();
        // Fetch booking count
        const fetchBookings = async () => {
            try {
                const bookings = await getMyBookings();
                // Count active/upcoming bookings
                const active = bookings.filter(b => {
                    const end = new Date(b.endTime);
                    return end > new Date();
                });
                setBookingCount(active.length);
            } catch (e) {
                console.log('Failed to fetch bookings count');
            }
        };
        fetchBookings();

        // Fetch private listings
        const fetchListings = async () => {
            setLoadingListings(true);
            try {
                const response = await getListings();
                setListings(response.data.results || []);
            } catch (e) {
                console.error('Failed to fetch listings:', e);
            } finally {
                setLoadingListings(false);
            }
        };
        fetchListings();
    }, []);

    const handleSearch = () => {
        fetchParkingLots(searchTerm);
    };

    const filteredLots = parkingLots
        .filter(lot => {
            const matchesPrice = !filters.price_range ||
                (lot.pricePerHour >= filters.price_range.min && lot.pricePerHour <= filters.price_range.max);
            const matchesAvailability = !filters.only_available || lot.isAvailable;
            const matchesEV = !filters.ev_filter?.enabled || lot.has_ev_charging;
            return matchesPrice && matchesAvailability && matchesEV;
        })
        .sort((a, b) => {
            switch (filters.sort_by) {
                case 'price_asc': return a.pricePerHour - b.pricePerHour;
                case 'distance_asc': return (a.distance_km || 0) - (b.distance_km || 0);
                default: return 0;
            }
        });

    const closestDistance = Math.min(...filteredLots.map(lot => lot.distance_km || Infinity));

    const handleLotClick = (id: number) => {
        const lot = parkingLots.find(l => l.id === id);
        navigate(`/lot/${id}`, {
            state: {
                distance_km: lot?.distance_km
            }
        });
    };

    const [showMap, setShowMap] = useState(true);

    // Toggle Map on Wheel/Scroll direction
    const handleWheel = (e: React.WheelEvent) => {
        if (e.deltaY > 0 && showMap) {
            setShowMap(false); // Scrolling down -> Hide
        } else if (e.deltaY < 0 && !showMap && e.currentTarget.scrollTop === 0) {
            setShowMap(true); // Scrolling up AT TOP -> Show
        }
    };

    return (
        <Box
            sx={{ height: '100vh', bgcolor: 'background.default', overflowY: 'auto', position: 'relative', scrollBehavior: 'smooth' }}
            onWheel={handleWheel}
        >
            {/* Top Section: Map */}
            <Box sx={{
                height: showMap ? '40vh' : '0px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'height 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s ease',
                opacity: showMap ? 1 : 0
            }}>
                {isLoaded ? (
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={{
                            lat: Number(mapCenter.lat) || defaultCenter.lat,
                            lng: Number(mapCenter.lng) || defaultCenter.lng
                        }}
                        zoom={16}
                        options={{
                            disableDefaultUI: false,
                            zoomControl: true,
                            mapTypeId: 'roadmap',
                            gestureHandling: 'cooperative',
                            styles: [
                                { featureType: "poi.business", stylers: [{ visibility: "off" }] },
                                {
                                    featureType: "water",
                                    elementType: "geometry",
                                    stylers: [{ color: "#e9e9e9" }, { lightness: 17 }]
                                },
                                {
                                    featureType: "landscape",
                                    elementType: "geometry",
                                    stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
                                }
                            ]
                        }}
                    >
                        {filteredLots.map(lot => (
                            <MarkerF
                                key={lot.id}
                                position={{ lat: Number(lot.latitude), lng: Number(lot.longitude) }}
                                onClick={() => setSelectedMarker(lot)}
                                icon={lot.distance_km === closestDistance ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png" : undefined}
                            />
                        ))}

                        {selectedMarker && (
                            <InfoWindowF
                                position={{ lat: Number(selectedMarker.latitude), lng: Number(selectedMarker.longitude) }}
                                onCloseClick={() => setSelectedMarker(null)}
                            >
                                <Paper sx={{ p: 1, minWidth: 150, border: 'none', boxShadow: 'none' }}>
                                    <Typography variant="subtitle2" color="primary" gutterBottom>
                                        {selectedMarker.name}
                                    </Typography>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="body2" fontWeight="bold">
                                            ${selectedMarker.pricePerHour}/hr
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {selectedMarker.distance_km?.toFixed(1)} km
                                        </Typography>
                                    </Stack>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        fullWidth
                                        onClick={() => selectedMarker.id && handleLotClick(selectedMarker.id)}
                                    >
                                        View
                                    </Button>
                                </Paper>
                            </InfoWindowF>
                        )}
                    </GoogleMap>
                ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: 'grey.200' }}>
                        <CircularProgress />
                    </Box>
                )}



                {/* Search Bar & User Controls */}
                <Box sx={{
                    position: 'absolute',
                    top: 24,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '90%',
                    maxWidth: 600,
                    zIndex: 10,
                    display: 'flex',
                    gap: 1
                }}>
                    <Paper
                        elevation={6}
                        sx={{
                            flex: 1,
                            borderRadius: 4,
                            p: 0.5,
                            bgcolor: 'rgba(26, 35, 50, 0.95)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid',
                            borderColor: 'rgba(255, 255, 255, 0.12)'
                        }}
                    >
                        <SearchBar
                            value={searchTerm}
                            onChange={setSearchTerm}
                            onSearch={handleSearch}
                        />
                    </Paper>
                    {user?.role === 'admin' && (
                        <Paper
                            elevation={6}
                            sx={{
                                borderRadius: '50%',
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(26, 35, 50, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 212, 170, 0.15)',
                                    borderColor: 'primary.main'
                                }
                            }}
                            onClick={() => navigate('/admin/listings')}
                        >
                            <Tooltip title="Admin Portal">
                                <StorefrontIcon sx={{ color: '#00d4aa' }} />
                            </Tooltip>
                        </Paper>
                    )}
                    <Paper
                        elevation={6}
                        sx={{
                            borderRadius: '50%',
                            width: 50,
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(26, 35, 50, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'rgba(0, 212, 170, 0.15)',
                                borderColor: 'primary.main'
                            }
                        }}
                        onClick={() => navigate('/wallet')}
                    >
                        <Tooltip title="Wallet">
                            <AccountBalanceWalletIcon sx={{ color: '#00d4aa' }} />
                        </Tooltip>
                    </Paper>
                    <Paper
                        elevation={6}
                        sx={{
                            borderRadius: '50%',
                            width: 50,
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(26, 35, 50, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'rgba(255, 71, 87, 0.15)',
                                borderColor: 'error.main'
                            }
                        }}
                        onClick={logout}
                    >
                        <Tooltip title="Logout">
                            <LogoutIcon sx={{ color: '#ff4757' }} />
                        </Tooltip>
                    </Paper>
                    {user?.role === 'admin' && (
                        <Paper
                            elevation={6}
                            sx={{
                                borderRadius: '50%',
                                width: 50,
                                height: 50,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'rgba(26, 35, 50, 0.95)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                cursor: 'pointer',
                                '&:hover': {
                                    bgcolor: 'rgba(0, 212, 170, 0.15)',
                                    borderColor: 'primary.main'
                                }
                            }}
                            onClick={() => navigate('/admin/dashboard')}
                        >
                            <Tooltip title="Admin Dashboard">
                                <DashboardIcon sx={{ color: '#00d4aa' }} />
                            </Tooltip>
                        </Paper>
                    )}
                    <Paper
                        elevation={6}
                        sx={{
                            borderRadius: '50%',
                            width: 50,
                            height: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'rgba(26, 35, 50, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            cursor: 'pointer',
                            '&:hover': {
                                bgcolor: 'rgba(0, 212, 170, 0.15)',
                                borderColor: 'primary.main'
                            }
                        }}
                        onClick={() => navigate('/my-bookings')}
                    >
                        <Tooltip title="My Bookings">
                            <Badge badgeContent={bookingCount} color="error">
                                <ReceiptLongIcon sx={{ color: '#00d4aa' }} />
                            </Badge>
                        </Tooltip>
                    </Paper>
                </Box>
            </Box>

            {/* Middle Bar */}
            <Paper
                square
                elevation={1}
                sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    zIndex: 20,
                    position: 'sticky',
                    top: 0
                }}
            >
                <Typography variant="body2" color="text.secondary">
                    Found <strong>{filteredLots.length}</strong> parkings near you
                </Typography>
                <Button
                    variant={showFilters ? "contained" : "outlined"}
                    startIcon={<FilterListIcon />}
                    onClick={() => setShowFilters(!showFilters)}
                    size="small"
                >
                    Filters
                </Button>
            </Paper>

            {/* Filter Panel Transition */}
            {
                showFilters && (
                    <Fade in={showFilters}>
                        <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', p: 3 }}>
                            <Container maxWidth="lg">
                                <FilterPanel filters={filters} onFilterChange={setFilters} />
                            </Container>
                        </Box>
                    </Fade>
                )
            }

            {/* Bottom Content: List */}
            <Box sx={{ py: 4, bgcolor: 'background.default', minHeight: '100vh' }}>
                <Container maxWidth="lg">
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
                        {loading ? (
                            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredLots.length > 0 ? (
                            filteredLots.map(lot => (
                                <Box key={lot.id} sx={{ height: '100%' }}>
                                    <ParkingLotCard
                                        parkingLot={lot}
                                        onClick={handleLotClick}
                                        isCheapest={lot.pricePerHour === Math.min(...filteredLots.map(l => l.pricePerHour))}
                                        isClosest={lot.distance_km === closestDistance}
                                    />
                                </Box>
                            ))
                        ) : (
                            <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 10 }}>
                                <Typography variant="h5" color="text.secondary" gutterBottom>
                                    No parking lots found
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Try adjusting your filters or search area
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Private Driveway Listings Section */}
                    {listings.length > 0 && (
                        <Box sx={{ mt: 6 }}>
                            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700, color: 'text.primary' }}>
                                Private Driveway Listings
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', md: 'repeat(3, minmax(0, 1fr))' }, gap: 3 }}>
                                {loadingListings ? (
                                    <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 8 }}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    listings.map(listing => (
                                        <Box key={listing.id} sx={{ height: '100%' }}>
                                            <ListingCard
                                                listing={listing}
                                                onView={(id) => navigate(`/admin/listings`)}
                                            />
                                        </Box>
                                    ))
                                )}
                            </Box>
                        </Box>
                    )}
                </Container>
            </Box>
        </Box >
    );
};

export default Home;
