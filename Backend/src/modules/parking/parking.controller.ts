import { Request, Response } from 'express';
import { ParkingService } from './parking.service';
import { AppDataSource } from '../../config/database.config';
import { ParkingLot } from '../../Models/parking-lot.entity';
import { CacheService } from '../../Services/cache.service';

const service = new ParkingService();
const cache = CacheService.getInstance();
const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1470224114660-3f6686c562eb?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1526626607727-42c162f7ab06?auto=format&fit=crop&w=800&q=80"
];

const resolveImageUrl = (lot: any) => {
  if (lot?.imageUrl) return lot.imageUrl;
  const id = Number(lot?.id);
  const index = Number.isFinite(id) ? Math.abs(id) % FALLBACK_IMAGES.length : 0;
  return FALLBACK_IMAGES[index];
};

type AvailabilitySpot = {
  id: number;
  status: string;
  spot_number: string;
  floor_level?: number | null;
};

type AvailabilityLot = {
  id: number;
  name: string;
  spots: AvailabilitySpot[];
};

type AvailabilityDelta = {
  version: number;
  lots: Array<{
    id: number;
    name?: string;
    spots: AvailabilitySpot[];
    removedSpotIds?: number[];
  }>;
  removedLotIds?: number[];
};

const AVAILABILITY_SNAPSHOT_KEY = 'parking:availability:snapshot';
const AVAILABILITY_VERSION_KEY = 'parking:availability:version';
const availabilityClients = new Set<Response>();
let availabilityInterval: NodeJS.Timeout | null = null;
let lastSnapshot: AvailabilityLot[] | null = null;
let snapshotVersion = 0;
let snapshotLoading = false;
const lotClients = new Map<number, Set<Response>>();
const lotSnapshots = new Map<number, AvailabilityLot | null>();
const lotVersions = new Map<number, number>();
const lotLoading = new Set<number>();
let lotInterval: NodeJS.Timeout | null = null;

const buildAvailabilitySnapshot = async (): Promise<AvailabilityLot[]> => {
  const lots = await AppDataSource.getRepository(ParkingLot).find({ relations: ['spots'] });
  const payload = new Array(lots.length);
  for (let i = 0; i < lots.length; i++) {
    const lot = lots[i];
    const spots = lot.spots || [];
    const spotPayload = new Array(spots.length);
    for (let j = 0; j < spots.length; j++) {
      const spot = spots[j] as any;
      spotPayload[j] = {
        id: spot.id,
        status: spot.status,
        spot_number: spot.spot_number,
        floor_level: spot.floor_level
      };
    }
    payload[i] = {
      id: lot.id,
      name: lot.name,
      spots: spotPayload
    };
  }
  return payload;
};

const buildLotSnapshot = async (lotId: number): Promise<AvailabilityLot | null> => {
  const lot = await AppDataSource.getRepository(ParkingLot).findOne({
    where: { id: lotId },
    relations: ['spots']
  });
  if (!lot) return null;
  const spots = lot.spots || [];
  const spotPayload = new Array(spots.length);
  for (let j = 0; j < spots.length; j++) {
    const spot = spots[j] as any;
    spotPayload[j] = {
      id: spot.id,
      status: spot.status,
      spot_number: spot.spot_number,
      floor_level: spot.floor_level
    };
  }
  return {
    id: lot.id,
    name: lot.name,
    spots: spotPayload
  };
};

const diffAvailability = (prev: AvailabilityLot[], next: AvailabilityLot[]): AvailabilityDelta => {
  const prevMap = new Map<number, AvailabilityLot>();
  const nextMap = new Map<number, AvailabilityLot>();
  for (let i = 0; i < prev.length; i++) prevMap.set(prev[i].id, prev[i]);
  for (let i = 0; i < next.length; i++) nextMap.set(next[i].id, next[i]);

  const removedLotIds: number[] = [];
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) removedLotIds.push(id);
  }

  const changedLots: AvailabilityDelta['lots'] = [];
  for (const [id, nextLot] of nextMap.entries()) {
    const prevLot = prevMap.get(id);
    if (!prevLot) {
      changedLots.push({ id: nextLot.id, name: nextLot.name, spots: nextLot.spots });
      continue;
    }

    const prevSpots = new Map<number, AvailabilitySpot>();
    for (let i = 0; i < prevLot.spots.length; i++) {
      prevSpots.set(prevLot.spots[i].id, prevLot.spots[i]);
    }
    const nextSpots = new Map<number, AvailabilitySpot>();
    for (let i = 0; i < nextLot.spots.length; i++) {
      nextSpots.set(nextLot.spots[i].id, nextLot.spots[i]);
    }

    const removedSpotIds: number[] = [];
    for (const spotId of prevSpots.keys()) {
      if (!nextSpots.has(spotId)) removedSpotIds.push(spotId);
    }

    const changedSpots: AvailabilitySpot[] = [];
    for (const [spotId, nextSpot] of nextSpots.entries()) {
      const prevSpot = prevSpots.get(spotId);
      if (
        !prevSpot ||
        prevSpot.status !== nextSpot.status ||
        prevSpot.spot_number !== nextSpot.spot_number ||
        prevSpot.floor_level !== nextSpot.floor_level
      ) {
        changedSpots.push(nextSpot);
      }
    }

    if (changedSpots.length || removedSpotIds.length) {
      changedLots.push({
        id: nextLot.id,
        spots: changedSpots,
        removedSpotIds: removedSpotIds.length ? removedSpotIds : undefined
      });
    }
  }

  return {
    version: snapshotVersion,
    lots: changedLots,
    removedLotIds: removedLotIds.length ? removedLotIds : undefined
  };
};

const ensureSnapshot = async () => {
  if (lastSnapshot) return lastSnapshot;
  if (snapshotLoading) return null;
  snapshotLoading = true;
  try {
    const cached = await cache.getJSON<AvailabilityLot[]>(AVAILABILITY_SNAPSHOT_KEY);
    const cachedVersion = await cache.get(AVAILABILITY_VERSION_KEY);
    if (cached) lastSnapshot = cached;
    if (cachedVersion) snapshotVersion = Number(cachedVersion) || snapshotVersion;

    if (!lastSnapshot) {
      lastSnapshot = await buildAvailabilitySnapshot();
      snapshotVersion += 1;
      await cache.setJSON(AVAILABILITY_SNAPSHOT_KEY, lastSnapshot, Number(process.env.PARKING_CACHE_TTL_SEC || 30));
      await cache.set(AVAILABILITY_VERSION_KEY, String(snapshotVersion), Number(process.env.PARKING_CACHE_TTL_SEC || 30));
    }
  } finally {
    snapshotLoading = false;
  }
  return lastSnapshot;
};

const isClientAlive = (client: Response) => !client.writableEnded && !client.destroyed;

const broadcastEvent = (event: string, payload: unknown) => {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of availabilityClients) {
    if (!isClientAlive(client)) {
      availabilityClients.delete(client);
      continue;
    }
    try {
      client.write(data);
    } catch (err) {
      availabilityClients.delete(client);
    }
  }
};

const broadcastEventToClients = (clients: Set<Response>, event: string, payload: unknown) => {
  const data = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    if (!isClientAlive(client)) {
      clients.delete(client);
      continue;
    }
    try {
      client.write(data);
    } catch (err) {
      clients.delete(client);
    }
  }
};

const startAvailabilityPolling = () => {
  if (availabilityInterval) return;
  const intervalMs = Number(process.env.PARKING_SSE_INTERVAL_MS || 5000);
  availabilityInterval = setInterval(async () => {
    if (availabilityClients.size === 0) {
      if (availabilityInterval) clearInterval(availabilityInterval);
      availabilityInterval = null;
      return;
    }

    const currentSnapshot = await buildAvailabilitySnapshot();
    const previous = lastSnapshot || [];
    const delta = diffAvailability(previous, currentSnapshot);
    const hasChanges = delta.lots.length > 0 || (delta.removedLotIds && delta.removedLotIds.length > 0);
    if (!hasChanges) {
      broadcastEvent('ping', { version: snapshotVersion, ts: Date.now() });
      return;
    }

    snapshotVersion += 1;
    lastSnapshot = currentSnapshot;
    const cacheTtl = Number(process.env.PARKING_CACHE_TTL_SEC || 30);
    await cache.setJSON(AVAILABILITY_SNAPSHOT_KEY, currentSnapshot, cacheTtl);
    await cache.set(AVAILABILITY_VERSION_KEY, String(snapshotVersion), cacheTtl);

    broadcastEvent('delta', {
      version: snapshotVersion,
      lots: delta.lots,
      removedLotIds: delta.removedLotIds
    });
  }, intervalMs);
};

const ensureLotSnapshot = async (lotId: number) => {
  if (lotSnapshots.has(lotId)) return lotSnapshots.get(lotId) || null;
  if (lotLoading.has(lotId)) return null;
  lotLoading.add(lotId);
  try {
    const cacheTtl = Number(process.env.PARKING_CACHE_TTL_SEC || 30);
    const cacheKey = `parking:availability:lot:${lotId}`;
    const versionKey = `${cacheKey}:version`;
    const cached = await cache.getJSON<AvailabilityLot>(cacheKey);
    const cachedVersion = await cache.get(versionKey);
    if (cached) lotSnapshots.set(lotId, cached);
    if (cachedVersion) lotVersions.set(lotId, Number(cachedVersion) || 0);
    if (!lotSnapshots.has(lotId)) {
      const snapshot = await buildLotSnapshot(lotId);
      lotSnapshots.set(lotId, snapshot);
      if (snapshot) {
        const nextVersion = (lotVersions.get(lotId) || 0) + 1;
        lotVersions.set(lotId, nextVersion);
        await cache.setJSON(cacheKey, snapshot, cacheTtl);
        await cache.set(versionKey, String(nextVersion), cacheTtl);
      }
    }
  } finally {
    lotLoading.delete(lotId);
  }
  return lotSnapshots.get(lotId) || null;
};

const startLotPolling = () => {
  if (lotInterval) return;
  const intervalMs = Number(process.env.PARKING_SSE_INTERVAL_MS || 5000);
  lotInterval = setInterval(async () => {
    if (lotClients.size === 0) {
      if (lotInterval) clearInterval(lotInterval);
      lotInterval = null;
      return;
    }
    for (const [lotId, clients] of lotClients.entries()) {
      if (!clients.size) {
        lotClients.delete(lotId);
        lotSnapshots.delete(lotId);
        lotVersions.delete(lotId);
        continue;
      }
      const current = await buildLotSnapshot(lotId);
      const previous = lotSnapshots.get(lotId) || null;
      if (!current) {
        broadcastEventToClients(clients, 'delta', { version: lotVersions.get(lotId) || 0, lots: [], removedLotIds: [lotId] });
        lotClients.delete(lotId);
        lotSnapshots.delete(lotId);
        lotVersions.delete(lotId);
        continue;
      }

      const delta = diffAvailability(previous ? [previous] : [], [current]);
      const hasChanges = delta.lots.length > 0 || (delta.removedLotIds && delta.removedLotIds.length > 0);
      if (!hasChanges) {
        broadcastEventToClients(clients, 'ping', { version: lotVersions.get(lotId) || 0, ts: Date.now() });
        continue;
      }

      const nextVersion = (lotVersions.get(lotId) || 0) + 1;
      lotVersions.set(lotId, nextVersion);
      lotSnapshots.set(lotId, current);
      const cacheTtl = Number(process.env.PARKING_CACHE_TTL_SEC || 30);
      const cacheKey = `parking:availability:lot:${lotId}`;
      await cache.setJSON(cacheKey, current, cacheTtl);
      await cache.set(`${cacheKey}:version`, String(nextVersion), cacheTtl);
      broadcastEventToClients(clients, 'delta', { version: nextVersion, lots: delta.lots, removedLotIds: delta.removedLotIds });
    }
  }, intervalMs);
};

/**
 * Transform parking lot data to include co2_impact nested object
 * The frontend expects co2_impact: { estimated_g, savings_pct, is_lowest }
 * but the database stores these as flat fields
 */
const transformParkingLotResponse = (lot: any) => {
  const { co2_estimated_g, co2_savings_pct, is_lowest_co2, ...rest } = lot;

  return {
    ...rest,
    imageUrl: resolveImageUrl(lot),
    co2_impact: {
      estimated_g: co2_estimated_g || 0,
      savings_pct: co2_savings_pct || 0,
      is_lowest: is_lowest_co2 || false
    }
  };
};

const slimParkingLot = (lot: any) => ({
  id: lot.id,
  name: lot.name,
  location: lot.location,
  latitude: lot.latitude,
  longitude: lot.longitude,
  pricePerHour: lot.pricePerHour,
  isAvailable: lot.isAvailable,
  availableSpots: lot.availableSpots,
  totalSpots: lot.totalSpots,
  distance_km: lot.distance_km,
  imageUrl: lot.imageUrl,
  has_ev_charging: lot.has_ev_charging,
  is_covered: lot.is_covered,
  has_cctv: lot.has_cctv,
  co2_impact: lot.co2_impact,
});

export const getAllParking = async (req: Request, res: Response) => {
  const { lat, lng, radius, search, includeReservations, page = '1', limit = '20', sort_by, sort_mode } = req.query;
  const sortBy = typeof sort_by === 'string' ? sort_by : undefined;
  const rawSortMode = typeof sort_mode === 'string' ? sort_mode.toLowerCase() : undefined;
  const sortMode = rawSortMode === 'db' || rawSortMode === 'postgis' || rawSortMode === 'memory'
    ? rawSortMode
    : undefined;
  const include = includeReservations === 'true' || includeReservations === '1';
  const pageNum = Math.max(parseInt(page as string, 10) || 1, 1);
  const limitNum = Math.min(Math.max(parseInt(limit as string, 10) || 20, 1), 100);
  const isDbPaged = !search && !(lat && lng);

  let responseData;

  if (search) {
    const query = search as string;
    const latitude = lat ? parseFloat(lat as string) : undefined;
    const longitude = lng ? parseFloat(lng as string) : undefined;

    responseData = await service.searchByText(query, latitude, longitude, include, {
      sortBy,
      page: pageNum,
      limit: limitNum,
      sortMode
    });
  } else if (lat && lng) {
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = radius ? parseFloat(radius as string) : 5;

    responseData = await service.searchNearby(latitude, longitude, radiusKm, include, {
      sortBy,
      page: pageNum,
      limit: limitNum,
      sortMode
    });
  } else {
    responseData = await service.getAllPaged({
      includeReservations: include,
      page: pageNum,
      limit: limitNum,
      sortBy
    });
  }

  // Transform the results to include co2_impact nested object
  if (responseData.results) {
    const source = responseData.results;
    const sortApplied = responseData.sortApplied === true || isDbPaged;
    const paginationApplied = responseData.paginationApplied === true || isDbPaged;
    if (!sortApplied && sortBy && source.length) {
      source.sort((a: any, b: any) => {
        switch (sortBy) {
          case 'price_asc':
            return Number(a.pricePerHour || 0) - Number(b.pricePerHour || 0);
          case 'price_desc':
            return Number(b.pricePerHour || 0) - Number(a.pricePerHour || 0);
          case 'distance_asc': {
            const ad = a.distance_km ?? Number.POSITIVE_INFINITY;
            const bd = b.distance_km ?? Number.POSITIVE_INFINITY;
            return ad - bd;
          }
          case 'distance_desc': {
            const ad = a.distance_km ?? Number.NEGATIVE_INFINITY;
            const bd = b.distance_km ?? Number.NEGATIVE_INFINITY;
            return bd - ad;
          }
          default:
            return 0;
        }
      });
    }
    // Apply simple pagination on results (in-memory for now)
    const pagedSource = paginationApplied
      ? source
      : source.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);
    const paged = new Array(pagedSource.length);
    for (let i = 0; i < pagedSource.length; i++) {
      paged[i] = slimParkingLot(transformParkingLotResponse(pagedSource[i]));
    }
    const total = responseData.total ?? source.length;
    return res.json({
      results: paged,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1
      },
      searchMetadata: responseData.searchMetadata || undefined
    });
  }

  res.json(responseData);
};

export const getParkingById = async (req: Request, res: Response) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: "Parking lot not found" });

  // Transform the response to include co2_impact nested object
  const transformed = transformParkingLotResponse(data);
  res.json(transformed);
};

export const createParking = async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  const transformed = transformParkingLotResponse(data);
  res.status(201).json(transformed);
};

export const updateParking = async (req: Request, res: Response) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: "Parking lot not found" });
  const transformed = transformParkingLotResponse(data);
  res.json(transformed);
};

export const deleteParking = async (req: Request, res: Response) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: "Parking lot not found" });
  res.json({ message: "Deleted successfully" });
};

export const getParkingPhoto = async (req: Request, res: Response) => {
  try {
    const axios = require('axios');

    const reference = req.query.ref as string;
    if (!reference) {
      return res.status(400).json({ message: "Missing reference parameter" });
    }

    // Fetch from Google Maps on-demand (no local storage)
    const googleUrl = await service.getPhotoUrl(reference);
    if (!googleUrl) {
      return res.status(404).json({ message: "Photo not found" });
    }

    const response = await axios({
      method: 'get',
      url: googleUrl,
      responseType: 'stream'
    });

    const contentType = response.headers['content-type'] || 'image/jpeg';
    res.setHeader('Content-Type', contentType);

    // Stream directly to response
    response.data.pipe(res);

  } catch (error: any) {
    console.error('❌ Error in getParkingPhoto:', error.message);
    res.status(500).json({ message: "Internal server error fetching photo" });
  }
};

export const streamAvailability = async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.write('retry: 10000\n\n');
  res.flushHeaders?.();

  const lotIdParam = req.query.lotId;
  const lotId = lotIdParam ? Number(lotIdParam) : null;
  if (lotIdParam && (!lotId || Number.isNaN(lotId))) {
    res.write(`event: error\ndata: ${JSON.stringify({ message: 'Invalid lotId' })}\n\n`);
    res.end();
    return;
  }

  if (lotId) {
    let clients = lotClients.get(lotId);
    if (!clients) {
      clients = new Set<Response>();
      lotClients.set(lotId, clients);
    }
    clients.add(res);
    const snapshot = await ensureLotSnapshot(lotId);
    const version = lotVersions.get(lotId) || 0;
    if (snapshot) {
      res.write(`event: snapshot\ndata: ${JSON.stringify({ version, lots: [snapshot] })}\n\n`);
    } else {
      res.write(`event: ping\ndata: ${JSON.stringify({ version, ts: Date.now() })}\n\n`);
    }
  } else {
    availabilityClients.add(res);
    const snapshot = await ensureSnapshot();
    if (snapshot) {
      res.write(`event: snapshot\ndata: ${JSON.stringify({ version: snapshotVersion, lots: snapshot })}\n\n`);
    } else {
      res.write(`event: ping\ndata: ${JSON.stringify({ version: snapshotVersion, ts: Date.now() })}\n\n`);
    }
  }

  req.on('close', () => {
    if (lotId) {
      const clients = lotClients.get(lotId);
      if (clients) {
        clients.delete(res);
        if (!clients.size) {
          lotClients.delete(lotId);
          lotSnapshots.delete(lotId);
          lotVersions.delete(lotId);
        }
      }
    } else {
      availabilityClients.delete(res);
      if (availabilityClients.size === 0 && availabilityInterval) {
        clearInterval(availabilityInterval);
        availabilityInterval = null;
      }
    }
  });

  if (lotId) {
    startLotPolling();
  } else {
    startAvailabilityPolling();
  }
};
