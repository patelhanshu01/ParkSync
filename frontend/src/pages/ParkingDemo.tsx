import React, { useState } from 'react';
import ParkingAR from '../Components/ParkingAR';
import Parking3D from '../Components/Parking3D';
import { Box, Typography, Button, Card, CardContent, Stack } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';
import { createReservation } from '../api/reservationApi';

const ParkingDemo: React.FC = () => {
  const [arUrl, setArUrl] = useState<string | undefined>(undefined);
  const [selectedSpot, setSelectedSpot] = useState<any | null>(null);
  const [spots, setSpots] = useState<any[] | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!spots) {
      // Generate demo spots matching 3x6 grid used by the 3D view (ids start at 1000)
      const demo: any[] = [];
      let idCounter = 1000;
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 6; c++) {
          demo.push({ id: idCounter++, spot_number: `${String.fromCharCode(65 + r)}${c + 1}`, status: 'available' });
        }
      }
      setSpots(demo);
    }
  }, [spots]);

  const handleReserve = async () => {
    if (!selectedSpot) return;
    setLoading(true);
    try {
      const now = new Date();
      const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
      const reservationData = {
        startTime: now.toISOString(),
        endTime: inOneHour.toISOString(),
        parkingLot: 1, // demo lot id — replace with real lot id if available
        spot: selectedSpot.id
      };
      const res = await createReservation(reservationData);
      alert(`Reserved spot ${selectedSpot.spot_number} (Reservation #${res.id})`);

      // Update local spot state to 'reserved'
      setSpots((prev) => {
        const copy = (prev || []).slice();
        const idx = copy.findIndex((s) => s.id === selectedSpot.id);
        if (idx >= 0) {
          copy[idx] = { ...copy[idx], status: 'reserved' };
          // also update selectedSpot reference
          setSelectedSpot(copy[idx]);
        }
        return copy;
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Failed to reserve');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, display: 'grid', gap: 2 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Typography variant="overline" sx={{ letterSpacing: 2, color: '#22d3ee' }}>Immersive Parking</Typography>
        <Typography variant="h4" sx={{ color: '#e2e8f0' }}>3D lot + AR preview</Typography>
        <Typography variant="body2" color="text.secondary">
          Glide through the animated deck, pick a glowing bay, and drop the same layout into your space with AR.
        </Typography>
      </Box>

      <Swiper
        spaceBetween={24}
        slidesPerView={1}
        effect="coverflow"
        centeredSlides
        pagination={{ clickable: true }}
        modules={[EffectCoverflow, Pagination]}
        coverflowEffect={{
          rotate: 8,
          stretch: 0,
          depth: 120,
          modifier: 1,
          slideShadows: false
        }}
      >
        <SwiperSlide>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
            <Box sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', background: 'linear-gradient(135deg,#07101d,#060910)' }}>
              <Parking3D
                initialSpots={spots}
                selectedSpotId={selectedSpot?.id ?? null}
                onSpotSelect={(s) => setSelectedSpot(s)}
                onExport={(url) => { setArUrl(url); alert('GLB exported and ready for AR. Switch to the AR tab.'); }}
              />
            </Box>

            <Box sx={{ width: { xs: '100%', lg: 320 } }}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ display: 'grid', gap: 1.5 }}>
                  <Typography variant="h6">Selected spot</Typography>
                  {selectedSpot ? (
                    <>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography>Spot: <b>{selectedSpot.spot_number}</b></Typography>
                        <Typography>Status: <b>{selectedSpot.status}</b></Typography>
                      </Stack>
                      <Button variant="contained" sx={{ mt: 1 }} onClick={handleReserve} disabled={loading || selectedSpot.status !== 'available'}>
                        {loading ? 'Reserving…' : 'Reserve spot'}
                      </Button>
                    </>
                  ) : (
                    <Typography color="text.secondary">Click a parking spot in the 3D view to select it.</Typography>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>
        </SwiperSlide>

        <SwiperSlide>
          <Box sx={{ borderRadius: 2, overflow: 'hidden', background: 'linear-gradient(135deg,#07101d,#060910)', display: 'grid', gap: 2, p: { xs: 1, md: 2 } }}>
            <ParkingAR glbUrl={arUrl} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ px: 1 }}>
              <Button variant="contained" onClick={() => alert('On mobile, tap the AR button in the viewer to place the model in AR')}>AR Tips</Button>
              <Button variant="outlined" onClick={() => alert('Export the 3D scene first, then tap the AR icon to anchor it to the ground plane.')}>How it works</Button>
            </Stack>
          </Box>
        </SwiperSlide>
      </Swiper>
    </Box>
  );
};

export default ParkingDemo;
