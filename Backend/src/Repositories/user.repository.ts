import { AppDataSource } from '../config/database.config';
import { User } from '../Models/user.entity';

export class UserRepository {
  private repo = AppDataSource.getRepository(User);

  async getAll(): Promise<User[]> {
    return this.repo.find();
  }

  async getById(id: number): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    const user = await this.repo.findOne({ where: { id } });
    if (!user) return null;

    Object.assign(user, data);
    return this.repo.save(user);
  }

  async delete(id: number): Promise<boolean> {
    const { affected } = await this.repo.delete(id);
    return !!affected;
  }
}
