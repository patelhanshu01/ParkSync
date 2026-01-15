const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(),
};

jest.mock('../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepo),
  },
}));

import { ParkingService } from '../src/modules/parking/parking.service';
import { AppDataSource } from '../src/config/database.config';

describe('ParkingService list reservations', () => {
  let service: ParkingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ParkingService();
  });

  it('attaches nextReservation to spots when includeReservations=true on getAll', async () => {
    const spot1 = { id: 401, spot_number: 'B1', status: 'reserved' } as any;
    const spot2 = { id: 402, spot_number: 'B2', status: 'available' } as any;
    const lot1: any = { id: 2, name: 'List Lot', spots: [spot1, spot2], ev_chargers: [] };

    (mockRepo.find as jest.Mock).mockResolvedValue([lot1]);

    const nextReservation = {
      id: 501,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      user: { id: 10, name: 'Bob' },
      spot: { id: 401 }
    };

    const mockQB: any = {
      leftJoinAndSelect: function () { return this; },
      where: function () { return this; },
      andWhere: function () { return this; },
      orderBy: function () { return this; },
      addOrderBy: function () { return this; },
      getMany: jest.fn().mockResolvedValue([nextReservation])
    };

    (mockRepo.createQueryBuilder as jest.Mock).mockReturnValue(mockQB);

    const results = await service.getAll(true);
    expect(results).not.toBeNull();
    expect(results[0].spots[0].nextReservation).toBeDefined();
    expect(results[0].spots[0].nextReservation.id).toBe(501);
  });
});
