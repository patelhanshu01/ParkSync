import { PaymentRepository } from './payment.repository';
import { Payment } from '../../Models/payment.entity';

export class PaymentService {
  private repository = new PaymentRepository();

  constructor() { }

  async getAll(): Promise<Payment[]> {
    return this.repository.getAll();
  }

  async getById(id: number): Promise<Payment | null> {
    return this.repository.getById(id);
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    return this.repository.create(data);
  }

  async update(id: number, data: Partial<Payment>): Promise<Payment | null> {
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async processPayment(
    amount: number,
    method: string,
    userId: number,
    reservationId: number
  ): Promise<Payment> {
    return this.create({
      amount,
      method,
      user: { id: userId } as any,
      reservation: { id: reservationId } as any,
    });
  }
}
