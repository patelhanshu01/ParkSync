import { UserRepository } from '../Repositories/user.repository';
import { User } from '../Models/user.entity';
import bcrypt from 'bcrypt';

export class UserService {
  private repository = new UserRepository();

  async getAll(): Promise<User[]> {
    return this.repository.getAll();
  }

  async getById(id: number): Promise<User | null> {
    return this.repository.getById(id);
  }

  async create(data: Partial<User>): Promise<User> {
    // Hash password before saving
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.repository.create(data);
  }

  async update(id: number, data: Partial<User>): Promise<User | null> {
    // Hash password if being updated
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    return this.repository.update(id, data);
  }

  async delete(id: number): Promise<boolean> {
    return this.repository.delete(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.getByEmail(email);
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }
}
