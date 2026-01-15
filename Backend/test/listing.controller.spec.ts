jest.mock('../src/modules/listings/listing.service', () => {
  return {
    ListingService: jest.fn().mockImplementation(() => ({
      getAll: jest.fn().mockResolvedValue([{ id: 1, title: 'Mock' }]),
      getById: jest.fn().mockResolvedValue({ id: 1, title: 'Mock' }),
      create: jest.fn().mockResolvedValue({ id: 2, title: 'Created' }),
      update: jest.fn().mockResolvedValue({ id: 2, title: 'Updated' }),
      delete: jest.fn().mockResolvedValue(true),
    }))
  };
});

import * as ListingController from '../src/modules/listings/listing.controller';

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Listing Controller', () => {
  it('getAllListings returns results', async () => {
    const res = mockRes();
    await ListingController.getAllListings({} as any, res as any);
    expect(res.json).toHaveBeenCalledWith({ results: [{ id: 1, title: 'Mock' }] });
  });

  it('createListing returns 201 and body', async () => {
    const res = mockRes();
    const req: any = { body: { title: 'New' } };
    await ListingController.createListing(req, res as any);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ id: 2, title: 'Created' });
  });

  it('getListingById returns a listing', async () => {
    const res = mockRes();
    const req: any = { params: { id: '1' } };
    await ListingController.getListingById(req, res as any);
    expect(res.json).toHaveBeenCalled();
  });

  it('updateListing returns updated', async () => {
    const res = mockRes();
    const req: any = { params: { id: '2' }, body: { title: 'Updated' } };
    await ListingController.updateListing(req, res as any);
    expect(res.json).toHaveBeenCalledWith({ id: 2, title: 'Updated' });
  });

  it('deleteListing returns deleted', async () => {
    const res = mockRes();
    const req: any = { params: { id: '2' } };
    await ListingController.deleteListing(req, res as any);
    expect(res.json).toHaveBeenCalledWith({ message: 'Deleted' });
  });
});
