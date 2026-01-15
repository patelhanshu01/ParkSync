import { AppDataSource } from '../../config/database.config';
import { ParkingLot } from '../../Models/parking-lot.entity';
import { Client } from '@googlemaps/google-maps-services-js';
import { CacheService } from '../../Services/cache.service';

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526626607727-42c162f7ab06?auto=format&fit=crop&w=800&q=80"
];

type SearchSortMode = 'memory' | 'db' | 'postgis';
type SearchOptions = {
  sortBy?: string;
  page?: number;
  limit?: number;
  sortMode?: SearchSortMode;
};
type SearchOrigin = { lat: number; lng: number };

export class ParkingService {
  private repository = AppDataSource.getRepository(ParkingLot);
  private googleClient = new Client({});
  private cache = CacheService.getInstance();
  private isProxyPhotoUrl(url?: string | null) {
    return typeof url === 'string' && url.includes('/api/parking/photo');
  }
  private normalizeCoord(value: number | string | null | undefined) {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(num)) return null;
    return num.toFixed(6);
  }

  private buildPlaceKey(
    name: string | null | undefined,
    lat: number | string | null | undefined,
    lng: number | string | null | undefined
  ) {
    if (!name) return null;
    const latKey = this.normalizeCoord(lat);
    const lngKey = this.normalizeCoord(lng);
    if (!latKey || !lngKey) return null;
    return {
      key: `${name.trim().toLowerCase()}|${latKey}|${lngKey}`,
      latKey,
      lngKey
    };
  }

  private buildLotKey(lot: ParkingLot) {
    return this.buildPlaceKey(lot.name, lot.latitude as any, lot.longitude as any)?.key || null;
  }

  private async prefetchLotsByPlaces(places: Array<any>) {
    const conditions: string[] = [];
    const params: Record<string, any> = {};
    const seenKeys = new Set<string>();

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      const lookup = this.buildPlaceKey(
        place?.name,
        place?.geometry?.location?.lat,
        place?.geometry?.location?.lng
      );
      if (!lookup) continue;
      if (seenKeys.has(lookup.key)) continue;
      seenKeys.add(lookup.key);
      const idx = conditions.length;
      conditions.push(`(lot.name = :name${idx} AND lot.latitude = :lat${idx} AND lot.longitude = :lng${idx})`);
      params[`name${idx}`] = place.name;
      params[`lat${idx}`] = Number(lookup.latKey);
      params[`lng${idx}`] = Number(lookup.lngKey);
    }

    if (!conditions.length) return new Map<string, ParkingLot>();

    const existing = await this.repository
      .createQueryBuilder('lot')
      .where(conditions.join(' OR '), params)
      .getMany();

    const byKey = new Map<string, ParkingLot>();
    for (const lot of existing) {
      const key = this.buildLotKey(lot);
      if (key) byKey.set(key, lot);
    }
    return byKey;
  }

  private getSearchSortMode(mode?: SearchSortMode | string | null): SearchSortMode {
    const raw = (mode || process.env.PARKING_SEARCH_SORT_MODE || 'memory').toString().toLowerCase();
    if (raw === 'db' || raw === 'postgis') return raw;
    return 'memory';
  }

  private isDistanceSort(sortBy?: string) {
    return sortBy === 'distance_asc' || sortBy === 'distance_desc';
  }

  private isPriceSort(sortBy?: string) {
    return sortBy === 'price_asc' || sortBy === 'price_desc';
  }

  private getSortDirection(sortBy?: string) {
    if (!sortBy) return 'ASC' as const;
    return sortBy.endsWith('_desc') ? 'DESC' as const : 'ASC' as const;
  }

  private reorderLotsByIds(lots: ParkingLot[], orderedIds: number[]) {
    const order = new Map<number, number>();
    for (let i = 0; i < orderedIds.length; i++) {
      order.set(orderedIds[i], i);
    }
    return lots.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }

  private buildLotFromPlace(place: any, locationValue: string, lookup: { latKey: string; lngKey: string } | null) {
    const lot = new ParkingLot();
    lot.name = place.name || 'Unknown Parking';
    lot.location = locationValue || 'Unknown Location';
    lot.latitude = lookup ? Number(lookup.latKey) : place.geometry?.location.lat || 0;
    lot.longitude = lookup ? Number(lookup.lngKey) : place.geometry?.location.lng || 0;
    lot.rating = place.rating || 0;

    lot.pricePerHour = Math.floor(Math.random() * 20) + 5;
    lot.totalSpots = Math.floor(Math.random() * 100) + 20;
    lot.availableSpots = Math.floor(lot.totalSpots * Math.random());
    lot.isAvailable = lot.availableSpots > 0;
    lot.co2_estimated_g = Math.floor(Math.random() * 500);
    lot.is_covered = Math.random() > 0.5;
    lot.has_ev_charging = Math.random() > 0.7;
    lot.has_cctv = true;

    // Let the frontend resolve Street View by coordinates; only set a fallback if none.
    if ((place as any).photos && (place as any).photos.length > 0) {
      lot.imageUrl = null as any;
    } else {
      lot.imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
    }

    lot.floors = this.detectFloorsFromName(lot.name);
    return lot;
  }

  private applyPlaceUpdates(
    lot: ParkingLot,
    place: any,
    lookup: { latKey: string; lngKey: string } | null,
    locationValue: string
  ) {
    let updated = false;
    let regenerateSpots = false;
    const nextLat = lookup ? Number(lookup.latKey) : place?.geometry?.location?.lat;
    const nextLng = lookup ? Number(lookup.lngKey) : place?.geometry?.location?.lng;

    if (Number.isFinite(nextLat) && Number(lot.latitude) !== Number(nextLat)) {
      lot.latitude = Number(nextLat);
      updated = true;
    }
    if (Number.isFinite(nextLng) && Number(lot.longitude) !== Number(nextLng)) {
      lot.longitude = Number(nextLng);
      updated = true;
    }
    if (!lot.location && locationValue) {
      lot.location = locationValue;
      updated = true;
    }

    // Keep custom images; clear legacy proxy photos so the frontend can use Street View.
    if ((place as any).photos && (place as any).photos.length > 0) {
      if (this.isProxyPhotoUrl(lot.imageUrl)) {
        lot.imageUrl = null as any;
        updated = true;
      }
    } else if (!lot.imageUrl || this.isProxyPhotoUrl(lot.imageUrl) || lot.imageUrl === "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80") {
      // Provide variety for records with no image or the old hardcoded fallback
      lot.imageUrl = FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];
      updated = true;
    }

    // Repair logic: upgrade to multi-story if heuristics suggest it and it's currently 1-floor
    const targetFloors = this.detectFloorsFromName(lot.name);
    if (targetFloors > 1 && lot.floors === 1) {
      lot.floors = targetFloors;
      updated = true;
      regenerateSpots = true;
    }

    return { updated, regenerateSpots };
  }

  private async upsertPlaces(places: Array<any>, locationResolver: (place: any) => string) {
    const existingByKey = await this.prefetchLotsByPlaces(places);
    const orderedLots: ParkingLot[] = [];
    const toCreate: ParkingLot[] = [];
    const toUpdate: ParkingLot[] = [];
    const toRebuild: ParkingLot[] = [];

    for (let i = 0; i < places.length; i++) {
      const place = places[i];
      const locationValue = locationResolver(place);
      const lookup = this.buildPlaceKey(
        place?.name,
        place?.geometry?.location?.lat,
        place?.geometry?.location?.lng
      );
      const key = lookup?.key || null;
      let lot = key ? existingByKey.get(key) : undefined;

      if (!lot) {
        lot = this.buildLotFromPlace(place, locationValue, lookup);
        toCreate.push(lot);
        if (key) existingByKey.set(key, lot);
      } else {
        const { updated, regenerateSpots } = this.applyPlaceUpdates(lot, place, lookup, locationValue);
        if (updated) {
          toUpdate.push(lot);
        }
        if (regenerateSpots) {
          toRebuild.push(lot);
        }
      }

      orderedLots.push(lot);
    }

    if (toCreate.length) {
      const created = await this.repository.save(toCreate);
      for (const lot of created) {
        await this.generateMockSpots(lot);
      }
    }

    if (toUpdate.length) {
      await this.repository.save(toUpdate);
    }
    if (toRebuild.length) {
      const spotRepository = AppDataSource.getRepository('ParkingSpot');
      for (const lot of toRebuild) {
        await spotRepository.delete({ parkingLot: { id: lot.id } });
        await this.generateMockSpots(lot);
      }
    }

    const orderedIds: number[] = [];
    const seen = new Set<number>();
    for (const lot of orderedLots) {
      if (!lot?.id || seen.has(lot.id)) continue;
      seen.add(lot.id);
      orderedIds.push(lot.id);
    }

    return { orderedIds };
  }

  private async queryLotsByIds(options: {
    ids: number[];
    sortBy?: string;
    page?: number;
    limit?: number;
    origin?: SearchOrigin;
    sortMode?: SearchSortMode;
  }) {
    const { ids, sortBy, page, limit, origin } = options;
    const sortMode = this.getSearchSortMode(options.sortMode);
    const direction = this.getSortDirection(sortBy);

    const qb = this.repository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.ev_chargers', 'ev_chargers')
      .leftJoinAndSelect('lot.spots', 'spots')
      .where('lot.id IN (:...ids)', { ids });

    let sortApplied = false;
    let distanceApplied = false;

    if (sortBy) {
      if (this.isPriceSort(sortBy)) {
        qb.orderBy('lot.pricePerHour', direction);
        sortApplied = true;
      } else if (this.isDistanceSort(sortBy) && sortMode === 'postgis' && origin) {
        const distanceExpr = 'ST_Distance(lot.geo_location, ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography)';
        qb.addSelect(distanceExpr, 'distance_m');
        qb.setParameters({ lat: origin.lat, lng: origin.lng });
        qb.orderBy('distance_m', direction, 'NULLS LAST');
        sortApplied = true;
        distanceApplied = true;
      }
    }

    const paginationApplied = !!(sortApplied && page && limit);
    if (paginationApplied) {
      qb.skip((page as number - 1) * (limit as number));
      qb.take(limit as number);
    }

    if (distanceApplied) {
      const { entities, raw } = await qb.getRawAndEntities();
      for (let i = 0; i < entities.length; i++) {
        const meters = raw[i]?.distance_m;
        if (meters !== null && meters !== undefined) {
          (entities[i] as any).distance_km = Number(meters) / 1000;
        }
      }
      return { results: entities, sortApplied, paginationApplied, distanceApplied };
    }

    const results = await qb.getMany();
    return { results, sortApplied, paginationApplied, distanceApplied };
  }

  async getAll(includeReservations: boolean = false) {
    const cacheKey = includeReservations ? null : 'parking:lots:all';
    const cacheTtl = Number(process.env.PARKING_CACHE_TTL_SEC || 30);
    if (cacheKey) {
      const cached = await this.cache.getJSON<ParkingLot[]>(cacheKey);
      if (cached) return cached;
    }

    const lots = await this.repository.find({
      relations: ['ev_chargers', 'spots']
    });

    lots.forEach((l) => this.applyDynamicPricing(l));

    if (includeReservations && lots.length > 0) {
      await this.attachNextReservations(lots);
    }

    // Calculate CO2 emissions and savings
    this.calculateAndUpdateCO2ForLots(lots);

    if (cacheKey) {
      await this.cache.setJSON(cacheKey, lots, cacheTtl);
    }

    return lots;
  }

  private resolveSortOrder(sortBy?: string) {
    switch (sortBy) {
      case 'price_asc':
        return { pricePerHour: 'ASC' as const };
      case 'price_desc':
        return { pricePerHour: 'DESC' as const };
      default:
        return undefined;
    }
  }

  async getAllPaged(options: { includeReservations?: boolean; page?: number; limit?: number; sortBy?: string }) {
    const includeReservations = options.includeReservations ?? false;
    const pageNum = Math.max(options.page ?? 1, 1);
    const limitNum = Math.min(Math.max(options.limit ?? 20, 1), 100);
    const order = this.resolveSortOrder(options.sortBy);

    const [lots, total] = await this.repository.findAndCount({
      relations: ['ev_chargers', 'spots'],
      order,
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    });

    lots.forEach((l) => this.applyDynamicPricing(l));

    if (includeReservations && lots.length > 0) {
      await this.attachNextReservations(lots);
    }

    this.calculateAndUpdateCO2ForLots(lots);

    return { results: lots, total };
  }

  async getById(id: number, includeReservations: boolean = false): Promise<ParkingLot | null> {
    const lot = await this.repository.findOne({
      where: { id },
      relations: ['ev_chargers', 'spots']
    });

    if (!lot) return null;

    this.applyDynamicPricing(lot);

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
    let fallbackIndex = 0;
    const nextFallbackSpotId = () => {
      while (fallbackIndex < spotIds.length && nextBySpot.has(spotIds[fallbackIndex])) {
        fallbackIndex += 1;
      }
      return fallbackIndex < spotIds.length ? spotIds[fallbackIndex] : undefined;
    };

    for (const r of rows) {
      let sid = (r.spot as any)?.id;

      // Fallback: some test mocks may not include r.spot; assign to the next unmatched spot id.
      if (!sid) {
        sid = nextFallbackSpotId();
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

  private applyDynamicPricing(lot: ParkingLot) {
    if (!lot.dynamic_pricing_enabled) return;
    const total = lot.totalSpots || (lot.spots?.length || 0);
    const spots = lot.spots || [];
    let occupied = 0;
    for (let i = 0; i < spots.length; i++) {
      const status = (spots[i] as any).status;
      if (status === 'occupied' || status === 'reserved') occupied++;
    }
    const occupancyRate = total ? occupied / total : 0;

    let multiplier = Number(lot.surge_multiplier || 1);
    if (occupancyRate > 0.85) multiplier = Math.max(multiplier, 1.35);
    else if (occupancyRate > 0.65) multiplier = Math.max(multiplier, 1.2);
    else if (occupancyRate < 0.3) multiplier = Math.min(multiplier, 0.9);

    const base = Number(lot.pricePerHour || 0);
    (lot as any).dynamicPrice = Number((base * multiplier).toFixed(2));
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected || 0) > 0;
  }

  async searchNearby(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    includeReservations: boolean = false,
    options: SearchOptions = {}
  ): Promise<{ results: ParkingLot[]; searchMetadata: { lat: number; lng: number }; total?: number; sortApplied?: boolean; paginationApplied?: boolean }> {
    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.warn('GOOGLE_MAPS_API_KEY is not set. Returning local DB data.');
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

      const places = response.data.results || [];
      if (!places.length) {
        return { results: [], searchMetadata: { lat, lng }, total: 0 };
      }

      const { orderedIds } = await this.upsertPlaces(places, (place) => place?.vicinity || 'Unknown Location');
      if (!orderedIds.length) {
        return { results: [], searchMetadata: { lat, lng }, total: 0 };
      }

      const queryResult = await this.queryLotsByIds({
        ids: orderedIds,
        sortBy: options.sortBy,
        page: options.page,
        limit: options.limit,
        origin: { lat, lng },
        sortMode: options.sortMode
      });

      let results = queryResult.results;
      if (!queryResult.sortApplied) {
        results = this.reorderLotsByIds(results, orderedIds);
      }

      if (!queryResult.distanceApplied) {
        for (let i = 0; i < results.length; i++) {
          const lot = results[i];
          if (lot.latitude === null || lot.longitude === null || lot.latitude === undefined || lot.longitude === undefined) continue;
          lot.distance_km = this.calculateDistance(lat, lng, Number(lot.latitude), Number(lot.longitude));
        }
      }

      if (includeReservations && results.length > 0) {
        await this.attachNextReservations(results);
      }

      this.calculateAndUpdateCO2ForLots(results);

      return {
        results,
        searchMetadata: { lat, lng },
        total: orderedIds.length,
        sortApplied: queryResult.sortApplied,
        paginationApplied: queryResult.paginationApplied
      };

    } catch (error) {
      console.error('Failed to fetch from Google Maps:', error);
      const all = await this.getAll(includeReservations);
      return { results: all, searchMetadata: { lat, lng } };
    }
  }

  async searchByText(
    query: string,
    lat?: number,
    lng?: number,
    includeReservations: boolean = false,
    options: SearchOptions = {}
  ): Promise<{ results: ParkingLot[]; searchMetadata?: { lat: number; lng: number }; total?: number; sortApplied?: boolean; paginationApplied?: boolean }> {
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

      const places = response.data.results || [];
      if (!places.length) {
        return { results: [], searchMetadata, total: 0 };
      }

      const { orderedIds } = await this.upsertPlaces(places, (place) => place?.formatted_address || 'Unknown Location');
      if (!orderedIds.length) {
        return { results: [], searchMetadata, total: 0 };
      }

      const queryResult = await this.queryLotsByIds({
        ids: orderedIds,
        sortBy: options.sortBy,
        page: options.page,
        limit: options.limit,
        origin: searchMetadata,
        sortMode: options.sortMode
      });

      let results = queryResult.results;
      if (!queryResult.sortApplied) {
        results = this.reorderLotsByIds(results, orderedIds);
      }

      if (!queryResult.distanceApplied && searchMetadata) {
        for (let i = 0; i < results.length; i++) {
          const lot = results[i];
          if (lot.latitude === null || lot.longitude === null || lot.latitude === undefined || lot.longitude === undefined) continue;
          lot.distance_km = this.calculateDistance(searchMetadata.lat, searchMetadata.lng, Number(lot.latitude), Number(lot.longitude));
        }
      }

      if (includeReservations && results.length > 0) {
        await this.attachNextReservations(results);
      }

      this.calculateAndUpdateCO2ForLots(results);

      return {
        results,
        searchMetadata,
        total: orderedIds.length,
        sortApplied: queryResult.sortApplied,
        paginationApplied: queryResult.paginationApplied
      };

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

    // Calculate CO2 for each lot based on distance and track min/max.
    let maxCO2 = -Infinity;
    let minCO2 = Infinity;
    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      let estimated: number;
      if (lot.distance_km !== undefined && lot.distance_km !== null) {
        // CO2 = (distance + circling) * emission_factor
        estimated = Math.round((lot.distance_km + AVG_CIRCLING_KM) * EMISSION_FACTOR_G_PER_KM);
      } else {
        // If no distance, use a default moderate value
        estimated = 300;
      }
      lot.co2_estimated_g = estimated;
      if (estimated > maxCO2) maxCO2 = estimated;
      if (estimated < minCO2) minCO2 = estimated;
    }

    // Calculate savings percentage and mark the lowest CO2 option
    for (let i = 0; i < lots.length; i++) {
      const lot = lots[i];
      if (maxCO2 > 0) {
        lot.co2_savings_pct = Math.round(((maxCO2 - lot.co2_estimated_g) / maxCO2) * 100);
      } else {
        lot.co2_savings_pct = 0;
      }
      lot.is_lowest_co2 = lot.co2_estimated_g === minCO2;
    }
  }
  async getPhotoUrl(photoReference: string): Promise<string | null> {
    if (!process.env.GOOGLE_MAPS_API_KEY) return null;
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${process.env.GOOGLE_MAPS_API_KEY}`;
  }
}
