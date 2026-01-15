import { AppDataSource } from '../../config/database.config';
import { Reservation } from '../../Models/reservation.entity';

export class ReservationRepository {
  private repo = AppDataSource.getRepository(Reservation);

  async getAll(options?: any): Promise<Reservation[]> {
    return this.repo.find(options || {
      relations: ['user', 'parkingLot', 'listing', 'payments', 'spot'],
    });
  }

  async getById(id: number): Promise<Reservation | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['user', 'parkingLot', 'listing', 'payments', 'spot'],   // OPTIONAL based on your entity setup
    });
  }

  async create(data: Partial<Reservation>): Promise<Reservation> {
    const reservation = this.repo.create(data);
    return this.repo.save(reservation);
  }

  async update(id: number, data: Partial<Reservation>): Promise<Reservation | null> {
    const reservation = await this.repo.findOne({ where: { id } });
    if (!reservation) return null;

    Object.assign(reservation, data);
    return this.repo.save(reservation);
  }

  async delete(id: number): Promise<boolean> {
    const { affected } = await this.repo.delete(id);
    return !!affected;
  }
}
