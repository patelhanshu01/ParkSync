import { AppDataSource } from '../../config/database.config';
import { Payment } from '../../Models/payment.entity';

export class PaymentRepository {
  private repo = AppDataSource.getRepository(Payment);

  async getAll(): Promise<Payment[]> {
    return this.repo.find();
  }

  async getById(id: number): Promise<Payment | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<Payment>): Promise<Payment> {
    const payment = this.repo.create(data);
    return this.repo.save(payment);
  }

  async update(id: number, data: Partial<Payment>): Promise<Payment | null> {
    const payment = await this.repo.findOne({ where: { id } });
    if (!payment) return null;

    Object.assign(payment, data);
    return this.repo.save(payment);
  }

  async delete(id: number): Promise<boolean> {
    const { affected } = await this.repo.delete(id);
    return !!affected;
  }
}
