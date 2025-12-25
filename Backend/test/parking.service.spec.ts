import { ParkingService } from '../src/Services/parking.service';
import { AppDataSource } from '../src/config/database.config';

describe('ParkingService', () => {
  let service: ParkingService;

  beforeEach(() => {
    service = new ParkingService();
  });

  it('attaches nextReservation to spots when present', async () => {
    const spot = { id: 101, spot_number: 'A1', status: 'reserved' } as any;
    const lot: any = { id: 1, name: 'Test Lot', spots: [spot], ev_chargers: [] };

    // Mock the parking repository's findOne to return our lot
    (service as any).repository = { findOne: jest.fn().mockResolvedValue(lot) };

    // Mock reservation repo/query builder to return a next reservation
    const nextReservation = { id: 201, startTime: new Date().toISOString(), endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(), user: { id: 5, name: 'Alice' } };

    const mockQB: any = {
      leftJoinAndSelect: function () { return this; },
      where: function () { return this; },
      andWhere: function () { return this; },
      orderBy: function () { return this; },
      getOne: jest.fn().mockResolvedValue(nextReservation)
    };

    (AppDataSource as any).getRepository = jest.fn().mockImplementation((name: string) => {
      if (name === 'Reservation') return { createQueryBuilder: () => mockQB };
      return {};
    });

    const result = await service.getById(1);
    expect(result).not.toBeNull();
    const returnedSpot = result!.spots[0] as any;
    expect(returnedSpot.nextReservation).toBeDefined();
    expect(returnedSpot.nextReservation.id).toBe(nextReservation.id);
    expect(returnedSpot.nextReservation.user.name).toBe('Alice');
  });
});
