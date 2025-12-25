import { AppDataSource } from '../config/database.config';
import { ParkingLot } from '../Models/parking-lot.entity';

export class ParkingLotRepository {
  private repo = AppDataSource.getRepository(ParkingLot);

  async getAll(): Promise<ParkingLot[]> {
    return this.repo.find();
  }

  async getById(id: number): Promise<ParkingLot | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<ParkingLot>): Promise<ParkingLot> {
    const lot = this.repo.create(data);
    return this.repo.save(lot);
  }

  async update(id: number, data: Partial<ParkingLot>): Promise<ParkingLot | null> {
    const lot = await this.repo.findOne({ where: { id } });
    if (!lot) return null;

    Object.assign(lot, data);
    return this.repo.save(lot);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return (result.affected ?? 0)>0;
  }
}
