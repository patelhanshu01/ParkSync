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

    // Clear existing listings for this user to ensure we only have the new residential ones
    // Skip delete if reservations reference these listings to avoid FK violations
    try {
        await listingRepo.delete({ owner: { id: user.id } });
    } catch {
        // noop
    }

    const mockListings = [
        {
            title: 'Twin Pines Driveway',
            description: 'Spacious private driveway at Twin Pines. Very safe and quiet residential area.',
            location: 'Twin Pines Cres',
            address: '136 Twin Pines Cres, Brampton, ON L7A 1N2',
            pricePerHour: 4.50,
            imageUrl: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=KSabh2BzCnuOI1TFth1Oog&cb_client=search.gws-prod.gps&w=408&h=240&yaw=112.92429&pitch=0&thumbfov=100',
            isPrivate: true,
            owner: user
        },
        {
            title: 'Allegro Dr Private Lane',
            description: 'Secure lane parking on Allegro Dr. Close to local transit and shopping.',
            location: 'Allegro Dr',
            address: '132 Allegro Dr, Brampton, ON L6Y 5X9',
            pricePerHour: 5.50,
            imageUrl: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=lBq4uF4N2dRWyPdZOeutZg&cb_client=search.gws-prod.gps&w=408&h=240&yaw=39.925533&pitch=0&thumbfov=100',
            isPrivate: true,
            owner: user
        },
        {
            title: 'Town House Crescent Spot',
            description: 'Convenient spot in Town House Crescent. Ideal for daily commuters.',
            location: 'Town House Cres',
            address: '80 Town House Crescent, Brampton, ON L6W 3C5',
            pricePerHour: 3.50,
            imageUrl: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=oHVogdi2XppXN9Ws8vXOCA&cb_client=search.gws-prod.gps&w=408&h=240&yaw=334.65805&pitch=0&thumbfov=100',
            isPrivate: true,
            owner: user
        },
        {
            title: 'Tomabrook Cres Driveway',
            description: 'Private residential driveway in Tomabrook. Quiet and secure with easy access.',
            location: 'Tomabrook Cres',
            address: '75 Tomabrook Crescent, Brampton, ON L6R 0V4',
            pricePerHour: 4.00,
            imageUrl: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=eygzHUkUXc1Hs_WdDGCVWg&cb_client=search.gws-prod.gps&w=408&h=240&yaw=134.97078&pitch=0&thumbfov=100',
            isPrivate: true,
            owner: user
        },
        {
            title: 'Bartley Bull Pkwy Premium',
            description: 'Premium driveway spot on Bartley Bull Pkwy. Wide space and very safe.',
            location: 'Bartley Bull Pkwy',
            address: '414 Bartley Bull Pkwy, Brampton, ON L6W 2V6',
            pricePerHour: 6.50,
            imageUrl: 'https://streetviewpixels-pa.googleapis.com/v1/thumbnail?panoid=w3h7HlMycH_jDeBMrLQPEw&cb_client=search.gws-prod.gps&w=408&h=240&yaw=210.80641&pitch=0&thumbfov=100',
            isPrivate: true,
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
}
