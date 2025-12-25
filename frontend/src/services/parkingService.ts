import { getParkingLots } from '../api/parkingApi';

export const fetchAllParkingLots = async () => {
    return await getParkingLots();
};
