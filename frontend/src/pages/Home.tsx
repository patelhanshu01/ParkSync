import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  GoogleMap,
  useJsApiLoader,
  MarkerF,
  InfoWindowF,
} from "@react-google-maps/api";
import {
  FixedSizeList as VirtualList,
  ListChildComponentProps,
} from "react-window";
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  Stack,
  CircularProgress,
  Fade,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Menu,
  MenuItem,
  IconButton,
  LinearProgress,
  Chip,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import SearchBar from "../Components/searchBar";
import ParkingLotCard from "../Components/ParkingLotCard";
import ListingCard from "../Components/ListingCard";
import FilterPanel from "../Components/FilterPanel";
import { ParkingLot, SearchFilters } from "../types/Parking";
import { Listing } from "../types/Listing";
import {
  ParkingLotSkeleton,
  ListingSkeleton,
} from "../Components/LoadingSkeletons";
import { getParkingLots } from "../api/parkingApi";
import { getMyBookings, Reservation } from "../api/reservationApi";
import { getListings } from "../api/listingApi";
import { useAuth } from "../context/AuthContext";
import { useVoice } from "../context/VoiceContext";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import NotificationsIcon from "@mui/icons-material/Notifications";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import ViewListIcon from "@mui/icons-material/ViewList";
import CloseIcon from "@mui/icons-material/Close";
import ForestIcon from "@mui/icons-material/Forest";
import LocalGasStationIcon from "@mui/icons-material/LocalGasStation";
import AirIcon from "@mui/icons-material/Air";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import TimelineIcon from "@mui/icons-material/Timeline";
import BoltIcon from "@mui/icons-material/Bolt";

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 43.6532, // Toronto
  lng: -79.3832,
};

const LIBRARIES: any[] = ["places"];

const ACCENT_COLOR = "#00d4aa";
const GRID_GAP = 24;
const CARD_ROW_HEIGHT = 360;
const MIN_LIST_HEIGHT = 420;

type FeatureItem = {
  key: string;
  label: string;
  icon: React.ReactElement;
  path?: string;
  requiresAdmin?: boolean;
  badge?: number;
};

type LotRowData = {
  items: ParkingLot[];
  columnCount: number;
  gap: number;
  rowHeight: number;
  onLotClick: (lot: ParkingLot) => void;
  cheapestPrice: number;
  closestDistance: number;
};

type MapBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

type EcoTimelineItem = {
  label: string;
  trips: number;
  kg: number;
};

type EcoStats = {
  totalKg: number;
  weekKg: number;
  monthKg: number;
  treesEquivalent: number;
  fuelSavedL: number;
  emissionsAvoidedKg: number;
  points: number;
  level: number;
  nextLevel: number | null;
  nextLevelPoints: number;
  levelProgress: number;
  timeline: EcoTimelineItem[];
  goalKg: number;
  goalProgress: number;
  goalRemaining: number;
  tripCount: number;
};

const CLOSEST_MARKER_ICON =
  "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
const BOUNDS_EPSILON = 1e-6;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ECO_TIMELINE_WEEKS = 4;
const ECO_GOAL_KG = 30;
const KG_PER_TREE = 21;
const KG_PER_LITER_FUEL = 2.31;
const ECO_POINTS_PER_KG = 30;
const ECO_LEVEL_THRESHOLDS = [0, 300, 700, 1200, 2000];

const getWeekStartMs = (date: Date) => {
  const target = new Date(date);
  const day = target.getDay();
  const diff = (day + 6) % 7;
  target.setHours(0, 0, 0, 0);
  target.setDate(target.getDate() - diff);
  return target.getTime();
};

const formatWeekLabel = (startMs: number) => {
  const date = new Date(startMs);
  const month = date.toLocaleString("en-US", { month: "short" });
  return `Week of ${month} ${date.getDate()}`;
};

const buildEcoStats = (bookings: Reservation[]): EcoStats => {
  const now = new Date();
  const nowMs = now.getTime();
  const weekStartMs = getWeekStartMs(now);
  const monthStartMs = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const oldestWeekStart = weekStartMs - (ECO_TIMELINE_WEEKS - 1) * WEEK_MS;

  const buckets = new Array(ECO_TIMELINE_WEEKS);
  for (let i = 0; i < ECO_TIMELINE_WEEKS; i++) {
    buckets[i] = {
      startMs: oldestWeekStart + i * WEEK_MS,
      trips: 0,
      co2G: 0,
    };
  }

  let totalCo2G = 0;
  let weekCo2G = 0;
  let monthCo2G = 0;
  let tripCount = 0;

  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    const co2G = Number(booking.co2_estimated_g);
    const safeCo2G = Number.isFinite(co2G) ? co2G : 0;
    totalCo2G += safeCo2G;
    tripCount += 1;

    const startMs = new Date(booking.startTime).getTime();
    if (!Number.isFinite(startMs)) continue;

    if (startMs >= weekStartMs && startMs < weekStartMs + WEEK_MS) {
      weekCo2G += safeCo2G;
    }
    if (startMs >= monthStartMs && startMs <= nowMs) {
      monthCo2G += safeCo2G;
    }
    if (startMs >= oldestWeekStart && startMs < weekStartMs + WEEK_MS) {
      const index = Math.floor((startMs - oldestWeekStart) / WEEK_MS);
      if (index >= 0 && index < ECO_TIMELINE_WEEKS) {
        buckets[index].co2G += safeCo2G;
        buckets[index].trips += 1;
      }
    }
  }

  const totalKg = totalCo2G / 1000;
  const weekKg = weekCo2G / 1000;
  const monthKg = monthCo2G / 1000;
  const treesEquivalent = totalKg / KG_PER_TREE;
  const fuelSavedL = totalKg / KG_PER_LITER_FUEL;
  const emissionsAvoidedKg = totalKg;
  const points = Math.max(0, Math.round(totalKg * ECO_POINTS_PER_KG));

  let levelIndex = 0;
  for (let i = ECO_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= ECO_LEVEL_THRESHOLDS[i]) {
      levelIndex = i;
      break;
    }
  }

  const level = levelIndex + 1;
  const currentThreshold = ECO_LEVEL_THRESHOLDS[levelIndex];
  const nextThreshold = ECO_LEVEL_THRESHOLDS[levelIndex + 1];
  const nextLevel = nextThreshold ? level + 1 : null;
  const nextLevelPoints = nextThreshold ?? points;
  const levelProgress = nextThreshold
    ? Math.min(
        1,
        (points - currentThreshold) /
          Math.max(1, nextThreshold - currentThreshold)
      )
    : 1;

  const timeline = buckets.map((bucket) => ({
    label: formatWeekLabel(bucket.startMs),
    trips: bucket.trips,
    kg: bucket.co2G / 1000,
  }));

  const goalProgress =
    ECO_GOAL_KG > 0 ? Math.min(100, (monthKg / ECO_GOAL_KG) * 100) : 0;

  return {
    totalKg,
    weekKg,
    monthKg,
    treesEquivalent,
    fuelSavedL,
    emissionsAvoidedKg,
    points,
    level,
    nextLevel,
    nextLevelPoints,
    levelProgress,
    timeline,
    goalKg: ECO_GOAL_KG,
    goalProgress,
    goalRemaining: Math.max(0, ECO_GOAL_KG - monthKg),
    tripCount,
  };
};

const LotRow = ({
  index,
  style,
  data,
}: ListChildComponentProps<LotRowData>) => {
  const {
    items,
    columnCount,
    gap,
    rowHeight,
    onLotClick,
    cheapestPrice,
    closestDistance,
  } = data;
  const startIndex = index * columnCount;
  const endIndex = Math.min(startIndex + columnCount, items.length);
  const rowItems = [];
  for (let i = startIndex; i < endIndex; i++) {
    const lot = items[i];
    rowItems.push(
      <Box key={lot.id ?? `lot-${i}`} sx={{ height: rowHeight - gap }}>
        <ParkingLotCard
          parkingLot={lot}
          onClick={onLotClick}
          isCheapest={lot.pricePerHour === cheapestPrice}
          isClosest={lot.distance_km === closestDistance}
        />
      </Box>
    );
  }

  return (
    <Box
      style={style}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))`,
        gap: `${gap}px`,
        paddingBottom: `${gap}px`,
        boxSizing: "border-box",
      }}
    >
      {rowItems}
    </Box>
  );
};

const Home: React.FC = () => {
  const PAGE_SIZE = 12;
  const [parkingLots, setParkingLots] = useState<ParkingLot[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedMarker, setSelectedMarker] = useState<ParkingLot | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    price_range: { min: 0, max: 100 },
    sort_by: "distance_asc",
    only_available: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);
  const [ecoOpen, setEcoOpen] = useState(false);
  const [ecoStats, setEcoStats] = useState<EcoStats | null>(null);
  const [ecoLoading, setEcoLoading] = useState(false);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [listWidth, setListWidth] = useState(0);
  const [listHeight, setListHeight] = useState(0);
  const mapRef = useRef<any | null>(null);
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const userLocationRef = useRef(userLocation);
  const initialParkingFetchDone = useRef(false);
  const requestIdRef = useRef(0);
  const searchDebounceRef = useRef<number | null>(null);
  const lastSearchRef = useRef("");
  const [bookingsAnchorEl, setBookingsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { searchRequest, clearSearchRequest } = useVoice();

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (loadError) {
      console.error("Google Maps Load Error:", loadError);
    }
  }, [loadError]);

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeId: "roadmap",
      gestureHandling: "cooperative",
      styles: [
        {
          featureType: "poi.business",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
        },
      ],
    }),
    []
  );

  const mapCenterValue = useMemo(
    () => ({
      lat: Number(mapCenter.lat) || defaultCenter.lat,
      lng: Number(mapCenter.lng) || defaultCenter.lng,
    }),
    [mapCenter.lat, mapCenter.lng]
  );

  useEffect(() => {
    userLocationRef.current = userLocation;
  }, [userLocation]);

  const computeDistanceKm = useCallback(
    (p1: { lat: number; lng: number }, p2: { lat: number; lng: number }) => {
      const R = 6371; // km
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) *
          Math.cos((p2.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  const updateMapBounds = useCallback(() => {
    const map = mapRef.current;
    if (!map?.getBounds) return;
    const bounds = map.getBounds();
    if (!bounds?.getNorthEast || !bounds?.getSouthWest) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    if (!ne || !sw) return;
    const nextBounds: MapBounds = {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };
    setMapBounds((prev) => {
      if (
        prev &&
        Math.abs(prev.north - nextBounds.north) < BOUNDS_EPSILON &&
        Math.abs(prev.south - nextBounds.south) < BOUNDS_EPSILON &&
        Math.abs(prev.east - nextBounds.east) < BOUNDS_EPSILON &&
        Math.abs(prev.west - nextBounds.west) < BOUNDS_EPSILON
      ) {
        return prev;
      }
      return nextBounds;
    });
  }, []);

  const handleMapLoad = useCallback(
    (map: any) => {
      mapRef.current = map;
      updateMapBounds();
    },
    [updateMapBounds]
  );

  const handleMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const fetchParkingLots = useCallback(
    async (searchQuery?: string, pageToLoad = 1) => {
      const requestId = ++requestIdRef.current;
      if (pageToLoad === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        let params: any = {};
        if (searchQuery) params.search = searchQuery;
        let locationForDistance = userLocationRef.current;

        if (navigator.geolocation && !searchQuery && !locationForDistance) {
          try {
            const position = await new Promise<GeolocationPosition>(
              (resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  timeout: 3000,
                });
              }
            );
            params.lat = position.coords.latitude;
            params.lng = position.coords.longitude;
            params.radius = 5;
            const nextLocation = { lat: params.lat, lng: params.lng };
            locationForDistance = nextLocation;
            setMapCenter(nextLocation);
            setUserLocation(nextLocation);
          } catch (e) {
            console.log("Location access denied");
          }
        } else if (locationForDistance) {
          params.lat = locationForDistance.lat;
          params.lng = locationForDistance.lng;
        }

        params.sort_by = filters.sort_by;
        params.page = pageToLoad;
        params.limit = PAGE_SIZE;

        const response = await getParkingLots(params);
        if (requestId !== requestIdRef.current) return;
        const { results, searchMetadata, pagination } = response.data;

        // Override distance_km on the client using current user location if available
        if (locationForDistance) {
          for (let i = 0; i < results.length; i++) {
            const lot = results[i];
            if (lot.latitude !== undefined && lot.longitude !== undefined) {
              const dist = computeDistanceKm(locationForDistance!, {
                lat: Number(lot.latitude),
                lng: Number(lot.longitude),
              });
              lot.distance_km = dist;
            }
          }
        }

        setParkingLots((prev) =>
          pageToLoad === 1 ? results : prev.concat(results)
        );
        setHasMore(
          pagination
            ? pageToLoad < pagination.totalPages
            : results.length === PAGE_SIZE
        );
        setPage(pageToLoad);
        if (searchMetadata) {
          setMapCenter({ lat: searchMetadata.lat, lng: searchMetadata.lng });
        }
      } catch (err) {
        console.error("Error fetching parking lots:", err);
      } finally {
        if (requestId !== requestIdRef.current) return;
        if (pageToLoad === 1) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [computeDistanceKm, filters.sort_by, PAGE_SIZE]
  );

  useEffect(() => {
    if (searchRequest) {
      const query = searchRequest.query.trim();
      if (query) {
        setSearchTerm(query);
        fetchParkingLots(query, 1);
        lastSearchRef.current = query;
      } else if (!initialParkingFetchDone.current) {
        fetchParkingLots(undefined, 1);
      }
      initialParkingFetchDone.current = true;
      clearSearchRequest();
      return;
    }

    if (!initialParkingFetchDone.current) {
      fetchParkingLots(undefined, 1);
      initialParkingFetchDone.current = true;
    }
  }, [fetchParkingLots, searchRequest, clearSearchRequest]);

  useEffect(() => {
    if (!user) {
      setBookingCount(0);
      setEcoStats(null);
      setEcoLoading(false);
      return;
    }

    let isActive = true;
    const fetchBookings = async () => {
      setEcoLoading(true);
      try {
        const bookings = await getMyBookings();
        if (!isActive) return;

        const now = Date.now();
        let activeCount = 0;
        for (let i = 0; i < bookings.length; i++) {
          const endMs = new Date(bookings[i].endTime).getTime();
          if (endMs > now) {
            activeCount += 1;
          }
        }

        setBookingCount(activeCount);
        setEcoStats(buildEcoStats(bookings));
      } catch (e) {
        if (isActive) {
          console.log("Failed to fetch bookings");
          setBookingCount(0);
          setEcoStats(null);
        }
      } finally {
        if (isActive) {
          setEcoLoading(false);
        }
      }
    };

    fetchBookings();
    return () => {
      isActive = false;
    };
  }, [user]);

  useEffect(() => {
    const fetchListings = async () => {
      setLoadingListings(true);
      try {
        const response = await getListings();
        setListings(response.data.results || []);
      } catch (e) {
        console.error("Failed to fetch listings:", e);
      } finally {
        setLoadingListings(false);
      }
    };
    fetchListings();
  }, []);

  const handleSearch = () => {
    const query = searchTerm.trim();
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    setSearchTerm(query);
    lastSearchRef.current = query;
    fetchParkingLots(query || undefined, 1);
  };

  useEffect(() => {
    if (!initialParkingFetchDone.current) return;
    const query = searchTerm.trim();
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }
    if (query === lastSearchRef.current) return;
    searchDebounceRef.current = window.setTimeout(() => {
      lastSearchRef.current = query;
      fetchParkingLots(query || undefined, 1);
    }, 400);
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [fetchParkingLots, searchTerm]);

  useEffect(() => {
    if (!initialParkingFetchDone.current) return;
    fetchParkingLots(searchTerm.trim(), 1);
  }, [filters.sort_by, fetchParkingLots]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const bookingsMenuOpen = Boolean(bookingsAnchorEl);
  const handleOpenBookingsMenu = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    setBookingsAnchorEl(event.currentTarget);
  };
  const handleCloseBookingsMenu = () => {
    setBookingsAnchorEl(null);
  };
  const handleBookingSectionNavigate = (
    section: "current" | "upcoming" | "past"
  ) => {
    setBookingsAnchorEl(null);
    navigate(`/my-bookings?section=${section}`);
  };

  const featureItems: FeatureItem[] = [
    {
      key: "bookings",
      label: "Bookings",
      icon: <CalendarMonthIcon />,
      path: "/my-bookings",
      badge: bookingCount,
    },
    {
      key: "wallet",
      label: "Wallet",
      icon: <AccountBalanceWalletIcon />,
      path: "/wallet",
    },
    { key: "eco", label: "Eco Impact", icon: <EnergySavingsLeafIcon /> },
    { key: "rewards", label: "Rewards", icon: <EmojiEventsIcon /> },
    { key: "vehicles", label: "Vehicles", icon: <DirectionsCarIcon /> },
    { key: "notifications", label: "Alerts", icon: <NotificationsIcon /> },
    {
      key: "host",
      label: "Host",
      icon: <HomeRoundedIcon />,
      path: "/host/dashboard",
    },
    { key: "settings", label: "Settings", icon: <SettingsIcon /> },
  ];

  const { filteredLots, closestDistance, cheapestPrice } = useMemo(() => {
    const nextFiltered: ParkingLot[] = [];
    let closest = Infinity;
    let cheapest = Infinity;

    for (let i = 0; i < parkingLots.length; i++) {
      const lot = parkingLots[i];
      const matchesPrice =
        !filters.price_range ||
        (lot.pricePerHour >= filters.price_range.min &&
          lot.pricePerHour <= filters.price_range.max);
      const matchAvailability = !filters.only_available || lot.isAvailable;
      const matchEV = !filters.ev_filter?.enabled || lot.has_ev_charging;
      if (!matchesPrice || !matchAvailability || !matchEV) {
        continue;
      }
      nextFiltered.push(lot);

      const distance = lot.distance_km ?? Infinity;
      if (distance < closest) closest = distance;
      if (lot.pricePerHour < cheapest) cheapest = lot.pricePerHour;
    }

    return {
      filteredLots: nextFiltered,
      closestDistance: closest,
      cheapestPrice: cheapest,
    };
  }, [parkingLots, filters]);

  const markerLots = useMemo(() => {
    if (viewMode !== "map") return [] as ParkingLot[];
    if (!mapBounds) return filteredLots;
    const { north, south, east, west } = mapBounds;
    const inBounds: ParkingLot[] = [];
    for (let i = 0; i < filteredLots.length; i++) {
      const lot = filteredLots[i];
      const lat = Number(lot.latitude);
      const lng = Number(lot.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      if (lat <= north && lat >= south && lng <= east && lng >= west) {
        inBounds.push(lot);
      }
    }
    return inBounds;
  }, [filteredLots, mapBounds, viewMode]);

  const markerNodes = useMemo(() => {
    if (viewMode !== "map") return null;
    const nodes: React.ReactNode[] = [];
    for (let i = 0; i < markerLots.length; i++) {
      const lot = markerLots[i];
      const lat = Number(lot.latitude);
      const lng = Number(lot.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
      nodes.push(
        <MarkerF
          key={lot.id ?? `marker-${i}`}
          position={{
            lat,
            lng,
          }}
          onClick={() => setSelectedMarker(lot)}
          icon={
            lot.distance_km === closestDistance
              ? CLOSEST_MARKER_ICON
              : undefined
          }
        />
      );
    }
    return nodes;
  }, [markerLots, closestDistance, viewMode]);

  const listLots = useMemo(
    () => (viewMode === "map" ? markerLots : filteredLots),
    [filteredLots, markerLots, viewMode]
  );
  const totalCount = filteredLots.length;
  const visibleCount = listLots.length;
  const hasAnyLots = totalCount > 0;
  const hasVisibleLots = visibleCount > 0;
  const mapSubtitle = !hasAnyLots
    ? searchTerm
      ? `No results near ${searchTerm}`
      : "No results near you"
    : totalCount !== visibleCount
    ? `Showing ${visibleCount} of ${totalCount} in view`
    : searchTerm
    ? `Near ${searchTerm}`
    : "Near you";

  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setListWidth(rect.width);
      setListHeight(rect.height);
    };

    updateSize();
    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => updateSize());
      observer.observe(container);
    } else {
      window.addEventListener("resize", updateSize);
    }

    return () => {
      if (observer) {
        observer.disconnect();
      } else {
        window.removeEventListener("resize", updateSize);
      }
    };
  }, [listLots.length, viewMode]);

  const handleLotClick = useCallback(
    (lot: ParkingLot) => {
      if (!lot.id) return;
      navigate(`/lot/${lot.id}`, {
        state: {
          distance_km: lot.distance_km,
          lot,
        },
      });
    },
    [navigate]
  );

  const listLayout = useMemo(() => {
    const width = listWidth || 0;
    const responsiveColumns = width >= 900 ? 3 : width >= 600 ? 2 : 1;
    const columnCount = viewMode === "map" ? 1 : responsiveColumns;
    const rowHeight = CARD_ROW_HEIGHT + GRID_GAP;
    const rowCount = Math.ceil(listLots.length / columnCount);
    const viewportHeight = Math.max(
      MIN_LIST_HEIGHT,
      Math.min(
        listHeight || MIN_LIST_HEIGHT,
        rowCount * rowHeight || MIN_LIST_HEIGHT
      )
    );
    return { columnCount, rowHeight, rowCount, viewportHeight };
  }, [listHeight, listLots.length, listWidth, viewMode]);

  const lotRowData = useMemo(
    () => ({
      items: listLots,
      columnCount: listLayout.columnCount,
      gap: GRID_GAP,
      rowHeight: listLayout.rowHeight,
      onLotClick: handleLotClick,
      cheapestPrice,
      closestDistance,
    }),
    [
      listLots,
      listLayout.columnCount,
      listLayout.rowHeight,
      handleLotClick,
      cheapestPrice,
      closestDistance,
    ]
  );

  const getRowKey = useCallback((index: number, data: LotRowData) => {
    const startIndex = index * data.columnCount;
    const lot = data.items[startIndex];
    return lot ? `row-${lot.id}` : `row-${index}`;
  }, []);

  const navIconButtonSx = {
    minWidth: 40,
    height: 40,
    px: 1,
    borderRadius: 999,
    color: "rgba(235,243,255,0.88)",
    bgcolor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.12)",
    textTransform: "none",
    justifyContent: "flex-start",
    transition:
      "transform 0.2s ease, background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease",
    "&:hover": {
      bgcolor: "rgba(0,212,170,0.2)",
      color: "#eafff8",
      borderColor: "rgba(0,212,170,0.5)",
      transform: "translateY(-2px)",
      boxShadow: "0 10px 18px rgba(0,212,170,0.22)",
    },
    "&.Mui-disabled": {
      color: "rgba(255,255,255,0.45)",
      opacity: 0.5,
    },
    "& .MuiButton-startIcon": {
      color: "inherit",
      margin: 0,
    },
    "& .feature-label": {
      maxWidth: 0,
      opacity: 0,
      overflow: "hidden",
      whiteSpace: "nowrap",
      marginLeft: 0,
      fontSize: "0.7rem",
      fontWeight: 600,
      letterSpacing: "0.02em",
      transition:
        "max-width 0.2s ease, opacity 0.2s ease, margin-left 0.2s ease",
    },
    "&:hover .feature-label": {
      maxWidth: 130,
      opacity: 1,
      marginLeft: 1.0,
    },
  } as const;

  const ecoPanelSx = {
    p: 2.5,
    borderRadius: 3,
    bgcolor: "rgba(12, 20, 32, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 18px 30px rgba(4, 9, 19, 0.45)",
  } as const;

  const ecoMetricCards = useMemo(() => {
    if (!ecoStats) return [];
    return [
      {
        label: "CO2 Saved",
        value: `${ecoStats.totalKg.toFixed(1)} kg`,
        delta: `${ecoStats.weekKg.toFixed(1)} kg this week`,
        icon: <EnergySavingsLeafIcon sx={{ color: "#34d399" }} />,
        iconBg: "rgba(52, 211, 153, 0.18)",
        accent: "#34d399",
      },
      {
        label: "Trees Equivalent",
        value: `${ecoStats.treesEquivalent.toFixed(1)}`,
        delta: `${ecoStats.monthKg.toFixed(1)} kg this month`,
        icon: <ForestIcon sx={{ color: "#22c55e" }} />,
        iconBg: "rgba(34, 197, 94, 0.18)",
        accent: "#22c55e",
      },
      {
        label: "Fuel Saved",
        value: `${ecoStats.fuelSavedL.toFixed(1)} L`,
        delta: `${(ecoStats.weekKg / KG_PER_LITER_FUEL).toFixed(
          1
        )} L this week`,
        icon: <LocalGasStationIcon sx={{ color: "#38bdf8" }} />,
        iconBg: "rgba(56, 189, 248, 0.18)",
        accent: "#38bdf8",
      },
      {
        label: "Emissions Avoided",
        value: `${ecoStats.emissionsAvoidedKg.toFixed(1)} kg`,
        delta: `${ecoStats.monthKg.toFixed(1)} kg this month`,
        icon: <AirIcon sx={{ color: "#22d3ee" }} />,
        iconBg: "rgba(34, 211, 238, 0.18)",
        accent: "#22d3ee",
      },
    ];
  }, [ecoStats]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        position: "relative",
      }}
    >
      {/* Top Navigation */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 30,
          background:
            "linear-gradient(180deg, rgba(6, 10, 18, 0.98) 0%, rgba(8, 14, 24, 0.98) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(18px)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 40px rgba(3, 7, 16, 0.65)",
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: 1400 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "auto 1fr" },
              alignItems: "center",
              gap: { xs: 2, lg: 3 },
              py: { xs: 2, lg: 2.5 },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, rgba(0,212,170,1) 0%, rgba(92,246,216,1) 100%)",
                  border: "1px solid rgba(255,255,255,0.18)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0b1b2d",
                  boxShadow:
                    "0 12px 24px rgba(0,212,170,0.35), inset 0 0 12px rgba(255,255,255,0.2)",
                }}
              >
                <DirectionsCarIcon sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: "common.white",
                    lineHeight: 1,
                    letterSpacing: "0.02em",
                  }}
                >
                  ParkSync
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Smart parking for a smarter city
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                flexWrap: "wrap",
                width: "100%",
                justifyContent: { xs: "flex-start", lg: "flex-end" },
              }}
            >
              {featureItems.map((item) => {
                const isBookings = item.key === "bookings";
                const isEco = item.key === "eco";
                const isDisabled = !item.path && !isBookings && !isEco;
                const iconNode =
                  item.badge && item.badge > 0 ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  );

                return (
                  <Button
                    key={item.key}
                    disabled={isDisabled}
                    startIcon={iconNode}
                    aria-label={item.label}
                    id={isBookings ? "bookings-menu-button" : undefined}
                    aria-haspopup={isBookings ? "menu" : undefined}
                    aria-controls={
                      isBookings && bookingsMenuOpen
                        ? "bookings-menu"
                        : undefined
                    }
                    aria-expanded={
                      isBookings && bookingsMenuOpen ? "true" : undefined
                    }
                    onClick={(event) => {
                      if (isBookings) {
                        handleOpenBookingsMenu(event);
                        return;
                      }
                      if (isEco) {
                        setEcoOpen(true);
                        return;
                      }
                      if (!isDisabled && item.path) {
                        navigate(item.path);
                      }
                    }}
                    sx={navIconButtonSx}
                  >
                    <Box component="span" className="feature-label">
                      {item.label}
                    </Box>
                  </Button>
                );
              })}
              <Button
                variant="text"
                startIcon={user ? <LogoutIcon /> : <LoginIcon />}
                onClick={user ? handleLogout : () => navigate("/login")}
                sx={navIconButtonSx}
              >
                <Box component="span" className="feature-label">
                  {user ? "Log out" : "Log in"}
                </Box>
              </Button>
            </Box>
          </Box>

          <Menu
            id="bookings-menu"
            anchorEl={bookingsAnchorEl}
            open={bookingsMenuOpen}
            onClose={handleCloseBookingsMenu}
            MenuListProps={{ "aria-labelledby": "bookings-menu-button" }}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            PaperProps={{
              sx: {
                bgcolor: "rgba(12, 20, 32, 0.98)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "common.white",
              },
            }}
          >
            <MenuItem onClick={() => handleBookingSectionNavigate("current")}>
              Current bookings
            </MenuItem>
            <MenuItem onClick={() => handleBookingSectionNavigate("upcoming")}>
              Upcoming bookings
            </MenuItem>
            <MenuItem onClick={() => handleBookingSectionNavigate("past")}>
              Past bookings
            </MenuItem>
          </Menu>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              pb: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Paper
              elevation={6}
              sx={{
                flex: 1,
                minWidth: 220,
                borderRadius: 4,
                p: 0.5,
                bgcolor: "rgba(26, 35, 50, 0.95)",
                backdropFilter: "blur(12px)",
                border: "1px solid",
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
            >
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
              />
            </Paper>

            <Button
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 600,
                borderColor: "rgba(255,255,255,0.2)",
                color: "common.white",
                bgcolor: showFilters ? "rgba(0,212,170,0.2)" : "transparent",
                "&:hover": {
                  borderColor: ACCENT_COLOR,
                  bgcolor: "rgba(0,212,170,0.16)",
                },
              }}
            >
              Filters
            </Button>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                marginLeft: "auto",
              }}
            >
              <Button
                variant={viewMode === "map" ? "contained" : "outlined"}
                startIcon={<MapRoundedIcon />}
                onClick={() => setViewMode("map")}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: viewMode === "map" ? "#062a25" : "common.white",
                  bgcolor: viewMode === "map" ? ACCENT_COLOR : "transparent",
                  "&:hover": {
                    borderColor: ACCENT_COLOR,
                    bgcolor:
                      viewMode === "map" ? "#19e6bc" : "rgba(0,212,170,0.16)",
                  },
                }}
              >
                Map
              </Button>
              <Button
                variant={viewMode === "list" ? "contained" : "outlined"}
                startIcon={<ViewListIcon />}
                onClick={() => setViewMode("list")}
                sx={{
                  borderRadius: 999,
                  textTransform: "none",
                  fontWeight: 700,
                  borderColor: "rgba(255,255,255,0.2)",
                  color: viewMode === "list" ? "#062a25" : "common.white",
                  bgcolor: viewMode === "list" ? ACCENT_COLOR : "transparent",
                  "&:hover": {
                    borderColor: ACCENT_COLOR,
                    bgcolor:
                      viewMode === "list" ? "#19e6bc" : "rgba(0,212,170,0.16)",
                  },
                }}
              >
                List
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Filter Panel Transition */}
      {showFilters && (
        <Fade in={showFilters}>
          <Box
            sx={{
              bgcolor: "white",
              borderBottom: "1px solid",
              borderColor: "divider",
              p: 3,
            }}
          >
            <Container maxWidth="lg">
              <FilterPanel filters={filters} onFilterChange={setFilters} />
            </Container>
          </Box>
        </Fade>
      )}

      {/* Content */}
      <Box sx={{ py: 3, bgcolor: "background.default" }}>
        <Container maxWidth="lg">
          {viewMode === "map" ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(0, 2fr) minmax(0, 1fr)",
                },
                gap: 3,
                alignItems: "stretch",
              }}
            >
              <Paper
                elevation={2}
                sx={{
                  borderRadius: 3,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.08)",
                  height: { xs: "55vh", md: "65vh", lg: "70vh" },
                }}
              >
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={mapCenterValue}
                    zoom={16}
                    options={mapOptions}
                    onLoad={handleMapLoad}
                    onUnmount={handleMapUnmount}
                    onIdle={updateMapBounds}
                  >
                    {markerNodes}

                    {selectedMarker && (
                      <InfoWindowF
                        position={{
                          lat: Number(selectedMarker.latitude),
                          lng: Number(selectedMarker.longitude),
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                      >
                        <Paper
                          sx={{
                            p: 1,
                            minWidth: 150,
                            border: "none",
                            boxShadow: "none",
                          }}
                        >
                          <Typography
                            variant="subtitle2"
                            color="primary"
                            gutterBottom
                          >
                            {selectedMarker.name}
                          </Typography>
                          <Stack
                            direction="row"
                            justifyContent="space-between"
                            alignItems="center"
                            sx={{ mb: 1 }}
                          >
                            <Typography variant="body2" fontWeight="bold">
                              ${selectedMarker.pricePerHour}/hr
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {selectedMarker.distance_km?.toFixed(1)} km
                            </Typography>
                          </Stack>
                          <Button
                            variant="contained"
                            size="small"
                            fullWidth
                            onClick={() =>
                              selectedMarker.id &&
                              handleLotClick(selectedMarker)
                            }
                          >
                            View
                          </Button>
                        </Paper>
                      </InfoWindowF>
                    )}
                  </GoogleMap>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      height: "100%",
                      bgcolor: "grey.200",
                    }}
                  >
                    <CircularProgress />
                  </Box>
                )}
              </Paper>

              <Paper
                elevation={6}
                sx={{
                  bgcolor: "rgba(13, 22, 37, 0.98)",
                  color: "common.white",
                  borderRadius: 3,
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  height: { xs: "55vh", md: "65vh", lg: "70vh" },
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {hasAnyLots
                      ? `${visibleCount} parking spots in view`
                      : "0 parking spots found"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.7)" }}
                  >
                    {mapSubtitle}
                  </Typography>
                </Box>

                {loading ? (
                  <Box sx={{ display: "grid", gap: 2 }}>
                    {Array.from(new Array(3)).map((_, index) => (
                      <Box key={index} sx={{ height: "100%" }}>
                        <ParkingLotSkeleton />
                      </Box>
                    ))}
                  </Box>
                ) : hasVisibleLots ? (
                  <Box ref={listContainerRef} sx={{ flex: 1, minHeight: 0 }}>
                    <VirtualList
                      height={listLayout.viewportHeight}
                      width={listWidth || "100%"}
                      itemCount={listLayout.rowCount}
                      itemSize={listLayout.rowHeight}
                      itemData={lotRowData}
                      itemKey={getRowKey}
                      overscanCount={2}
                    >
                      {LotRow}
                    </VirtualList>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: "center", py: 6 }}>
                    <Typography variant="h6" sx={{ color: "common.white" }}>
                      {hasAnyLots
                        ? "No parking lots in view"
                        : "No parking lots found"}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      {hasAnyLots
                        ? "Pan or zoom the map to see more results"
                        : "Try adjusting your filters or search area"}
                    </Typography>
                  </Box>
                )}

                {hasMore && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <Button
                      variant="outlined"
                      onClick={() =>
                        fetchParkingLots(searchTerm.trim(), page + 1)
                      }
                      disabled={loadingMore}
                      sx={{
                        borderColor: "rgba(255,255,255,0.3)",
                        color: "common.white",
                        "&:hover": {
                          borderColor: ACCENT_COLOR,
                          color: ACCENT_COLOR,
                        },
                      }}
                    >
                      {loadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </Box>
                )}
              </Paper>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Found <strong>{listLots.length}</strong> parkings near you
              </Typography>

              {loading ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(3, minmax(0, 1fr))",
                    },
                    gap: 3,
                  }}
                >
                  {Array.from(new Array(6)).map((_, index) => (
                    <Box key={index} sx={{ height: "100%" }}>
                      <ParkingLotSkeleton />
                    </Box>
                  ))}
                </Box>
              ) : listLots.length > 0 ? (
                <Box
                  ref={listContainerRef}
                  sx={{
                    height: { xs: "70vh", md: "75vh" },
                    minHeight: MIN_LIST_HEIGHT,
                    maxHeight: 900,
                  }}
                >
                  <VirtualList
                    height={listLayout.viewportHeight}
                    width={listWidth || "100%"}
                    itemCount={listLayout.rowCount}
                    itemSize={listLayout.rowHeight}
                    itemData={lotRowData}
                    itemKey={getRowKey}
                    overscanCount={2}
                  >
                    {LotRow}
                  </VirtualList>
                </Box>
              ) : (
                <Box sx={{ textAlign: "center", py: 10 }}>
                  <Typography variant="h5" color="text.secondary" gutterBottom>
                    No parking lots found
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Try adjusting your filters or search area
                  </Typography>
                </Box>
              )}

              {hasMore && (
                <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
                  <Button
                    variant="outlined"
                    onClick={() =>
                      fetchParkingLots(searchTerm.trim(), page + 1)
                    }
                    disabled={loadingMore}
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </Button>
                </Box>
              )}

              {/* Private Driveway Listings Section */}
              {(listings.length > 0 || loadingListings) && (
                <Box sx={{ mt: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{ mb: 3, fontWeight: 700, color: "text.primary" }}
                  >
                    Private Driveway Listings
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(3, minmax(0, 1fr))",
                      },
                      gap: 3,
                    }}
                  >
                    {loadingListings
                      ? Array.from(new Array(3)).map((_, index) => (
                          <Box key={index} sx={{ height: "100%" }}>
                            <ListingSkeleton />
                          </Box>
                        ))
                      : listings.map((listing) => (
                          <Box key={listing.id} sx={{ height: "100%" }}>
                            <ListingCard
                              listing={listing}
                              onView={() => setSelectedListing(listing)}
                            />
                          </Box>
                        ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Container>
      </Box>

      <Dialog
        open={!!selectedListing}
        onClose={() => setSelectedListing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Listing Details</DialogTitle>
        <DialogContent dividers>
          {selectedListing && (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                {selectedListing.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedListing.description || "No description provided."}
              </Typography>
              <Divider />
              <Typography variant="body2">
                <strong>Address:</strong>{" "}
                {selectedListing.address ||
                  selectedListing.location ||
                  "Not provided"}
              </Typography>
              <Typography variant="body2">
                <strong>Rate:</strong> $
                {Number(selectedListing.pricePerHour || 0).toFixed(2)}/hr
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong>{" "}
                {selectedListing.isActive ? "Active" : "Inactive"}
              </Typography>
              <Typography variant="body2">
                <strong>Type:</strong>{" "}
                {selectedListing.isPrivate ? "Private" : "Public"}
              </Typography>
              {selectedListing.contact_info && (
                <Typography variant="body2">
                  <strong>Contact:</strong> {selectedListing.contact_info}
                </Typography>
              )}
              {selectedListing.createdAt && (
                <Typography variant="body2" color="text.secondary">
                  Listed on{" "}
                  {new Date(selectedListing.createdAt).toLocaleString()}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedListing(null)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (!selectedListing) return;
              const duration = 2;
              const totalCost =
                Number(selectedListing.pricePerHour || 0) * duration;
              navigate("/payment", {
                state: {
                  listing: selectedListing,
                  duration,
                  totalCost,
                  startTime: new Date().toISOString(),
                },
              });
              setSelectedListing(null);
            }}
          >
            Book Spot
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Home;
