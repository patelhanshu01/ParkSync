import { ReservationRepository } from '../Repositories/reservation.repository';
import { Reservation } from '../Models/reservation.entity';
import { ParkingService } from './parking.service';

export class ReservationService {
  private repository = new ReservationRepository();
  private parkingService = new ParkingService();

  async getAll(): Promise<Reservation[]> {
    return this.repository.getAll();
  }

  async getById(id: number): Promise<Reservation | null> {
    return this.repository.getById(id);
  }

  async create(data: Partial<Reservation>): Promise<Reservation> {
    // Check parking lot availability
    if (data.parkingLot) {
      const lotId = typeof data.parkingLot === 'object' ? data.parkingLot.id : data.parkingLot;
      const lot = await this.parkingService.getById(lotId);

      if (!lot || !lot.availableSpots || lot.availableSpots <= 0) {
        throw new Error('No available spots in this parking lot');
      }

      // Decrease available spots
      await this.parkingService.updateAvailability(lotId, lot.availableSpots - 1);
    }

    return this.repository.create(data);
  }

  async update(id: number, data: Partial<Reservation>): Promise<Reservation | null> {
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    const reservation = await this.repository.getById(id);
    if (reservation && reservation.parkingLot) {
      const lotId = reservation.parkingLot.id;
      const lot = await this.parkingService.getById(lotId);

      if (lot && lot.availableSpots !== undefined) {
        // Increase available spots when reservation is deleted
        await this.parkingService.updateAvailability(lotId, lot.availableSpots + 1);
      }
    }

    return this.repository.delete(id);
  }

  async getByUserId(userId: number): Promise<Reservation[]> {
    return this.repository.getAll({
      where: { user: { id: userId } },
      relations: ['parkingLot', 'payments', 'user', 'spot'],
      order: { startTime: 'DESC' }
    } as any);
  }
}