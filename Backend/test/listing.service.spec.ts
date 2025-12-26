const mockRepo = {
  find: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock('../src/config/database.config', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockRepo),
  },
}));

import { ListingService } from '../src/Services/listing.service';
import { AppDataSource } from '../src/config/database.config';

describe('ListingService', () => {
  let service: ListingService;

  beforeEach(() => {
    service = new ListingService();
  });

  it('returns listings from repository', async () => {
    const fakeListings = [{ id: 1, title: 'Driveway', pricePerHour: 3 }];
    (mockRepo.find as jest.Mock).mockResolvedValue(fakeListings);

    const res = await service.getAll();
    expect(res).toEqual(fakeListings);
    expect(mockRepo.find).toHaveBeenCalledWith({ relations: ['owner'] });
  });

  it('creates and saves listing', async () => {
    const input = { title: 'New Spot', pricePerHour: 4 } as any;
    const saved = { ...input, id: 42 };

    (mockRepo.create as jest.Mock).mockReturnValue(input);
    (mockRepo.save as jest.Mock).mockResolvedValue(saved);

    const out = await service.create(input);
    expect(out.id).toBe(42);
    expect(out.title).toBe('New Spot');
    expect(mockRepo.create).toHaveBeenCalledWith(input);
    expect(mockRepo.save).toHaveBeenCalledWith(input);
  });
});
