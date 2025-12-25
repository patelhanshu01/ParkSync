import { AppDataSource } from '../config/database.config';
import { ParkingLot } from '../Models/parking-lot.entity';
import { ParkingSpot } from '../Models/parking-spot.entity';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected!');

        const lotRepo = AppDataSource.getRepository(ParkingLot);
        const spotRepo = AppDataSource.getRepository(ParkingSpot);

        const lots = await lotRepo.find();
        console.log(`Found ${lots.length} parking lots.`);

        for (const lot of lots) {
            console.log(`Seeding spots for lot: ${lot.name} (ID: ${lot.id})`);

            // Clear existing spots for this lot (optional, but good for clean seed)
            await spotRepo.delete({ parkingLot: { id: lot.id } });

            const spots: ParkingSpot[] = [];
            const rows = 4;
            const colsPerSide = 5; // 5 spots on left, 5 on right per row

            // Generate a simple grid layout
            let spotCount = 1;

            for (let row = 0; row < rows; row++) {
                // Left side spots
                for (let i = 0; i < colsPerSide; i++) {
                    const spot = new ParkingSpot();
                    spot.spot_number = `A${spotCount++}`;
                    spot.status = Math.random() > 0.3 ? 'available' : 'occupied'; // 70% available
                    spot.type = Math.random() > 0.9 ? 'ev' : 'regular';
                    spot.floor_level = 1;
                    spot.position_x = i * 30; // 30 units width
                    spot.position_y = row * 60; // 60 units depth/gap
                    spot.parkingLot = lot;
                    spots.push(spot);
                }

                // Right side spots (offset by aisle width)
                for (let i = 0; i < colsPerSide; i++) {
                    const spot = new ParkingSpot();
                    spot.spot_number = `B${spotCount++}`;
                    spot.status = Math.random() > 0.3 ? 'available' : 'occupied';
                    spot.type = Math.random() > 0.9 ? 'accessibility' : 'regular';
                    spot.floor_level = 1;
                    spot.position_x = (i * 30) + 200; // 200 units gap for aisle
                    spot.position_y = row * 60;
                    spot.parkingLot = lot;
                    spots.push(spot);
                }
            }

            // Save spots
            await spotRepo.save(spots);

            // Update lot availability counts
            const availableCount = spots.filter(s => s.status === 'available').length;
            lot.totalSpots = spots.length;
            lot.availableSpots = availableCount;
            await lotRepo.save(lot);

            console.log(`  -> Created ${spots.length} spots (${availableCount} available)`);
        }

        console.log('Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
}

seed();
