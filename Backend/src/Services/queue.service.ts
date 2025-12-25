// DEPRECATED: Queue feature removed from product. This service is retained for history only and should not be used by controllers (controllers return 404).
// Prefer using reservation.nextReservation to show reserved spots and ETA in the frontend.
import { AppDataSource } from '../config/database.config';
import { QueueStatus } from '../Models/queue-status.entity';
import { Reservation } from '../Models/reservation.entity';
import { ParkingLot } from '../Models/parking-lot.entity';
import { WalletService } from './wallet.service';

export class QueueService {
    private queueRepo = AppDataSource.getRepository(QueueStatus);
    private reservationRepo = AppDataSource.getRepository(Reservation);
    private parkingLotRepo = AppDataSource.getRepository(ParkingLot);
    private walletService = new WalletService();

    async getQueueStatus(reservationId: number) {
        const queueStatus = await this.queueRepo.findOne({
            where: { reservation: { id: reservationId } },
            relations: ['reservation']
        });

        if (!queueStatus) {
            throw new Error('Queue status not found');
        }

        return {
            position: queueStatus.position,
            eta_minutes: queueStatus.eta_minutes,
            spot_id: queueStatus.spot_id,
            reservation_id: reservationId
        };
    }

    async reassignSpot(reservationId: number, preference: 'nearest' | 'cheapest' | 'lowest_co2') {
        const reservation = await this.reservationRepo.findOne({
            where: { id: reservationId },
            relations: ['parkingLot']
        });

        if (!reservation) {
            throw new Error('Reservation not found');
        }

        // Find alternative spots based on preference
        let newLot: ParkingLot | null = null;

        if (preference === 'cheapest') {
            newLot = await this.parkingLotRepo.findOne({
                where: { isAvailable: true },
                order: { pricePerHour: 'ASC' }
            });
        } else if (preference === 'lowest_co2') {
            newLot = await this.parkingLotRepo.findOne({
                where: { isAvailable: true },
                order: { co2_estimated_g: 'ASC' }
            });
        } else {
            // Default: nearest (would need distance calculation in real app)
            newLot = await this.parkingLotRepo.findOne({
                where: { isAvailable: true }
            });
        }

        if (!newLot) {
            throw new Error('No alternative spots available');
        }

        // Update reservation
        const oldLot = reservation.parkingLot;
        reservation.parkingLot = newLot;
        await this.reservationRepo.save(reservation);

        // Remove from queue
        await this.queueRepo.delete({ reservation: { id: reservationId } });

        return {
            new_spot_id: newLot.id!,
            new_lot_name: newLot.name,
            distance_difference_m: 0, // Would calculate in real app
            price_difference: newLot.pricePerHour - oldLot.pricePerHour
        };
    }

    async keepWaiting(reservationId: number) {
        const queueStatus = await this.queueRepo.findOne({
            where: { reservation: { id: reservationId } }
        });

        if (!queueStatus) {
            throw new Error('Queue status not found');
        }

        // Update ETA (simplified logic)
        queueStatus.eta_minutes = Math.max(0, queueStatus.eta_minutes - 5);
        await this.queueRepo.save(queueStatus);

        return {
            success: true,
            updated_eta: queueStatus.eta_minutes
        };
    }

    async cancelAndRefund(reservationId: number) {
        const reservation = await this.reservationRepo.findOne({
            where: { id: reservationId },
            relations: ['user', 'parkingLot']
        });

        if (!reservation) {
            throw new Error('Reservation not found');
        }

        // Calculate refund amount (simplified - full price)
        const refundAmount = reservation.parkingLot.pricePerHour;

        // Add to wallet
        await this.walletService.addCredit(
            reservation.user.id,
            refundAmount,
            `Refund for cancelled reservation #${reservationId}`
        );

        // Remove queue status
        await this.queueRepo.delete({ reservation: { id: reservationId } });

        // Delete reservation
        await this.reservationRepo.delete(reservationId);

        return {
            success: true,
            refunded_amount: refundAmount
        };
    }
}
