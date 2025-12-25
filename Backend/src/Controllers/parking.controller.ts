import { Request, Response } from 'express';
import { ParkingService } from '../Services/parking.service';

const service = new ParkingService();

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

  res.json(responseData);
};

export const getParkingById = async (req: Request, res: Response) => {
  const data = await service.getById(Number(req.params.id));
  if (!data) return res.status(404).json({ message: "Parking lot not found" });
  res.json(data);
};

export const createParking = async (req: Request, res: Response) => {
  const data = await service.create(req.body);
  res.status(201).json(data);
};

export const updateParking = async (req: Request, res: Response) => {
  const data = await service.update(Number(req.params.id), req.body);
  if (!data) return res.status(404).json({ message: "Parking lot not found" });
  res.json(data);
};

export const deleteParking = async (req: Request, res: Response) => {
  const success = await service.delete(Number(req.params.id));
  if (!success) return res.status(404).json({ message: "Parking lot not found" });
  res.json({ message: "Deleted successfully" });
};
