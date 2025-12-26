import { AppDataSource } from './config/database.config';
import { Listing } from './Models/listing.entity';
import { User } from './Models/user.entity';

export async function seedMarketplace() {
    const listingRepo = AppDataSource.getRepository(Listing);
    const userRepo = AppDataSource.getRepository(User);

    // Get or create a default user to own the listings
    let user = await userRepo.findOne({ where: { email: 'demo@parksync.com' } });
    if (!user) {
        user = userRepo.create({
            name: 'Demo Owner',
            email: 'demo@parksync.com',
            password: 'password123' // In a real app, this should be hashed
        });
        await userRepo.save(user);
    }

    const mockListings = [
        {
            title: 'Premium City Driveway',
            description: 'A clean, well-lit driveway in the heart of the city. Perfect for shoppers and theater-goers.',
            location: 'Downtown',
            address: '123 Maple Ave, Toronto, ON',
            pricePerHour: 15.00,
            imageUrl: '/mock-images/parking_lot_1.png',
            isPrivate: true,
            owner: user
        },
        {
            title: 'Tech Central Underground',
            description: 'State-of-the-art underground parking with EV charging and 24/7 security.',
            location: 'Tech District',
            address: '456 Innovation Blvd, Toronto, ON',
            pricePerHour: 25.00,
            imageUrl: '/mock-images/parking_lot_2.png',
            isPrivate: false,
            owner: user
        },
        {
            title: 'Avenue Mall Surface Lot',
            description: 'Spacious surface parking right next to the shopping center. Easy entry and exit.',
            location: 'Midtown',
            address: '789 Business Rd, Toronto, ON',
            pricePerHour: 10.00,
            imageUrl: '/mock-images/parking_lot_3.png',
            isPrivate: false,
            owner: user
        },
        {
            title: 'Luxury Heights Private Spot',
            description: 'Exclusive spot in a high-rise residential building. Climate controlled and ultra-secure.',
            location: 'Lakeshore',
            address: '101 Skyline Dr, Toronto, ON',
            pricePerHour: 30.00,
            imageUrl: '/mock-images/parking_lot_4.png',
            isPrivate: true,
            owner: user
        },
        {
            title: 'Eco-Park & Charge',
            description: 'The greenest choice in the city. Features solar canopies and high-speed EV chargers.',
            location: 'West End',
            address: '202 Sustain Way, Toronto, ON',
            pricePerHour: 12.00,
            imageUrl: '/mock-images/parking_lot_5.png',
            isPrivate: false,
            owner: user
        }
    ];

    for (const l of mockListings) {
        const existing = await listingRepo.findOne({ where: { title: l.title } });
        if (!existing) {
            const newListing = listingRepo.create(l);
            await listingRepo.save(newListing);
        }
    }

    console.log('Marketplace seeded with 5 mock listings.');
}
