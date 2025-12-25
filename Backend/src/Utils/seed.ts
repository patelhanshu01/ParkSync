import { AppDataSource } from '../config/database.config';
import { ParkingLot } from '../Models/parking-lot.entity';
import { EVCharger } from '../Models/ev-charger.entity';
import { ParkingSpot } from '../Models/parking-spot.entity';

async function seedDatabase() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Database connected');

        const parkingLotRepo = AppDataSource.getRepository(ParkingLot);
        const evChargerRepo = AppDataSource.getRepository(EVCharger);
        const spotRepo = AppDataSource.getRepository(ParkingSpot);


        // Create parking lots with varied data
        const lot1 = parkingLotRepo.create({
            name: 'Downtown Mall Parking',
            location: 'Main Street',
            pricePerHour: 10,
            isAvailable: true,
            totalSpots: 50,
            availableSpots: 25,
            co2_estimated_g: 180,
            co2_savings_pct: 28,
            is_lowest_co2: false,
            has_ev_charging: true,
            is_covered: true,
            has_cctv: true,
            is_free: false,
            has_accessibility: true,
            height_limit_m: 2.5,
            latitude: 40.7128,
            longitude: -74.0060,
            distance_km: 1.2,
            rating: 4.5,
            best_value_score: 85
        });
        await parkingLotRepo.save(lot1);

        const lot2 = parkingLotRepo.create({
            name: 'City Center Garage',
            location: 'Broadway Avenue',
            pricePerHour: 15,
            isAvailable: true,
            totalSpots: 100,
            availableSpots: 60,
            co2_estimated_g: 250,
            co2_savings_pct: 12,
            is_lowest_co2: false,
            has_ev_charging: true,
            is_covered: true,
            has_cctv: true,
            is_free: false,
            has_accessibility: true,
            height_limit_m: 2.2,
            latitude: 40.7150,
            longitude: -74.0070,
            distance_km: 0.8,
            rating: 4.7,
            best_value_score: 90
        });
        await parkingLotRepo.save(lot2);

        const lot3 = parkingLotRepo.create({
            name: 'Stadium Parking Plaza',
            location: 'Sports Complex Drive',
            pricePerHour: 8,
            isAvailable: true,
            totalSpots: 200,
            availableSpots: 150,
            co2_estimated_g: 150,
            co2_savings_pct: 35,
            is_lowest_co2: true,
            has_ev_charging: false,
            is_covered: false,
            has_cctv: true,
            is_free: false,
            has_accessibility: true,
            height_limit_m: 3.0,
            latitude: 40.7200,
            longitude: -74.0100,
            distance_km: 2.5,
            rating: 4.2,
            best_value_score: 75
        });
        await parkingLotRepo.save(lot3);

        const lot4 = parkingLotRepo.create({
            name: 'Airport Terminal 1 Parking',
            location: 'Airport Road',
            pricePerHour: 20,
            isAvailable: true,
            totalSpots: 300,
            availableSpots: 100,
            co2_estimated_g: 320,
            co2_savings_pct: 5,
            is_lowest_co2: false,
            has_ev_charging: true,
            is_covered: true,
            has_cctv: true,
            is_free: false,
            has_accessibility: true,
            height_limit_m: 2.1,
            latitude: 40.7500,
            longitude: -74.0200,
            distance_km: 5.0,
            rating: 4.8,
            best_value_score: 80
        });
        await parkingLotRepo.save(lot4);

        const lot5 = parkingLotRepo.create({
            name: 'University Campus Parking',
            location: 'College Avenue',
            pricePerHour: 5,
            isAvailable: true,
            totalSpots: 80,
            availableSpots: 40,
            co2_estimated_g: 200,
            co2_savings_pct: 20,
            is_lowest_co2: false,
            has_ev_charging: false,
            is_covered: false,
            has_cctv: false,
            is_free: true,
            has_accessibility: true,
            height_limit_m: 2.8,
            latitude: 40.7300,
            longitude: -74.0120,
            distance_km: 1.8,
            rating: 4.0,
            best_value_score: 70
        });
        await parkingLotRepo.save(lot5);

        console.log('✅ Created 5 parking lots');

        // Add EV Chargers
        const evCharger1 = evChargerRepo.create({
            connector_type: 'CCS2',
            power_kw: 50,
            cost_per_kwh: 0.35,
            availability: true,
            charger_id: 'CH-001',
            parkingLot: lot1
        });
        await evChargerRepo.save(evCharger1);

        const evCharger2 = evChargerRepo.create({
            connector_type: 'Type2',
            power_kw: 22,
            cost_per_kwh: 0.30,
            availability: true,
            charger_id: 'CH-002',
            parkingLot: lot1
        });
        await evChargerRepo.save(evCharger2);

        const evCharger3 = evChargerRepo.create({
            connector_type: 'CCS2',
            power_kw: 150,
            cost_per_kwh: 0.45,
            availability: true,
            charger_id: 'CH-003',
            parkingLot: lot2
        });
        await evChargerRepo.save(evCharger3);

        const evCharger4 = evChargerRepo.create({
            connector_type: 'NACS',
            power_kw: 250,
            cost_per_kwh: 0.50,
            availability: false,
            charger_id: 'CH-004',
            parkingLot: lot4
        });
        await evChargerRepo.save(evCharger4);

        console.log('✅ Created 4 EV chargers');

        // Add parking spots for first lot
        const spotStatuses = ['available', 'occupied', 'reserved', 'available', 'available'];
        const spotTypes = ['regular', 'regular', 'ev', 'accessibility', 'regular'];

        for (let i = 1; i <= 10; i++) {
            const spot = spotRepo.create({
                spot_number: `A${i}`,
                status: spotStatuses[i % 5],
                type: spotTypes[i % 5],
                floor_level: 1,
                position_x: (i % 5) * 100,
                position_y: Math.floor(i / 5) * 100,
                parkingLot: lot1
            });
            await spotRepo.save(spot);
        }

        // Add spots for second lot
        for (let i = 1; i <= 15; i++) {
            const spot = spotRepo.create({
                spot_number: `B${i}`,
                status: i <= 8 ? 'available' : 'occupied',
                type: i % 3 === 0 ? 'ev' : 'regular',
                floor_level: Math.floor((i - 1) / 10) + 1,
                position_x: (i % 5) * 100,
                position_y: Math.floor(i / 5) * 100,
                parkingLot: lot2
            });
            await spotRepo.save(spot);
        }

        console.log('✅ Created 25 parking spots');

        console.log('🎉 Database seeded successfully!');
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
