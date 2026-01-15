import { ReservationRepository } from './reservation.repository';
import { Reservation } from '../../Models/reservation.entity';
import { ParkingService } from '../parking/parking.service';
import { ListingService } from '../listings/listing.service';
import { PaymentService } from '../payments/payment.service';

export class ReservationService {
  private repository = new ReservationRepository();
  private parkingService = new ParkingService();
  private listingService = new ListingService();
  private paymentService = new PaymentService();

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

    // Validate private listing booking
    if (data.listing) {
      const listingId = typeof data.listing === 'object' ? (data.listing as any).id : data.listing;
      const listing = await this.listingService.getById(listingId);
      if (!listing) {
        throw new Error('Listing not found');
      }
      if (listing.isActive === false) {
        throw new Error('Listing is not active');
      }
      data.listing = { id: listingId } as any;
      // Ensure parkingLot is not also sent for a pure listing booking
      if (!data.parkingLot) {
        (data as any).parkingLot = null;
      }
    }

    if (!data.reservedEndTime && data.endTime) {
      data.reservedEndTime = data.endTime as any;
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
      relations: ['parkingLot', 'listing', 'payments', 'user', 'spot'],
      order: { startTime: 'DESC' }
    } as any);
  }

  private normalizeMinutes(value: number | undefined, fallback: number, min: number, max: number) {
    if (value === undefined || value === null || Number.isNaN(value)) return fallback;
    return Math.min(Math.max(Math.round(value), min), max);
  }

  async setAutoExtend(
    id: number,
    settings: { enabled: boolean; intervalMinutes?: number; capMinutes?: number }
  ): Promise<Reservation | null> {
    const reservation = await this.repository.getById(id);
    if (!reservation) return null;

    const intervalMinutes = this.normalizeMinutes(settings.intervalMinutes, reservation.autoExtendIntervalMinutes || 15, 5, 120);
    const capMinutes = this.normalizeMinutes(settings.capMinutes, reservation.autoExtendCapMinutes || 120, 15, 720);

    const updates: Partial<Reservation> = {
      autoExtendEnabled: settings.enabled,
      autoExtendIntervalMinutes: intervalMinutes,
      autoExtendCapMinutes: capMinutes,
      reminderSentAt: settings.enabled ? null : reservation.reminderSentAt,
    };

    if (!reservation.reservedEndTime && reservation.endTime) {
      updates.reservedEndTime = reservation.endTime;
    }

    return this.repository.update(id, updates);
  }

  async extendReservation(id: number, minutes: number, userId: number): Promise<Reservation | null> {
    const reservation = await this.repository.getById(id);
    if (!reservation) return null;
    if (reservation.endedAt) {
      throw new Error('Reservation already ended');
    }

    const normalizedMinutes = this.normalizeMinutes(minutes, 0, 5, 720);
    if (normalizedMinutes <= 0) {
      throw new Error('Invalid extension minutes');
    }

    const currentEnd = reservation.endTime instanceof Date ? reservation.endTime : new Date(reservation.endTime);
    const newEnd = new Date(currentEnd.getTime() + normalizedMinutes * 60 * 1000);

    const rate = Number(reservation.parkingLot?.pricePerHour ?? reservation.listing?.pricePerHour ?? 0);
    const amount = rate > 0 ? (rate * normalizedMinutes) / 60 : 0;

    if (amount > 0) {
      await this.paymentService.processPayment(amount, 'manual_extend', userId, reservation.id);
    }

    await this.repository.update(id, {
      endTime: newEnd as any,
      reservedEndTime: newEnd as any,
      reminderSentAt: null
    });

    return this.repository.getById(id);
  }

  async endReservation(id: number): Promise<Reservation | null> {
    const reservation = await this.repository.getById(id);
    if (!reservation) return null;
    if (reservation.endedAt) return reservation;

    await this.repository.update(id, {
      endedAt: new Date() as any,
      autoExtendEnabled: false
    });

    return this.repository.getById(id);
  }
}
