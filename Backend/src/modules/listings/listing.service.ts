import { AppDataSource } from '../../config/database.config';
import { Listing } from '../../Models/listing.entity';

export class ListingService {
  private repo = AppDataSource.getRepository(Listing);

  async getAll(): Promise<Listing[]> {
    return this.repo.find({ relations: ['owner'] });
  }

  async getById(id: number): Promise<Listing | null> {
    return this.repo.findOne({ where: { id }, relations: ['owner'] });
  }

  async create(data: Partial<Listing>): Promise<Listing> {
    const listing = this.repo.create(data as Listing);
    const saved = await this.repo.save(listing as Listing);
    return saved;
  }

  async update(id: number, data: Partial<Listing>): Promise<Listing | null> {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) return null;
    Object.assign(existing, data);
    return this.repo.save(existing);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected || 0) > 0;
  }
}
