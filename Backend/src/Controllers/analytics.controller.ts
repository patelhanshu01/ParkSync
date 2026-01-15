import { Request, Response } from 'express';
import { AppDataSource } from '../config/database.config';
import { Payment } from '../Models/payment.entity';
import { Reservation } from '../Models/reservation.entity';
import { ParkingLot } from '../Models/parking-lot.entity';

export const getSummary = async (_req: Request, res: Response) => {
  const paymentRepo = AppDataSource.getRepository(Payment);
  const reservationRepo = AppDataSource.getRepository(Reservation);
  const lotRepo = AppDataSource.getRepository(ParkingLot);

  const now = new Date();
  const startOfDay = new Date(now); startOfDay.setHours(0, 0, 0, 0);
  const nowIso = now.toISOString();

  const [totalRevenue, todayRevenue, activeReservations, totalReservations, occupancyRows, lotRows] = await Promise.all([
    paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount),0)', 'sum')
      .getRawOne(),
    paymentRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.amount),0)', 'sum')
      .where('p.createdAt >= :start', { start: startOfDay.toISOString() })
      .getRawOne(),
    reservationRepo.createQueryBuilder('r')
      .where('r.startTime <= :now', { now: nowIso })
      .andWhere('r.endTime >= :now', { now: nowIso })
      .getCount(),
    reservationRepo.count(),
    reservationRepo
      .createQueryBuilder('r')
      .leftJoin('r.parkingLot', 'lot')
      .select('lot.id', 'lotId')
      .addSelect('COUNT(r.id)', 'count')
      .groupBy('lot.id')
      .getRawMany(),
    lotRepo
      .createQueryBuilder('lot')
      .leftJoin('lot.spots', 'spot')
      .select('lot.id', 'id')
      .addSelect('lot.name', 'name')
      .addSelect('lot.totalSpots', 'totalSpots')
      .addSelect('COUNT(spot.id)', 'spotCount')
      .groupBy('lot.id')
      .addGroupBy('lot.name')
      .addGroupBy('lot.totalSpots')
      .getRawMany()
  ]);

  const occupancyByLot = new Map<number, number>();
  for (let i = 0; i < occupancyRows.length; i++) {
    const row = occupancyRows[i];
    if (row.lotId === null || row.lotId === undefined) continue;
    const lotId = Number(row.lotId);
    if (!Number.isFinite(lotId) || lotId <= 0) continue;
    occupancyByLot.set(lotId, Number(row.count) || 0);
  }

  const occupancy = new Array(lotRows.length);
  for (let i = 0; i < lotRows.length; i++) {
    const row = lotRows[i];
    const lotId = Number(row.id);
    const storedTotal = row.totalSpots !== null && row.totalSpots !== undefined ? Number(row.totalSpots) : 0;
    const spotCount = Number(row.spotCount) || 0;
    const total = storedTotal > 0 ? storedTotal : spotCount;
    const used = occupancyByLot.get(lotId) || 0;
    const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
    occupancy[i] = {
      lotId,
      lotName: row.name,
      occupancyPct: pct,
      activeReservations: used,
      totalSpots: total
    };
  }

  res.json({
    revenue: {
      total: Number(totalRevenue?.sum || 0),
      today: Number(todayRevenue?.sum || 0)
    },
    reservations: {
      activeCount: activeReservations,
      totalCount: totalReservations
    },
    occupancy
  });
};
