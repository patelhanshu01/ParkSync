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


        // Create parking lots with varied data and multiple floors for key venues
        const lots = [
            parkingLotRepo.create({
                name: 'Downtown Mall Parking',
                location: 'Main Street',
                pricePerHour: 10,
                isAvailable: true,
                totalSpots: 120,
                floors: 3,
                availableSpots: 60,
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
            }),
            parkingLotRepo.create({
                name: 'City Center Garage',
                location: 'Broadway Avenue',
                pricePerHour: 15,
                isAvailable: true,
                totalSpots: 180,
                floors: 4,
                availableSpots: 90,
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
            }),
            parkingLotRepo.create({
                name: 'Stadium Parking Plaza',
                location: 'Sports Complex Drive',
                pricePerHour: 8,
                isAvailable: true,
                totalSpots: 240,
                floors: 3,
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
            }),
            parkingLotRepo.create({
                name: 'Airport Terminal 1 Parking',
                location: 'Airport Road',
                pricePerHour: 20,
                isAvailable: true,
                totalSpots: 450,
                floors: 5,
                availableSpots: 180,
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
            }),
            parkingLotRepo.create({
                name: 'Regional Hospital Parking',
                location: 'Healthway Blvd',
                pricePerHour: 12,
                isAvailable: true,
                totalSpots: 220,
                floors: 4,
                availableSpots: 130,
                co2_estimated_g: 210,
                co2_savings_pct: 18,
                is_lowest_co2: false,
                has_ev_charging: true,
                is_covered: true,
                has_cctv: true,
                is_free: false,
                has_accessibility: true,
                height_limit_m: 2.4,
                latitude: 40.741,
                longitude: -74.014,
                distance_km: 3.4,
                rating: 4.6,
                best_value_score: 82
            }),
            parkingLotRepo.create({
                name: 'Central Bus Terminal Garage',
                location: 'Transit Loop',
                pricePerHour: 7,
                isAvailable: true,
                totalSpots: 160,
                floors: 3,
                availableSpots: 90,
                co2_estimated_g: 190,
                co2_savings_pct: 22,
                is_lowest_co2: false,
                has_ev_charging: false,
                is_covered: true,
                has_cctv: true,
                is_free: false,
                has_accessibility: true,
                height_limit_m: 2.6,
                latitude: 40.705,
                longitude: -74.001,
                distance_km: 1.5,
                rating: 4.1,
                best_value_score: 74
            }),
            parkingLotRepo.create({
                name: 'Riverside Park Deck',
                location: 'Parkside Drive',
                pricePerHour: 6,
                isAvailable: true,
                totalSpots: 140,
                floors: 2,
                availableSpots: 80,
                co2_estimated_g: 160,
                co2_savings_pct: 30,
                is_lowest_co2: true,
                has_ev_charging: false,
                is_covered: false,
                has_cctv: false,
                is_free: true,
                has_accessibility: true,
                height_limit_m: 2.9,
                latitude: 40.733,
                longitude: -74.02,
                distance_km: 2.2,
                rating: 4.0,
                best_value_score: 72
            }),
            parkingLotRepo.create({
                name: 'Skyline Hotel Parking',
                location: 'Harbor Ave',
                pricePerHour: 18,
                isAvailable: true,
                totalSpots: 200,
                floors: 3,
                availableSpots: 120,
                co2_estimated_g: 240,
                co2_savings_pct: 14,
                is_lowest_co2: false,
                has_ev_charging: true,
                is_covered: true,
                has_cctv: true,
                is_free: false,
                has_accessibility: true,
                height_limit_m: 2.2,
                latitude: 40.709,
                longitude: -74.013,
                distance_km: 0.9,
                rating: 4.3,
                best_value_score: 78
            }),
            parkingLotRepo.create({
                name: 'Casino Plaza Parking',
                location: 'Luck Street',
                pricePerHour: 16,
                isAvailable: true,
                totalSpots: 260,
                floors: 5,
                availableSpots: 160,
                co2_estimated_g: 230,
                co2_savings_pct: 16,
                is_lowest_co2: false,
                has_ev_charging: true,
                is_covered: true,
                has_cctv: true,
                is_free: false,
                has_accessibility: true,
                height_limit_m: 2.3,
                latitude: 40.726,
                longitude: -74.017,
                distance_km: 2.9,
                rating: 4.4,
                best_value_score: 79
            })
        ];

        await parkingLotRepo.save(lots);

        console.log(`✅ Created ${lots.length} parking lots`);

        // Add EV Chargers for select lots
        const [mall, city, stadium, airport, hospital, busTerminal, park, hotel, casino] = lots;

        const chargers = [
            evChargerRepo.create({ connector_type: 'CCS2', power_kw: 50, cost_per_kwh: 0.35, availability: true, charger_id: 'CH-001', parkingLot: mall }),
            evChargerRepo.create({ connector_type: 'Type2', power_kw: 22, cost_per_kwh: 0.30, availability: true, charger_id: 'CH-002', parkingLot: mall }),
            evChargerRepo.create({ connector_type: 'CCS2', power_kw: 150, cost_per_kwh: 0.45, availability: true, charger_id: 'CH-003', parkingLot: city }),
            evChargerRepo.create({ connector_type: 'NACS', power_kw: 250, cost_per_kwh: 0.50, availability: false, charger_id: 'CH-004', parkingLot: airport }),
            evChargerRepo.create({ connector_type: 'CCS2', power_kw: 75, cost_per_kwh: 0.40, availability: true, charger_id: 'CH-005', parkingLot: hospital }),
            evChargerRepo.create({ connector_type: 'Type2', power_kw: 22, cost_per_kwh: 0.28, availability: true, charger_id: 'CH-006', parkingLot: hotel }),
            evChargerRepo.create({ connector_type: 'Type2', power_kw: 50, cost_per_kwh: 0.33, availability: true, charger_id: 'CH-007', parkingLot: casino })
        ];
        await evChargerRepo.save(chargers);

        console.log(`✅ Created ${chargers.length} EV chargers`);

        // Add parking spots for every lot with multiple floors
        const statusCycle = ['available', 'occupied', 'reserved', 'available', 'available'];
        const typeCycle = ['regular', 'regular', 'ev', 'accessibility', 'regular'];

        for (const lot of lots) {
            const perFloor = Math.max(10, Math.floor(lot.totalSpots / (lot.floors || 1)));
            const rows = 3;
            const cols = Math.max(4, Math.ceil(perFloor / rows));

            let created = 0;
            for (let floor = 1; floor <= (lot.floors || 1); floor++) {
                for (let i = 0; i < perFloor; i++) {
                    if (created >= lot.totalSpots) break;
                    const row = Math.floor(i / cols);
                    const col = i % cols;
                    const spot = spotRepo.create({
                        spot_number: `${String.fromCharCode(64 + floor)}${col + 1 + row * cols}`,
                        status: statusCycle[created % statusCycle.length],
                        type: typeCycle[created % typeCycle.length],
                        floor_level: floor,
                        position_x: col * 60,
                        position_y: row * 80,
                        parkingLot: lot
                    });
                    await spotRepo.save(spot);
                    created++;
                }
            }
        }

        console.log('✅ Created multi-floor parking spots for all lots');

        console.log('🎉 Database seeded successfully!');
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();
