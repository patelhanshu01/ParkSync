import { AppDataSource } from '../config/database.config';
import { Reservation } from '../Models/reservation.entity';
import { PaymentService } from '../modules/payments/payment.service';
import { EmailService } from './email.service';
import { ValidationUtils } from '../Utils/validation.utils';

const REMINDER_LEAD_MINUTES = 10;
const TICK_INTERVAL_MS = 60 * 1000;

export class ReservationLifecycleService {
  private timer: NodeJS.Timeout | null = null;
  private paymentService = new PaymentService();
  private emailService = new EmailService();

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      this.tick().catch((error) => {
        console.error('Reservation lifecycle tick failed:', error);
      });
    }, TICK_INTERVAL_MS);

    this.tick().catch((error) => {
      console.error('Reservation lifecycle initial run failed:', error);
    });
  }

  stop() {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private async tick() {
    if (!AppDataSource.isInitialized) return;
    await this.processReminders();
    await this.processAutoExtend();
  }

  private async processReminders() {
    const repo = AppDataSource.getRepository(Reservation);
    const now = new Date();
    const windowEnd = new Date(now.getTime() + REMINDER_LEAD_MINUTES * 60 * 1000);

    const due = await repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .where('reservation.endedAt IS NULL')
      .andWhere('reservation.reminderSentAt IS NULL')
      .andWhere('reservation.startTime <= :now', { now })
      .andWhere('reservation.endTime BETWEEN :now AND :windowEnd', { now, windowEnd })
      .getMany();

    for (const reservation of due) {
      const email = reservation.contactEmail || reservation.user?.email || '';
      const name = reservation.contactName || reservation.user?.name || '';
      const recipient = name && email ? `${name} <${email}>` : email || 'unknown user';
      const appUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:5173';
      const extendUrl = `${appUrl}/my-bookings?reservationId=${reservation.id}`;

      if (!email || !ValidationUtils.isValidEmail(email)) {
        console.warn(`Reminder skipped: invalid email for reservation #${reservation.id} (${recipient})`);
        reservation.reminderSentAt = now;
        await repo.save(reservation);
        continue;
      }

      if (!this.emailService.isConfigured()) {
        console.warn(`SMTP not configured. Reminder logged for reservation #${reservation.id} (${recipient})`);
        reservation.reminderSentAt = now;
        await repo.save(reservation);
        continue;
      }

      try {
        const result = await this.emailService.sendReservationReminder({
          to: email,
          name: name || undefined,
          reservationId: reservation.id,
          endTime: reservation.endTime,
          extendUrl
        });

        if (result.sent) {
          console.log(`Reminder email sent for reservation #${reservation.id} (${recipient})`);
          reservation.reminderSentAt = now;
          await repo.save(reservation);
        } else {
          console.warn(`Reminder email skipped (${result.reason}) for reservation #${reservation.id} (${recipient})`);
        }
      } catch (error) {
        console.error(`Reminder email failed for reservation #${reservation.id} (${recipient})`, error);
      }
    }
  }

  private async processAutoExtend() {
    const repo = AppDataSource.getRepository(Reservation);
    const now = new Date();

    const due = await repo
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.user', 'user')
      .leftJoinAndSelect('reservation.parkingLot', 'parkingLot')
      .leftJoinAndSelect('reservation.listing', 'listing')
      .where('reservation.autoExtendEnabled = :enabled', { enabled: true })
      .andWhere('reservation.endedAt IS NULL')
      .andWhere('reservation.startTime <= :now', { now })
      .andWhere('reservation.endTime <= :now', { now })
      .getMany();

    for (const reservation of due) {
      const intervalMinutes = Math.max(5, reservation.autoExtendIntervalMinutes || 15);
      const capMinutes = Math.max(15, reservation.autoExtendCapMinutes || 120);
      const baseEnd = reservation.reservedEndTime || reservation.endTime;
      const baseEndDate = baseEnd instanceof Date ? baseEnd : new Date(baseEnd);
      const currentEnd = reservation.endTime instanceof Date ? reservation.endTime : new Date(reservation.endTime);
      const maxEnd = new Date(baseEndDate.getTime() + capMinutes * 60 * 1000);

      if (currentEnd >= maxEnd) {
        reservation.autoExtendEnabled = false;
        await repo.save(reservation);
        continue;
      }

      const proposedEnd = new Date(currentEnd.getTime() + intervalMinutes * 60 * 1000);
      const nextEnd = proposedEnd > maxEnd ? maxEnd : proposedEnd;
      const addedMinutes = Math.ceil((nextEnd.getTime() - currentEnd.getTime()) / 60000);

      if (addedMinutes <= 0) {
        reservation.autoExtendEnabled = false;
        await repo.save(reservation);
        continue;
      }

      const rate = Number(reservation.parkingLot?.pricePerHour ?? reservation.listing?.pricePerHour ?? 0);
      const amount = rate > 0 ? (rate * addedMinutes) / 60 : 0;

      if (amount > 0 && reservation.user?.id) {
        await this.paymentService.processPayment(amount, 'auto_extend', reservation.user.id, reservation.id);
      }

      reservation.endTime = nextEnd;
      reservation.reminderSentAt = null;
      if (!reservation.reservedEndTime) {
        reservation.reservedEndTime = baseEndDate as any;
      }
      if (nextEnd >= maxEnd) {
        reservation.autoExtendEnabled = false;
      }

      await repo.save(reservation);
    }
  }
}
