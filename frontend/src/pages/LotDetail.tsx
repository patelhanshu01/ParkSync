import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Container,
  Box,
  Button,
  Typography,
  Chip,
  Slider,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Divider,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import StarIcon from "@mui/icons-material/Star";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import { ParkingLot, ParkingSpot } from "../types/Parking";
import { getParkingLotById } from "../api/parkingApi";
import SpotVisualization from "../Components/SpotVisualization";
import { joinWaitlist } from "../api/waitlistApi";

const DURATION_MARKS = [
  { value: 1, label: "1h" },
  { value: 12, label: "12h" },
  { value: 24, label: "24h" },
];
const DURATION_PRESETS = [1, 2, 4, 8, 12, 24];
const UNSPLASH_FALLBACKS = [
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526626607727-42c162f7ab06?auto=format&fit=crop&w=800&q=80",
];
const getLocalDatetimeInputValue = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

type ReservationStatus = {
  isActive: boolean;
  remainingLabel: string;
};

type LotDetailLocationState = {
  distance_km?: number;
  lot?: ParkingLot;
};

const getReservationStatus = (
  reservation?: ParkingSpot["nextReservation"] | null
): ReservationStatus => {
  if (!reservation?.endTime) {
    return { isActive: false, remainingLabel: "" };
  }
  const end = new Date(reservation.endTime);
  const now = new Date();
  if (end <= now) {
    return { isActive: false, remainingLabel: "" };
  }
  const minutesRemaining = Math.ceil((end.getTime() - now.getTime()) / 60000);
  const remainingLabel =
    minutesRemaining < 60
      ? `${minutesRemaining} min`
      : `${Math.ceil(minutesRemaining / 60)} hr`;
  return { isActive: true, remainingLabel };
};
const getImageSources = (currentLot: ParkingLot | null) => {
  const lat = Number(currentLot?.latitude);
  const lng = Number(currentLot?.longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const mapKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const streetViewUrl =
    hasCoords && mapKey
      ? `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${lat},${lng}&fov=80&pitch=0&key=${mapKey}`
      : null;
  const rawImageUrl =
    typeof currentLot?.imageUrl === "string" ? currentLot.imageUrl : null;
  const isProxyPhoto =
    !!rawImageUrl && rawImageUrl.includes("/api/parking/photo");
  const isValidImageUrl =
    !!rawImageUrl &&
    (/^https?:\/\//i.test(rawImageUrl) || rawImageUrl.startsWith("/"));
  const isGenericFallback =
    isValidImageUrl &&
    (UNSPLASH_FALLBACKS.includes(rawImageUrl) || isProxyPhoto);
  const preferredImage =
    isGenericFallback && streetViewUrl
      ? streetViewUrl
      : isValidImageUrl && !isProxyPhoto
      ? rawImageUrl
      : null;

  const fallbackIndex = Number.isFinite(currentLot?.id)
    ? Math.abs(Number(currentLot?.id)) % UNSPLASH_FALLBACKS.length
    : 0;
  const fallbackImage = UNSPLASH_FALLBACKS[fallbackIndex];
  const initialImageUrl =
    preferredImage ||
    streetViewUrl ||
    (isValidImageUrl && !isProxyPhoto ? rawImageUrl : null) ||
    fallbackImage;
  return { initialImageUrl, streetViewUrl, fallbackImage };
};

const mergeSpotsById = (
  existing: ParkingSpot[],
  updates: ParkingSpot[],
  removedIds?: number[]
) => {
  const spotMap = new Map<number, ParkingSpot>();
  const unkeyed: ParkingSpot[] = [];
  for (let i = 0; i < existing.length; i++) {
    const spotId = existing[i].id;
    if (spotId == null) {
      unkeyed.push(existing[i]);
      continue;
    }
    spotMap.set(spotId, existing[i]);
  }
  if (removedIds && removedIds.length) {
    for (let i = 0; i < removedIds.length; i++) {
      spotMap.delete(removedIds[i]);
    }
  }
  for (let i = 0; i < updates.length; i++) {
    const update = updates[i];
    const updateId = update.id;
    if (updateId == null) {
      unkeyed.push(update);
      continue;
    }
    const current = spotMap.get(updateId);
    spotMap.set(updateId, { ...current, ...update });
  }
  return [...spotMap.values(), ...unkeyed];
};

const parseLotFromEvent = (
  event: MessageEvent,
  lotId: number,
  label: string
) => {
  try {
    const payload = JSON.parse(event.data || "{}");
    return payload.lots?.find((lot: any) => lot.id === lotId) ?? null;
  } catch (err) {
    console.error(`SSE ${label} parse error`, err);
    return null;
  }
};

const LotDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const lotId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LotDetailLocationState | null;
  const initialLot = locationState?.lot ? { ...locationState.lot } : null;
  const hasInitialLot = !!initialLot;

  if (initialLot && locationState?.distance_km !== undefined) {
    initialLot.distance_km = locationState.distance_km;
  }

  const [parkingLot, setParkingLot] = useState<ParkingLot | null>(initialLot);
  const [isLoading, setIsLoading] = useState(!hasInitialLot);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [duration, setDuration] = useState(2); // hours
  const [startTime, setStartTime] = useState(getLocalDatetimeInputValue);
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistPhone, setWaitlistPhone] = useState("");
  const [waitlistMessage, setWaitlistMessage] = useState<string | null>(null);
  const [resolvedImageUrl, setResolvedImageUrl] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<
    "spots" | "details" | "reviews"
  >("spots");
  const [paymentMethod, setPaymentMethod] = useState<"wallet" | "card">(
    "wallet"
  );

  useEffect(() => {
    if (!parkingLot) return;
    const { initialImageUrl } = getImageSources(parkingLot);
    setResolvedImageUrl((prev) =>
      prev === initialImageUrl ? prev : initialImageUrl
    );
  }, [
    parkingLot?.id,
    parkingLot?.imageUrl,
    parkingLot?.latitude,
    parkingLot?.longitude,
  ]);

  useEffect(() => {
    if (lotId === null) return;
    let isActive = true;
    const fetchParkingLot = async () => {
      try {
        setIsFetchingDetails(true);
        if (!hasInitialLot) {
          setIsLoading(true);
        }
        setLoadError(null);
        const response = await getParkingLotById(lotId, {
          includeReservations: true,
        });
        if (!isActive) return;
        const fetchedLot = response.data;

        if (locationState?.distance_km !== undefined) {
          fetchedLot.distance_km = locationState.distance_km;
        }
        setParkingLot(fetchedLot);
      } catch (err) {
        if (!isActive) return;
        setLoadError("Failed to fetch parking lot details");
      } finally {
        if (!isActive) return;
        setIsFetchingDetails(false);
        setIsLoading(false);
      }
    };
    fetchParkingLot();
    return () => {
      isActive = false;
    };
  }, [hasInitialLot, locationState?.distance_km, lotId]);

  useEffect(() => {
    if (lotId === null) return;
    const activeLotId = lotId;
    const source = new EventSource(
      `http://localhost:3000/api/parking/stream?lotId=${activeLotId}`
    );

    const handleSnapshot = (event: MessageEvent) => {
      const snapshot = parseLotFromEvent(event, activeLotId, "snapshot");
      if (!snapshot) return;
      setParkingLot((prev) => {
        if (!prev) return prev;
        const merged = mergeSpotsById(prev.spots || [], snapshot.spots || []);
        return { ...prev, spots: merged };
      });
    };

    const handleDelta = (event: MessageEvent) => {
      const delta = parseLotFromEvent(event, activeLotId, "delta");
      if (!delta) return;
      setParkingLot((prev) => {
        if (!prev) return prev;
        const merged = mergeSpotsById(
          prev.spots || [],
          delta.spots || [],
          delta.removedSpotIds
        );
        return { ...prev, spots: merged };
      });
    };

    source.addEventListener("snapshot", handleSnapshot);
    source.addEventListener("delta", handleDelta);
    source.onerror = () => {
      source.close();
    };
    return () => {
      source.removeEventListener("snapshot", handleSnapshot);
      source.removeEventListener("delta", handleDelta);
      source.close();
    };
  }, [lotId]);

  const handleReserve = () => {
    if (!selectedSpot && parkingLot?.spots && parkingLot.spots.length > 0) {
      alert("Please select a parking spot");
      return;
    }
    const selectedDate = new Date(startTime);
    navigate("/payment", {
      state: {
        lot: parkingLot,
        selectedSpot,
        duration,
        startTime: selectedDate.toISOString(),
        totalCost: (Number(parkingLot?.pricePerHour) || 0) * duration,
      },
    });
  };

  const handleJoinWaitlist = async () => {
    if (!parkingLot) return;
    try {
      const lotIdValue = parkingLot?.id;
      if (!lotIdValue) return;
      await joinWaitlist({
        parkingLotId: lotIdValue,
        contact_email: waitlistEmail || undefined,
        phone: waitlistPhone || undefined,
      });
      setWaitlistMessage(
        "Added to waitlist. We will notify you when a spot is available."
      );
    } catch (err) {
      setWaitlistMessage("Failed to join waitlist. Try again.");
    }
  };

  if (isLoading)
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
          Loading parking lot details...
        </Typography>
      </Box>
    );

  if (!parkingLot)
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          p: 3,
        }}
      >
        <Typography variant="h1" sx={{ fontSize: "48px", mb: 2 }}>
          ⚠️
        </Typography>
        <Alert severity="error">{loadError || "Parking lot not found"}</Alert>
      </Box>
    );

  const totalCost = Number(parkingLot.pricePerHour) * duration;

  const reservationStatus = getReservationStatus(
    selectedSpot?.nextReservation || undefined
  );
  const isSelectedSpotReserved = reservationStatus.isActive;
  const selectedSpotAvailabilityStr = reservationStatus.remainingLabel;

  const { streetViewUrl, fallbackImage } = getImageSources(parkingLot);
  const headerImageUrl = resolvedImageUrl || fallbackImage;
  const hasSpotData = (parkingLot.spots?.length || 0) > 0;
  const showSpotsLoading = isFetchingDetails && !hasSpotData;
  const isReserveDisabled =
    !parkingLot.isAvailable ||
    isSelectedSpotReserved ||
    isLoading ||
    isFetchingDetails ||
    !!loadError;
  const co2SavingsPct = Math.max(
    0,
    Math.round(Number(parkingLot.co2_impact?.savings_pct || 0))
  );
  const ratingValue = Number(parkingLot.rating);
  const hasRating = Number.isFinite(ratingValue) && ratingValue > 0;
  const amenityChips = [
    { key: "covered", label: "Covered", enabled: parkingLot.is_covered },
    { key: "cctv", label: "CCTV", enabled: parkingLot.has_cctv },
    {
      key: "accessible",
      label: "Accessible",
      enabled: parkingLot.has_accessibility,
    },
    { key: "free", label: "Free parking", enabled: parkingLot.is_free },
  ].filter((item) => item.enabled);

  const panelSx = {
    p: { xs: 2.5, md: 3 },
    borderRadius: 4,
    bgcolor: "rgba(12, 20, 32, 0.95)",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 24px 50px rgba(5, 9, 17, 0.55)",
  };

  const subPanelSx = {
    p: 2,
    borderRadius: 2,
    bgcolor: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const tabButtonSx = (active: boolean) => ({
    flex: 1,
    borderRadius: 999,
    textTransform: "none",
    fontWeight: 600,
    color: active ? "#04111d" : "rgba(255,255,255,0.7)",
    bgcolor: active ? "#22d3ee" : "transparent",
    border: "1px solid rgba(255,255,255,0.12)",
    "&:hover": {
      bgcolor: active ? "#38e1f6" : "rgba(255,255,255,0.08)",
    },
  });

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        background:
          "radial-gradient(circle at top, rgba(18, 28, 46, 0.95) 0%, rgba(8, 12, 22, 0.98) 45%, rgba(5, 8, 16, 1) 100%)",
        py: { xs: 3, md: 4 },
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: 1400 }}>
        {loadError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {loadError}
          </Alert>
        )}

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          variant="outlined"
          sx={{
            mb: 3,
            borderColor: "rgba(255,255,255,0.2)",
            color: "common.white",
            textTransform: "none",
            "&:hover": {
              borderColor: "#22d3ee",
              color: "#22d3ee",
            },
          }}
        >
          Back to Search
        </Button>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 2.1fr) minmax(320px, 1fr)",
            },
            gap: 3,
            alignItems: "start",
          }}
        >
          <Box sx={{ display: "grid", gap: 3 }}>
            <Paper
              sx={{
                overflow: "hidden",
                borderRadius: 4,
                bgcolor: "rgba(10, 16, 28, 0.96)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  height: { xs: 220, md: 320 },
                  overflow: "hidden",
                }}
              >
                <Box
                  component="img"
                  src={headerImageUrl}
                  alt={parkingLot.name}
                  onError={() => {
                    if (streetViewUrl && headerImageUrl !== streetViewUrl) {
                      setResolvedImageUrl(streetViewUrl);
                      return;
                    }
                    if (headerImageUrl !== fallbackImage) {
                      setResolvedImageUrl(fallbackImage);
                    }
                  }}
                  sx={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(180deg, rgba(6,10,18,0.05) 0%, rgba(6,10,18,0.75) 100%)",
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    display: "flex",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {co2SavingsPct > 0 && (
                    <Chip
                      icon={
                        <EnergySavingsLeafIcon sx={{ color: "#34d399" }} />
                      }
                      label={`${co2SavingsPct}% CO2 Saved`}
                      sx={{
                        bgcolor: "rgba(52, 211, 153, 0.18)",
                        color: "#34d399",
                        fontWeight: 600,
                        borderRadius: 999,
                      }}
                    />
                  )}
                  {parkingLot.has_ev_charging && (
                    <Chip
                      icon={<ElectricBoltIcon sx={{ color: "#38bdf8" }} />}
                      label={`${parkingLot.ev_chargers?.length || 0} EV Spots`}
                      sx={{
                        bgcolor: "rgba(56, 189, 248, 0.18)",
                        color: "#38bdf8",
                        fontWeight: 600,
                        borderRadius: 999,
                      }}
                    />
                  )}
                </Box>
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 16,
                    left: "50%",
                    transform: "translateX(-50%)",
                    display: "flex",
                    gap: 1,
                  }}
                >
                  {[0, 1, 2].map((dot) => (
                    <Box
                      key={dot}
                      sx={{
                        width: dot === 0 ? 18 : 8,
                        height: 8,
                        borderRadius: 999,
                        bgcolor:
                          dot === 0 ? "#22d3ee" : "rgba(255,255,255,0.3)",
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ p: { xs: 2.5, md: 3 }, display: "grid", gap: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "common.white" }}
                    >
                      {parkingLot.name}
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      <LocationOnIcon sx={{ fontSize: 18 }} />
                      <Typography variant="body2">
                        {parkingLot.location}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                        color: "rgba(255,255,255,0.7)",
                      }}
                    >
                      {hasRating ? (
                        <>
                          <StarIcon sx={{ fontSize: 18, color: "#facc15" }} />
                          <Typography variant="body2">
                            {ratingValue.toFixed(1)} rating
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2">No ratings yet</Typography>
                      )}
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      textAlign: { xs: "left", sm: "right" },
                      minWidth: 140,
                    }}
                  >
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 700, color: "common.white" }}
                    >
                      ${Number(parkingLot.pricePerHour).toFixed(2)}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      per hour
                    </Typography>
                    {parkingLot.distance_km !== undefined && (
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}
                      >
                        {Number(parkingLot.distance_km).toFixed(1)} km away
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {amenityChips.map((amenity) => (
                    <Chip
                      key={amenity.key}
                      label={amenity.label}
                      size="small"
                      sx={{
                        bgcolor: "rgba(255,255,255,0.08)",
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 600,
                      }}
                    />
                  ))}
                  {parkingLot.has_ev_charging && (
                    <Chip
                      label="EV charging"
                      size="small"
                      sx={{
                        bgcolor: "rgba(56, 189, 248, 0.18)",
                        color: "#38bdf8",
                        fontWeight: 600,
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Paper>

            <Paper sx={panelSx}>
              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  flexWrap: "wrap",
                }}
              >
                <Button
                  onClick={() => setActiveSection("spots")}
                  sx={tabButtonSx(activeSection === "spots")}
                >
                  Select Spot
                </Button>
                <Button
                  onClick={() => setActiveSection("details")}
                  sx={tabButtonSx(activeSection === "details")}
                >
                  Details
                </Button>
                <Button
                  onClick={() => setActiveSection("reviews")}
                  sx={tabButtonSx(activeSection === "reviews")}
                >
                  Reviews
                </Button>
              </Box>
              <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.08)" }} />

              {activeSection === "spots" ? (
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Select Parking Spot
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        {parkingLot.availableSpots || 0} spots available right
                        now
                      </Typography>
                    </Box>
                    <Chip
                      label={`${parkingLot.availableSpots || 0} open`}
                      size="small"
                      sx={{
                        bgcolor: "rgba(52, 211, 153, 0.15)",
                        color: "#34d399",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Box sx={{ minHeight: 360 }}>
                    {showSpotsLoading ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                          minHeight: 320,
                          gap: 2,
                        }}
                      >
                        <CircularProgress size={36} />
                        <Typography variant="body2" color="text.secondary">
                          Loading live spot availability...
                        </Typography>
                      </Box>
                    ) : (
                      <SpotVisualization
                        spots={parkingLot.spots || []}
                        onSpotClick={setSelectedSpot}
                        selectedSpotId={selectedSpot?.id}
                        pricePerHour={Number(parkingLot.pricePerHour)}
                      />
                    )}
                  </Box>

                  {selectedSpot && (
                    <Paper
                      elevation={0}
                      sx={{
                        mt: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: "rgba(34, 211, 238, 0.12)",
                        border: "1px solid rgba(34, 211, 238, 0.3)",
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        Selected Spot: S-{selectedSpot.spot_number}
                      </Typography>
                      {selectedSpot.nextReservation &&
                        (() => {
                          const end = new Date(
                            selectedSpot.nextReservation!.endTime
                          );
                          const now = new Date();
                          if (end > now) {
                            const endTimeStr = end.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                            return (
                              <Typography
                                variant="body2"
                                sx={{ color: "#fca5a5", mt: 0.5 }}
                              >
                                Reserved until {endTimeStr} (
                                {selectedSpotAvailabilityStr}). This spot is
                                reserved by another user.
                              </Typography>
                            );
                          }
                          return null;
                        })()}
                    </Paper>
                  )}
                </Box>
              ) : activeSection === "details" ? (
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    Parking details and amenities.
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 2,
                    }}
                  >
                    <Paper sx={subPanelSx}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Availability
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {parkingLot.availableSpots || 0} open spots
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Total: {parkingLot.totalSpots || 0} spots
                      </Typography>
                    </Paper>
                    <Paper sx={subPanelSx}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        Distance
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {parkingLot.distance_km !== undefined
                          ? `${Number(parkingLot.distance_km).toFixed(1)} km`
                          : "Not available"}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        From your current location
                      </Typography>
                    </Paper>
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Amenities
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {amenityChips.length === 0 && (
                        <Typography
                          variant="body2"
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          No additional amenities listed.
                        </Typography>
                      )}
                      {amenityChips.map((amenity) => (
                        <Chip
                          key={amenity.key}
                          label={amenity.label}
                          size="small"
                          sx={{
                            bgcolor: "rgba(255,255,255,0.08)",
                            color: "rgba(255,255,255,0.8)",
                            fontWeight: 600,
                          }}
                        />
                      ))}
                      {parkingLot.has_ev_charging && (
                        <Chip
                          label={`EV chargers ${
                            parkingLot.ev_chargers?.length || 0
                          }`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(56, 189, 248, 0.18)",
                            color: "#38bdf8",
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: "grid", gap: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.65)" }}
                  >
                    Reviews are coming soon. Here is the current rating.
                  </Typography>
                  <Paper sx={subPanelSx}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StarIcon sx={{ color: "#facc15" }} />
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {hasRating ? ratingValue.toFixed(1) : "No rating"}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}
                    >
                      {hasRating
                        ? "Based on recent user feedback."
                        : "Be the first to review this parking lot."}
                    </Typography>
                  </Paper>
                </Box>
              )}
            </Paper>
          </Box>

          <Box sx={{ display: "grid", gap: 3 }}>
            <Paper sx={panelSx}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Booking Summary
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: "rgba(255,255,255,0.6)" }}
              >
                {parkingLot.name}
              </Typography>

              <Box sx={{ display: "grid", gap: 2.2, mt: 2.5 }}>
                <Paper sx={subPanelSx}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CalendarMonthIcon sx={{ color: "#22d3ee" }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.6)" }}
                      >
                        Start time
                      </Typography>
                      <TextField
                        type="datetime-local"
                        fullWidth
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        sx={{
                          mt: 1,
                          "& .MuiInputBase-root": { color: "white" },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.2)",
                          },
                          "& input::-webkit-calendar-picker-indicator": {
                            filter:
                              "invert(61%) sepia(82%) saturate(420%) hue-rotate(121deg) brightness(93%) contrast(92%)",
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Paper>

                <Paper sx={subPanelSx}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <AccessTimeIcon sx={{ color: "#22d3ee" }} />
                      <Typography variant="subtitle2">Duration</Typography>
                    </Box>
                    <Typography variant="subtitle2">
                      {duration} hour{duration !== 1 ? "s" : ""}
                    </Typography>
                  </Box>
                  <Slider
                    value={duration}
                    onChange={(_e, value) => setDuration(value as number)}
                    min={1}
                    max={24}
                    marks={DURATION_MARKS}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}h`}
                    sx={{
                      color: "#22d3ee",
                      mt: 2,
                    }}
                  />
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    {DURATION_PRESETS.map((h) => (
                      <Chip
                        key={h}
                        label={`${h}h`}
                        onClick={() => setDuration(h)}
                        size="small"
                        sx={{
                          bgcolor:
                            duration === h
                              ? "rgba(34, 211, 238, 0.25)"
                              : "rgba(255,255,255,0.08)",
                          color:
                            duration === h
                              ? "#22d3ee"
                              : "rgba(255,255,255,0.8)",
                          fontWeight: 600,
                        }}
                      />
                    ))}
                  </Box>
                </Paper>

                <Paper sx={subPanelSx}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocalParkingIcon sx={{ color: "#22d3ee" }} />
                      <Typography variant="subtitle2">Selected spot</Typography>
                    </Box>
                    <Typography variant="subtitle2">
                      {selectedSpot ? selectedSpot.spot_number : "None selected"}
                    </Typography>
                  </Box>
                  {isSelectedSpotReserved && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#fca5a5", mt: 1, display: "block" }}
                    >
                      Spot reserved; available in {selectedSpotAvailabilityStr}.
                      Choose another or wait.
                    </Typography>
                  )}
                </Paper>

                <Box sx={{ display: "grid", gap: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      color: "rgba(255,255,255,0.7)",
                    }}
                  >
                    <Typography variant="body2">
                      ${Number(parkingLot.pricePerHour).toFixed(2)} x{" "}
                      {duration} hour{duration !== 1 ? "s" : ""}
                    </Typography>
                    <Typography variant="body2">
                      ${totalCost.toFixed(2)}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Total
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{ fontWeight: 700, color: "#34d399" }}
                    >
                      ${totalCost.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                {co2SavingsPct > 0 && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(52, 211, 153, 0.12)",
                      border: "1px solid rgba(52, 211, 153, 0.3)",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      You are saving {co2SavingsPct}% CO2
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      Compared to circling for parking.
                    </Typography>
                  </Paper>
                )}

                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "rgba(255,255,255,0.6)", mb: 1 }}
                  >
                    Payment method
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant={
                        paymentMethod === "wallet" ? "contained" : "outlined"
                      }
                      onClick={() => setPaymentMethod("wallet")}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor:
                          paymentMethod === "wallet"
                            ? "rgba(34, 211, 238, 0.25)"
                            : "transparent",
                        color:
                          paymentMethod === "wallet"
                            ? "#22d3ee"
                            : "rgba(255,255,255,0.7)",
                        borderColor: "rgba(255,255,255,0.2)",
                        "&:hover": {
                          borderColor: "#22d3ee",
                        },
                      }}
                    >
                      Wallet
                    </Button>
                    <Button
                      variant={
                        paymentMethod === "card" ? "contained" : "outlined"
                      }
                      onClick={() => setPaymentMethod("card")}
                      sx={{
                        flex: 1,
                        borderRadius: 2,
                        textTransform: "none",
                        fontWeight: 600,
                        bgcolor:
                          paymentMethod === "card"
                            ? "rgba(34, 211, 238, 0.25)"
                            : "transparent",
                        color:
                          paymentMethod === "card"
                            ? "#22d3ee"
                            : "rgba(255,255,255,0.7)",
                        borderColor: "rgba(255,255,255,0.2)",
                        "&:hover": {
                          borderColor: "#22d3ee",
                        },
                      }}
                    >
                      Card
                    </Button>
                  </Box>
                </Box>

                {!parkingLot.isAvailable && (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight={700}>
                      Join waitlist
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)", mb: 1 }}
                    >
                      Lot is full. Leave your contact and we'll notify you when
                      a spot opens.
                    </Typography>
                    <Box
                      sx={{
                        display: "grid",
                        gap: 1,
                        gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                      }}
                    >
                      <TextField
                        label="Email"
                        size="small"
                        value={waitlistEmail}
                        onChange={(e) => setWaitlistEmail(e.target.value)}
                        sx={{
                          "& .MuiInputBase-root": { color: "white" },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.2)",
                          },
                        }}
                      />
                      <TextField
                        label="Phone"
                        size="small"
                        value={waitlistPhone}
                        onChange={(e) => setWaitlistPhone(e.target.value)}
                        sx={{
                          "& .MuiInputBase-root": { color: "white" },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.2)",
                          },
                        }}
                      />
                    </Box>
                    <Button
                      variant="outlined"
                      sx={{
                        mt: 1.5,
                        borderColor: "rgba(255,255,255,0.2)",
                        color: "common.white",
                      }}
                      onClick={handleJoinWaitlist}
                      disabled={isLoading}
                    >
                      Join waitlist
                    </Button>
                    {waitlistMessage && (
                      <Typography
                        variant="body2"
                        sx={{ color: "#34d399", mt: 0.5 }}
                      >
                        {waitlistMessage}
                      </Typography>
                    )}
                  </Paper>
                )}

                <Button
                  onClick={handleReserve}
                  disabled={isReserveDisabled}
                  variant="contained"
                  fullWidth
                  sx={{
                    mt: 1,
                    py: 1.6,
                    fontWeight: 800,
                    borderRadius: 2,
                    bgcolor: "#22d3ee",
                    color: "#04111d",
                    "&:hover": {
                      bgcolor: "#38e1f6",
                    },
                  }}
                >
                  {isSelectedSpotReserved
                    ? "Spot reserved"
                    : !parkingLot.isAvailable
                    ? "Lot Fully Booked"
                    : "Reserve Now"}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LotDetail;
