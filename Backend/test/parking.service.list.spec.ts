import { ParkingService } from '../src/Services/parking.service';
import { AppDataSource } from '../src/config/database.config';

describe('ParkingService list reservations', () => {
  let service: ParkingService;

  beforeEach(() => {
    service = new ParkingService();
  });

  it('attaches nextReservation to spots when includeReservations=true on getAll', async () => {
    const spot1 = { id: 401, spot_number: 'B1', status: 'reserved' } as any;
    const spot2 = { id: 402, spot_number: 'B2', status: 'available' } as any;
    const lot1: any = { id: 2, name: 'List Lot', spots: [spot1, spot2], ev_chargers: [] };

    // Mock parking repository to return list
    (service as any).repository = { find: jest.fn().mockResolvedValue([lot1]) };

    // Mock reservation repo/query builder to return a next reservation for spot1
    const nextReservation = { id: 501, startTime: new Date().toISOString(), endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(), user: { id: 10, name: 'Bob' }, spot: { id: 401 } };

    const mockQB: any = {
      leftJoinAndSelect: function () { return this; },
      where: function () { return this; },
      andWhere: function () { return this; },
      orderBy: function () { return this; },
      addOrderBy: function () { return this; },
      getMany: jest.fn().mockResolvedValue([nextReservation])
    };

    (AppDataSource as any).getRepository = jest.fn().mockImplementation((name: string) => {
      if (name === 'Reservation') return { createQueryBuilder: () => mockQB };
      return {};
    });

    const results = await service.getAll(true);
    expect(results).not.toBeNull();
    expect(results[0].spots[0].nextReservation).toBeDefined();
    expect(results[0].spots[0].nextReservation.id).toBe(501);
  });
});
