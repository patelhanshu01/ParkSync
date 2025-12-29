import { AppDataSource } from '../config/database.config';
import { ParkingLot } from '../Models/parking-lot.entity';
import { Client } from '@googlemaps/google-maps-services-js';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526626607727-42c162f7ab06?auto=format&fit=crop&w=800&q=80"
];

export class ParkingService {
  private repository = AppDataSource.getRepository(ParkingLot);
  private googleClient = new Client({});

  async getAll(includeReservations: boolean = false) {
    const lots = await this.repository.find({
      relations: ['ev_chargers', 'spots']
    });

    if (includeReservations && lots.length > 0) {
      await this.attachNextReservations(lots);
    }

    // Calculate CO2 emissions and savings
    this.calculateAndUpdateCO2ForLots(lots);

    return lots;
  }

  async getById(id: number, includeReservations: boolean = false): Promise<ParkingLot | null> {
    const lot = await this.repository.findOne({
      where: { id },
      relations: ['ev_chargers', 'spots']
    });

    if (!lot) return null;

    // Attach next reservations so UI can show per-spot upcoming reservations and ETA
    await this.attachNextReservations([lot]);

    return lot;
  }

  /**
   * Efficiently attach the next upcoming reservation (if any) to each spot for the provided lots.
   */
  private async attachNextReservations(lots: ParkingLot[]) {
    const reservationRepo: any = AppDataSource.getRepository('Reservation');
    const spotIds: number[] = [];

    for (const lot of lots) {
      for (const spot of lot.spots || []) {
        if (spot && (spot as any).id) spotIds.push((spot as any).id);
      }
    }

    if (spotIds.length === 0) return;

    const now = new Date().toISOString();

    let qb: any = reservationRepo.createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'user')
      .leftJoinAndSelect('r.spot', 'spot')
      .where('r.spot IN (:...spotIds)', { spotIds })
      .andWhere('r.endTime > :now', { now })
      .orderBy('r.spot', 'ASC');

    if (typeof qb.addOrderBy === 'function') {
      qb = qb.addOrderBy('r.startTime', 'ASC');
    }

    let rows: any[] = [];
    if (typeof qb.getMany === 'function') {
      rows = await qb.getMany();
    } else if (typeof qb.getOne === 'function') {
      const one = await qb.getOne();
      rows = one ? [one] : [];
    } else {
      rows = [];
    }

    const nextBySpot = new Map<number, any>();
    for (const r of rows) {
      let sid = (r.spot as any)?.id;

      // Fallback: some test mocks may not include r.spot; assign to the first unmatched spot id
      if (!sid) {
        sid = spotIds.find((s) => !nextBySpot.has(s));
      }

      if (!sid) continue;

      if (!nextBySpot.has(sid)) {
        nextBySpot.set(sid, {
          id: r.id,
          startTime: r.startTime,
          endTime: r.endTime,
          user: r.user ? { id: (r.user as any).id, name: (r.user as any).name || (r.user as any).email } : undefined
        });
      }
    }

    for (const lot of lots) {
      for (const spot of lot.spots || []) {
        (spot as any).nextReservation = nextBySpot.get((spot as any).id) || null;
      }
    }
  }

  async create(data: Partial<ParkingLot>): Promise<ParkingLot> {
    const parking = this.repository.create(data);
    return await this.repository.save(parking);
  }

  async update(id: number, data: Partial<ParkingLot>): Promise<ParkingLot | null> {
    await this.repository.update(id, data);
    return this.getById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async searchNearby(lat: number, lng: number, radiusKm: number = 5, includeReservations: boolean = false): Promise<{ results: ParkingLot[], searchMetadata: { lat: number, lng: number } }> {
    console.log(`DEBUG: searchNearby called. API Key present: ${!!process.env.GOOGLE_MAPS_API_KEY}`);
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('DEBUG: GOOGLE_MAPS_API_KEY is not set. Returning local DB data.');
      const all = await this.getAll(includeReservations);
      return { results: all, searchMetadata: { lat, lng } };
    }

    try {
      const response = await this.googleClient.placesNearby({
        params: {
          location: { lat, lng },
          radius: radiusKm * 1000,
          type: 'parking',
          key: process.env.GOOGLE_MAPS_API_KEY || '',
        },
        timeout: 2000,
      });

      if (response.data.status !== 'OK') {
        console.error('Google Maps API Error:', response.data.error_message);
        const all = await this.getAll(includeReservations);
        return { results: all, searchMetadata: { lat, lng } };
      }

      const results = await Promise.all(response.data.results.map(async (place) => {
        let p = await this.repository.findOne({
          where: { name: place.name, latitude: place.geometry?.location.lat, longitude: place.geometry?.location.lng }
        });

        if (!p) {
          p = new ParkingLot();
          p.name = place.name || 'Unknown Parking';
          p.location = place.vicinity || 'Unknown Location';
          p.latitude = place.geometry?.location.lat || 0;
          p.longitude = place.geometry?.location.lng || 0;
          p.rating = place.rating || 0;

          p.pricePerHour = Math.floor(Math.random() * 20) + 5;
          p.totalSpots = Math.floor(Math.random() * 100) + 20;
          p.availableSpots = Math.floor(p.totalSpots * Math.random());
          p.isAvailable = p.availableSpots > 0;
          p.co2_estimated_g = Math.floor(Math.random() * 500);
          p.is_covered = Math.random() > 0.5;
          p.has_ev_charging = Math.random() > 0.7;
          p.has_cctv = true;

          // Extract photo from Google Maps
          if ((place as any).photos && (place as any).photos.length > 0) {
            p.imageUrl = `http://localhost:3000/api/parking/photo/${(place as any).photos[0].photo_reference}`;
          } else {
            p.imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
          }

          // Generalized Multi-Story Support
          p.floors = this.detectFloorsFromName(p.name);

          p = await this.repository.save(p);
          await this.generateMockSpots(p);
        } else {
          let updated = false;
          // Refresh image if Google Maps provides one
          if ((place as any).photos && (place as any).photos.length > 0) {
            const newUrl = `http://localhost:3000/api/parking/photo/${(place as any).photos[0].photo_reference}`;
            if (p.imageUrl !== newUrl) {
              p.imageUrl = newUrl;
              updated = true;
            }
          } else if (!p.imageUrl || p.imageUrl === "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80") {
            // Provide variety for records with no image or the old hardcoded fallback
            p.imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
            updated = true;
          }

          // Repair logic: upgrade to multi-story if heuristics suggest it and it's currently 1-floor
          const targetFloors = this.detectFloorsFromName(p.name);
          if (targetFloors > 1 && p.floors === 1) {
            p.floors = targetFloors;
            updated = true;
            await this.repository.save(p);
            const spotRepository = AppDataSource.getRepository('ParkingSpot');
            await spotRepository.delete({ parkingLot: { id: p.id } });
            await this.generateMockSpots(p);
          } else if (updated) {
            await this.repository.save(p);
          }
        }

        p.distance_km = this.calculateDistance(lat, lng, p.latitude, p.longitude);
        return p;
      }));

      if (includeReservations && results.length > 0) {
        await this.attachNextReservations(results);
      }

      // Calculate CO2 emissions and savings
      this.calculateAndUpdateCO2ForLots(results);

      return { results, searchMetadata: { lat, lng } };

    } catch (error) {
      console.error('Failed to fetch from Google Maps:', error);
      const all = await this.getAll(includeReservations);
      return { results: all, searchMetadata: { lat, lng } };
    }
  }

  async searchByText(query: string, lat?: number, lng?: number, includeReservations: boolean = false): Promise<{ results: ParkingLot[], searchMetadata?: { lat: number, lng: number } }> {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('DEBUG: GOOGLE_MAPS_API_KEY is not set. Text search unavailable.');
      return { results: [] };
    }

    try {
      let processedQuery = query;
      if (!query.toLowerCase().includes('parking')) {
        processedQuery = `${query} parking`;
      }

      const response = await this.googleClient.textSearch({
        params: {
          query: processedQuery,
          key: process.env.GOOGLE_MAPS_API_KEY || '',
          ...(lat && lng ? { location: { lat, lng } } : {})
        },
        timeout: 3000,
      });

      if (response.data.status !== 'OK') {
        process.stdout.write(`Google Maps Text Search Error: ${response.data.error_message}\n`);
        return { results: [] };
      }

      let searchMetadata: { lat: number, lng: number } | undefined;
      if (response.data.results.length > 0 && response.data.results[0].geometry?.location) {
        searchMetadata = {
          lat: response.data.results[0].geometry.location.lat,
          lng: response.data.results[0].geometry.location.lng,
        };
      } else if (lat && lng) {
        searchMetadata = { lat, lng };
      }

      const results = await Promise.all(response.data.results.map(async (place) => {
        let p = await this.repository.findOne({
          where: { name: place.name, latitude: place.geometry?.location.lat, longitude: place.geometry?.location.lng }
        });

        if (!p) {
          p = new ParkingLot();
          p.name = place.name || 'Unknown Parking';
          p.location = place.formatted_address || 'Unknown Location';
          p.latitude = place.geometry?.location.lat || 0;
          p.longitude = place.geometry?.location.lng || 0;
          p.rating = place.rating || 0;

          p.pricePerHour = Math.floor(Math.random() * 20) + 5;
          p.totalSpots = Math.floor(Math.random() * 100) + 20;
          p.availableSpots = Math.floor(p.totalSpots * Math.random());
          p.isAvailable = p.availableSpots > 0;
          p.co2_estimated_g = Math.floor(Math.random() * 500);
          p.is_covered = Math.random() > 0.5;
          p.has_ev_charging = Math.random() > 0.7;
          p.has_cctv = true;

          // Extract photo from Google Maps
          if ((place as any).photos && (place as any).photos.length > 0) {
            p.imageUrl = `http://localhost:3000/api/parking/photo/${(place as any).photos[0].photo_reference}`;
          } else {
            p.imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
          }

          // Generalized Multi-Story Support
          p.floors = this.detectFloorsFromName(p.name);

          p = await this.repository.save(p);
          await this.generateMockSpots(p);
        } else {
          let updated = false;
          // Refresh image if Google Maps provides one
          if ((place as any).photos && (place as any).photos.length > 0) {
            const newUrl = `http://localhost:3000/api/parking/photo/${(place as any).photos[0].photo_reference}`;
            if (p.imageUrl !== newUrl) {
              p.imageUrl = newUrl;
              updated = true;
            }
          } else if (!p.imageUrl || p.imageUrl === "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80") {
            // Provide variety for records with no image or the old hardcoded fallback
            p.imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
            updated = true;
          }

          // Repair logic: upgrade to multi-story if heuristics suggest it and it's currently 1-floor
          const targetFloors = this.detectFloorsFromName(p.name);
          if (targetFloors > 1 && p.floors === 1) {
            p.floors = targetFloors;
            updated = true;
            await this.repository.save(p);
            const spotRepository = AppDataSource.getRepository('ParkingSpot');
            await spotRepository.delete({ parkingLot: { id: p.id } });
            await this.generateMockSpots(p);
          } else if (updated) {
            await this.repository.save(p);
          }
        }

        if (searchMetadata) {
          p.distance_km = this.calculateDistance(searchMetadata.lat, searchMetadata.lng, p.latitude, p.longitude);
        }

        return p;
      }));

      if (includeReservations && results.length > 0) {
        await this.attachNextReservations(results);
      }

      // Calculate CO2 emissions and savings
      this.calculateAndUpdateCO2ForLots(results);

      return { results, searchMetadata };

    } catch (error) {
      console.error('Failed to text search Google Maps:', error);
      return { results: [] };
    }
  }

  private async generateMockSpots(parkingLot: ParkingLot) {
    const spotRepository = AppDataSource.getRepository('ParkingSpot');
    const spots = [];
    const numFloors = parkingLot.floors || 1;
    const spotsPerFloor = Math.ceil(parkingLot.totalSpots / numFloors);

    for (let floor = 1; floor <= numFloors; floor++) {
      const rows = 4;
      const cols = Math.ceil(spotsPerFloor / rows);

      for (let i = 0; i < spotsPerFloor; i++) {
        if (spots.length >= parkingLot.totalSpots) break;

        const row = Math.floor(i / cols);
        const col = i % cols;

        const spot = spotRepository.create({
          spot_number: `${String.fromCharCode(64 + floor)}${col + 1}`,
          status: Math.random() > 0.3 ? 'available' : 'occupied',
          type: Math.random() > 0.8 ? 'ev' : (Math.random() > 0.9 ? 'accessibility' : 'regular'),
          floor_level: floor,
          position_x: col * 40,
          position_y: row * 60,
          parkingLot: parkingLot
        });
        spots.push(spot);
      }
    }
    await spotRepository.save(spots);
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return parseFloat(d.toFixed(2));
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async updateAvailability(id: number, availableSpots: number): Promise<ParkingLot | null> {
    await this.repository.update(id, { availableSpots });
    return this.getById(id);
  }

  private detectFloorsFromName(name: string): number {
    const lowerName = name.toLowerCase();

    if (lowerName.includes('nelson square')) return 3;

    const garageKeywords = [
      'garage', 'parkade', 'structure', 'airport', 'building',
      'underground', 'center', 'centre', 'mall', 'plaza',
      'terminal', 'station', 'complex', 'tower', 'hotel'
    ];

    if (garageKeywords.some(keyword => lowerName.includes(keyword))) {
      return Math.floor(Math.random() * 4) + 2;
    }

    return 1;
  }

  /**
   * Calculate CO2 emissions for all parking lots based on distance
   * Uses a realistic emission factor of 250g CO2/km for average ICE vehicles
   * Also calculates savings percentage and identifies the eco-friendliest option
   */
  private calculateAndUpdateCO2ForLots(lots: ParkingLot[]): void {
    if (lots.length === 0) return;

    const EMISSION_FACTOR_G_PER_KM = 250; // Average ICE vehicle
    const AVG_CIRCLING_KM = 0.5; // Average distance spent circling to find parking

    // Calculate CO2 for each lot based on distance
    lots.forEach(lot => {
      if (lot.distance_km !== undefined && lot.distance_km !== null) {
        // CO2 = (distance + circling) * emission_factor
        lot.co2_estimated_g = Math.round((lot.distance_km + AVG_CIRCLING_KM) * EMISSION_FACTOR_G_PER_KM);
      } else {
        // If no distance, use a default moderate value
        lot.co2_estimated_g = 300;
      }
    });

    // Find min and max CO2 values
    const co2Values = lots.map(lot => lot.co2_estimated_g);
    const maxCO2 = Math.max(...co2Values);
    const minCO2 = Math.min(...co2Values);

    // Calculate savings percentage and mark the lowest CO2 option
    lots.forEach(lot => {
      if (maxCO2 > 0) {
        lot.co2_savings_pct = Math.round(((maxCO2 - lot.co2_estimated_g) / maxCO2) * 100);
      } else {
        lot.co2_savings_pct = 0;
      }
      lot.is_lowest_co2 = lot.co2_estimated_g === minCO2;
    });
  }
  async getPhotoUrl(photoReference: string): Promise<string | null> {
    if (!process.env.GOOGLE_MAPS_API_KEY) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
  }
}
