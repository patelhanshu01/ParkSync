import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import HistoryIcon from "@mui/icons-material/History";
import RedeemIcon from "@mui/icons-material/Redeem";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import BoltIcon from "@mui/icons-material/Bolt";
import { getMyBookings, Reservation } from "../api/reservationApi";
import { addFunds, getWalletDetails, WalletDetails } from "../api/walletApi";
import { useAuth } from "../context/AuthContext";

const PAGE_BG = "linear-gradient(180deg, #0b1220 0%, #0a101c 100%)";
const PANEL_BG = "rgba(16, 24, 40, 0.92)";
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";
const ACCENT = "#22d3ee";
const SUCCESS = "#34d399";

const BASELINE_DISTANCE_KM = 5;
const EMISSION_FACTOR_G_PER_KM = 250;
const CO2_POINTS_DIVISOR = 10;
const DISTANCE_POINTS_PER_KM = 15;
const OFF_PEAK_BONUS_POINTS = 50;

const MIN_CONVERT_POINTS = 500;
const POINTS_PER_CREDIT = 100;
const MONTHLY_CONVERSION_LIMIT = 2000;
const MIN_TRIPS_FOR_CONVERSION = 3;

const WAYS_TO_EARN = [
  { label: "Reserve during off-peak hours", points: 50 },
  { label: "Choose a green-certified lot", points: 80 },
  { label: "Walk instead of circling", points: 30 },
];

const REWARDS_CATALOG = [
  { id: "free-hour", title: "Free 1-hour parking", points: 450, tag: "Popular" },
  { id: "ev-credit", title: "EV charging credit", points: 600, tag: "Eco" },
  { id: "priority-upgrade", title: "Priority spot upgrade", points: 800, tag: "New" },
];

const TIERS = [
  { name: "Bronze", min: 0, color: "#f59e0b" },
  { name: "Silver", min: 400, color: "#94a3b8" },
  { name: "Gold", min: 900, color: "#facc15" },
  { name: "Platinum", min: 1600, color: "#60a5fa" },
];

type RewardRedemption = {
  id: string;
  kind: "wallet" | "reward";
  points: number;
  credits?: number;
  title?: string;
  date: string;
};

type ActivityItem = {
  title: string;
  dateLabel: string;
  points: number;
};

const parseNumber = (value: unknown): number | null => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const isOffPeak = (dateString: string) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;
  const hour = date.getHours();
  return hour < 7 || hour >= 19;
};

const buildRewardsKey = (userId?: number) =>
  `parksync_rewards_redemptions_${userId ?? "guest"}`;

const readRedemptions = (key: string): RewardRedemption[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && typeof item === "object");
  } catch {
    return [];
  }
};

const writeRedemptions = (key: string, records: RewardRedemption[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(records));
};

const calculateReservationPoints = (reservation: Reservation) => {
  const distanceKm = parseNumber(
    reservation.parkingLot?.distance_km ?? reservation.listing?.distance_km
  );
  const co2Estimated = parseNumber(reservation.co2_estimated_g);
  const baselineCo2G = BASELINE_DISTANCE_KM * EMISSION_FACTOR_G_PER_KM;
  const derivedCo2G =
    co2Estimated ??
    (distanceKm !== null ? distanceKm * EMISSION_FACTOR_G_PER_KM : baselineCo2G);

  const distanceSavingsKm =
    distanceKm !== null ? Math.max(0, BASELINE_DISTANCE_KM - distanceKm) : 0;
  const co2SavingsG = Math.max(0, baselineCo2G - derivedCo2G);
  const offPeakBonus = isOffPeak(reservation.startTime)
    ? OFF_PEAK_BONUS_POINTS
    : 0;

  const points = Math.max(
    0,
    Math.round(
      co2SavingsG / CO2_POINTS_DIVISOR +
        distanceSavingsKm * DISTANCE_POINTS_PER_KM +
        offPeakBonus
    )
  );

  return {
    points,
    co2SavingsG,
    distanceKm,
    offPeakBonus,
  };
};

const Rewards: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Reservation[]>([]);
  const [wallet, setWallet] = useState<WalletDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [convertPoints, setConvertPoints] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let active = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [reservations, walletDetails] = await Promise.all([
          getMyBookings(),
          getWalletDetails(),
        ]);
        if (!active) return;
        setBookings(reservations);
        setWallet(walletDetails);
      } catch (err) {
        if (active) {
          setError("Failed to load rewards data. Please try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    const key = buildRewardsKey(user?.id);
    setRedemptions(readRedemptions(key));
  }, [user?.id]);

  useEffect(() => {
    const key = buildRewardsKey(user?.id);
    writeRedemptions(key, redemptions);
  }, [redemptions, user?.id]);

  const summary = useMemo(() => {
    let totalPoints = 0;
    let tripCount = 0;
    let totalSavingsG = 0;
    const activity: ActivityItem[] = [];

    for (let i = 0; i < bookings.length; i++) {
      const reservation = bookings[i];
      const { points, co2SavingsG, offPeakBonus } =
        calculateReservationPoints(reservation);
      totalPoints += points;
      totalSavingsG += co2SavingsG;
      tripCount += 1;

      if (activity.length < 3) {
        const dateLabel = new Date(reservation.startTime).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        );
        const title =
          offPeakBonus > 0
            ? "Off-peak booking"
            : co2SavingsG > 0
            ? "Eco-friendly booking"
            : "Smart booking";

        activity.push({
          title,
          dateLabel,
          points,
        });
      }
    }

    return {
      totalPoints,
      tripCount,
      totalSavingsKg: totalSavingsG / 1000,
      activity,
    };
  }, [bookings]);

  const redeemedPoints = useMemo(() => {
    return redemptions.reduce((sum, item) => sum + item.points, 0);
  }, [redemptions]);

  const walletPointsThisMonth = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();
    return redemptions.reduce((sum, item) => {
      if (item.kind !== "wallet") return sum;
      const date = new Date(item.date);
      if (date.getMonth() === month && date.getFullYear() === year) {
        return sum + item.points;
      }
      return sum;
    }, 0);
  }, [redemptions]);

  const availablePoints = Math.max(0, summary.totalPoints - redeemedPoints);
  const monthlyRemaining = Math.max(
    0,
    MONTHLY_CONVERSION_LIMIT - walletPointsThisMonth
  );

  const tierIndex = useMemo(() => {
    let index = 0;
    for (let i = TIERS.length - 1; i >= 0; i--) {
      if (availablePoints >= TIERS[i].min) {
        index = i;
        break;
      }
    }
    return index;
  }, [availablePoints]);

  const tier = TIERS[tierIndex];
  const nextTier = TIERS[tierIndex + 1];
  const tierProgress = nextTier
    ? Math.min(
        100,
        ((availablePoints - tier.min) / (nextTier.min - tier.min)) * 100
      )
    : 100;

  useEffect(() => {
    if (!convertPoints && availablePoints >= MIN_CONVERT_POINTS) {
      const maxConvertible = Math.min(availablePoints, monthlyRemaining);
      const suggested =
        Math.floor(maxConvertible / POINTS_PER_CREDIT) * POINTS_PER_CREDIT;
      if (suggested > 0) {
        setConvertPoints(String(suggested));
      }
    }
  }, [availablePoints, convertPoints, monthlyRemaining]);

  const parsedConvertPoints = parseNumber(convertPoints) ?? 0;
  const convertCredits = Math.floor(parsedConvertPoints / POINTS_PER_CREDIT);
  const conversionEligible =
    summary.tripCount >= MIN_TRIPS_FOR_CONVERSION &&
    availablePoints >= MIN_CONVERT_POINTS &&
    monthlyRemaining >= POINTS_PER_CREDIT;

  const conversionError = (() => {
    if (!conversionEligible) return null;
    if (parsedConvertPoints < MIN_CONVERT_POINTS) {
      return `Minimum ${MIN_CONVERT_POINTS} points to convert.`;
    }
    if (parsedConvertPoints > availablePoints) {
      return "Not enough points available.";
    }
    if (parsedConvertPoints > monthlyRemaining) {
      return "Monthly conversion limit reached.";
    }
    if (parsedConvertPoints % POINTS_PER_CREDIT !== 0) {
      return `Use increments of ${POINTS_PER_CREDIT} points.`;
    }
    return null;
  })();

  const handleConvert = async () => {
    setActionMessage(null);
    if (!conversionEligible) return;
    if (conversionError) {
      setActionMessage(conversionError);
      return;
    }
    if (convertCredits <= 0) {
      setActionMessage("Enter a valid points amount to convert.");
      return;
    }

    setProcessing(true);
    try {
      await addFunds(convertCredits);
      const updatedWallet = await getWalletDetails();
      setWallet(updatedWallet);
      const nextRecord: RewardRedemption = {
        id: `wallet-${Date.now()}`,
        kind: "wallet",
        points: parsedConvertPoints,
        credits: convertCredits,
        date: new Date().toISOString(),
      };
      setRedemptions((prev) => [nextRecord, ...prev]);
      setConvertPoints("");
      setActionMessage(
        `Converted ${parsedConvertPoints} points into $${convertCredits} wallet credit.`
      );
    } catch (err) {
      setActionMessage("Conversion failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  const handleRewardRedeem = (rewardId: string) => {
    setActionMessage(null);
    const reward = REWARDS_CATALOG.find((item) => item.id === rewardId);
    if (!reward) return;
    if (reward.points > availablePoints) {
      setActionMessage("Not enough points to redeem this reward.");
      return;
    }
    const nextRecord: RewardRedemption = {
      id: `reward-${reward.id}-${Date.now()}`,
      kind: "reward",
      points: reward.points,
      title: reward.title,
      date: new Date().toISOString(),
    };
    setRedemptions((prev) => [nextRecord, ...prev]);
    setActionMessage(`Redeemed ${reward.title}.`);
  };

  if (!user) {
    return (
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: 6 }}>
        <Container maxWidth="sm">
          <Paper
            sx={{
              p: 4,
              borderRadius: 3,
              textAlign: "center",
              border: PANEL_BORDER,
            }}
          >
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>
              Sign in to view rewards
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Your eco points are tied to your reservations.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/login")}>
              Log in
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
        background: PAGE_BG,
        py: 5,
        color: "common.white",
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Eco Rewards
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
              Earn points for smart bookings and convert them into wallet
              credits.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{
              borderColor: "rgba(255,255,255,0.2)",
              color: "common.white",
              textTransform: "none",
            }}
          >
            Back to Map
          </Button>
        </Box>

        {loading ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 8,
            }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {actionMessage && (
              <Alert severity="info" sx={{ mb: 3 }}>
                {actionMessage}
              </Alert>
            )}

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 2fr) minmax(0, 1fr)",
                },
                gap: 3,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: PANEL_BG,
                  border: PANEL_BORDER,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <EmojiEventsIcon sx={{ color: "#facc15" }} />
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Points Balance
                    </Typography>
                  </Box>
                  <Chip
                    label={`Level ${tierIndex + 1}`}
                    sx={{
                      bgcolor: "rgba(250, 204, 21, 0.2)",
                      color: "#facc15",
                      fontWeight: 700,
                    }}
                  />
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                  {availablePoints} pts
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.6)" }}
                >
                  {tier?.name} Tier
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    {nextTier
                      ? `Progress to ${nextTier.name}`
                      : "Top tier reached"}
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption" sx={{ color: tier.color }}>
                      {availablePoints} pts
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      {nextTier ? `${nextTier.min} pts` : "Max"}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={tierProgress}
                    sx={{
                      mt: 1,
                      height: 10,
                      borderRadius: 999,
                      bgcolor: "rgba(255,255,255,0.08)",
                      "& .MuiLinearProgress-bar": {
                        bgcolor: ACCENT,
                      },
                    }}
                  />
                </Box>
                <Typography
                  variant="body2"
                  sx={{ color: "rgba(255,255,255,0.65)", mt: 2 }}
                >
                  Keep booking eco-friendly lots to reach the next tier faster.
                </Typography>
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "rgba(7, 12, 22, 0.6)",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 1,
                    }}
                  >
                    <AccountBalanceWalletIcon sx={{ color: SUCCESS }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Convert Points to Wallet Credits
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{ color: "rgba(255,255,255,0.6)", mb: 2 }}
                  >
                    {POINTS_PER_CREDIT} points = $1 credit. Minimum{" "}
                    {MIN_CONVERT_POINTS} points. Monthly limit{" "}
                    {MONTHLY_CONVERSION_LIMIT} points. Requires at least{" "}
                    {MIN_TRIPS_FOR_CONVERSION} trips.
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      value={convertPoints}
                      onChange={(event) => setConvertPoints(event.target.value)}
                      placeholder="Points to convert"
                      size="small"
                      sx={{
                        flex: 1,
                        "& .MuiInputBase-root": {
                          color: "common.white",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "rgba(255,255,255,0.2)",
                        },
                      }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<RedeemIcon />}
                      disabled={
                        processing || !conversionEligible || !!conversionError
                      }
                      onClick={handleConvert}
                      sx={{
                        borderRadius: 999,
                        bgcolor: ACCENT,
                        color: "#04111d",
                        fontWeight: 700,
                        textTransform: "none",
                        "&:hover": {
                          bgcolor: "#38e1f6",
                        },
                      }}
                    >
                      {processing
                        ? "Converting..."
                        : `Convert to $${convertCredits}`}
                    </Button>
                  </Stack>
                  {conversionError && (
                    <Typography
                      variant="caption"
                      sx={{ color: "#f87171", mt: 1, display: "block" }}
                    >
                      {conversionError}
                    </Typography>
                  )}
                  {wallet && (
                    <Typography
                      variant="caption"
                      sx={{ color: "rgba(255,255,255,0.6)", mt: 1 }}
                    >
                      Wallet balance: ${wallet.balance.toFixed(2)}
                    </Typography>
                  )}
                </Box>
              </Paper>

              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: PANEL_BG,
                  border: PANEL_BORDER,
                  height: "100%",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <EnergySavingsLeafIcon sx={{ color: SUCCESS }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Ways to Earn
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {WAYS_TO_EARN.map((item) => (
                    <Box
                      key={item.label}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="body2">{item.label}</Typography>
                      <Chip
                        label={`+${item.points} pts`}
                        size="small"
                        sx={{
                          bgcolor: "rgba(52, 211, 153, 0.18)",
                          color: SUCCESS,
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                  ))}
                </Stack>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    mt: 3,
                    borderRadius: 999,
                    borderColor: "rgba(255,255,255,0.2)",
                    color: "common.white",
                    textTransform: "none",
                    "&:hover": {
                      borderColor: ACCENT,
                      color: ACCENT,
                    },
                  }}
                >
                  View All Challenges
                </Button>
              </Paper>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 2fr) minmax(0, 1fr)",
                },
                gap: 3,
                mt: 3,
              }}
            >
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: PANEL_BG,
                  border: PANEL_BORDER,
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <CardGiftcardIcon sx={{ color: ACCENT }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Available Rewards
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {REWARDS_CATALOG.map((reward) => (
                    <Box
                      key={reward.id}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: "1px solid rgba(255,255,255,0.06)",
                        bgcolor: "rgba(8, 14, 24, 0.8)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          {reward.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "rgba(255,255,255,0.6)" }}
                        >
                          {reward.points} points
                        </Typography>
                        {reward.tag && (
                          <Chip
                            label={reward.tag}
                            size="small"
                            sx={{
                              ml: 1,
                              bgcolor: "rgba(255,255,255,0.12)",
                              color: "common.white",
                            }}
                          />
                        )}
                      </Box>
                      <Button
                        variant="contained"
                        onClick={() => handleRewardRedeem(reward.id)}
                        disabled={reward.points > availablePoints}
                        sx={{
                          borderRadius: 999,
                          bgcolor: ACCENT,
                          color: "#04111d",
                          textTransform: "none",
                          fontWeight: 700,
                          "&:hover": {
                            bgcolor: "#38e1f6",
                          },
                        }}
                      >
                        Redeem
                      </Button>
                    </Box>
                  ))}
                </Stack>
              </Paper>

              <Paper
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: PANEL_BG,
                  border: PANEL_BORDER,
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <HistoryIcon sx={{ color: ACCENT }} />
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Recent Activity
                  </Typography>
                </Box>
                <Stack spacing={2}>
                  {summary.activity.length === 0 ? (
                    <Typography
                      variant="body2"
                      sx={{ color: "rgba(255,255,255,0.6)" }}
                    >
                      No reward activity yet.
                    </Typography>
                  ) : (
                    summary.activity.map((item) => (
                      <Box
                        key={`${item.title}-${item.dateLabel}`}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <Box>
                          <Typography variant="subtitle2">
                            {item.title}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "rgba(255,255,255,0.6)" }}
                          >
                            {item.dateLabel}
                          </Typography>
                        </Box>
                        <Chip
                          label={`+${item.points} pts`}
                          size="small"
                          sx={{
                            bgcolor: "rgba(34, 211, 238, 0.15)",
                            color: ACCENT,
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                    ))
                  )}
                </Stack>

                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid rgba(255,255,255,0.06)",
                    bgcolor: "rgba(8, 14, 24, 0.7)",
                  }}
                >
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <BoltIcon sx={{ color: SUCCESS }} />
                    <Typography variant="subtitle2">
                      Total CO2 saved
                    </Typography>
                  </Box>
                  <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                    {summary.totalSavingsKg.toFixed(1)} kg
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: "rgba(255,255,255,0.6)" }}
                  >
                    Based on closer parking choices
                  </Typography>
                </Box>
              </Paper>
            </Box>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Rewards;
