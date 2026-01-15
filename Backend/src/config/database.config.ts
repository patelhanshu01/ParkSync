import { DataSource } from 'typeorm';
import { ParkingLot } from '../Models/parking-lot.entity';
import { Payment } from '../Models/payment.entity';
import { Reservation } from '../Models/reservation.entity';
import { User } from '../Models/user.entity';
import { EVCharger } from '../Models/ev-charger.entity';
import { ParkingSpot } from '../Models/parking-spot.entity';
import { Wallet } from '../Models/wallet.entity';
import { WalletTransaction } from '../Models/wallet-transaction.entity';
import { Listing } from '../Models/listing.entity';
import { WaitlistEntry } from '../Models/waitlist-entry.entity';
import { SavedCard } from '../Models/saved-card.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const logging = false; // keep startup quiet; override by editing here if needed
const synchronize = process.env.DB_SYNC
  ? process.env.DB_SYNC.toLowerCase() === 'true'
  : true;

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'hanshupatel',
  password: process.env.DB_PASSWORD || 'Super@user',
  database: process.env.DB_NAME || 'parkingwebsite_db',
  synchronize,
  logging,
  entities: [ParkingLot, Payment, Reservation, User, EVCharger, ParkingSpot, Wallet, WalletTransaction, Listing, WaitlistEntry, SavedCard],
  migrations: [__dirname + '/../migrations/*.js'], // Use .js for compiled files
});
