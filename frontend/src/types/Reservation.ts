export interface Reservation {
    id?: number;
    startTime: string;
    endTime: string;
    user: number;           // userId
    parkingLot: number;     // parkingLotId
  }
  