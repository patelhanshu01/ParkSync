import { Request, Response } from 'express';
import { ParkingService } from '../Services/parking.service';

const service = new ParkingService();

/**
 * Transform parking lot data to include co2_impact nested object
 * The frontend expects co2_impact: { estimated_g, savings_pct, is_lowest }
 * but the database stores these as flat fields
 */
const transformParkingLotResponse = (lot: any) => {
  const { co2_estimated_g, co2_savings_pct, is_lowest_co2, ...rest } = lot;

  return {
    ...rest,
    co2_impact: {
      estimated_g: co2_estimated_g || 0,
      savings_pct: co2_savings_pct || 0,
      is_lowest: is_lowest_co2 || false
    }
  };
};

export const getAllParking = async (req: Request, res: Response) => {
  const { lat, lng, radius, search, includeReservations } = req.query;
  const include = includeReservations === 'true' || includeReservations === '1';

  let responseData;

  if (search) {
    const query = search as string;
    const latitude = lat ? parseFloat(lat as string) : undefined;
    const longitude = lng ? parseFloat(lng as string) : undefined;

    responseData = await service.searchByText(query, latitude, longitude, include);
  } else if (lat && lng) {
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = radius ? parseFloat(radius as string) : 5;

    responseData = await service.searchNearby(latitude, longitude, radiusKm, include);
  } else {
    const all = await service.getAll(include);
    responseData = { results: all };
  }

  // Transform the results to include co2_impact nested object
  if (responseData.results) {
    responseData.results = responseData.results.map(transformParkingLotResponse);
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
  const { reference } = req.params;
  const url = await service.getPhotoUrl(reference);
  if (!url) return res.status(404).json({ message: "Photo not found" });
  res.redirect(url);
};
