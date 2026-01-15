import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity()
@Index('idx_saved_card_user', ['user'])
export class SavedCard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  brand: string;

  @Column({ length: 4 })
  last4: string;

  @Column()
  expMonth: number;

  @Column()
  expYear: number;

  @Column({ nullable: true })
  cardholder?: string;

  @Column({ default: false })
  isDefault: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.savedCards, { onDelete: 'CASCADE' })
  user: User;
}
