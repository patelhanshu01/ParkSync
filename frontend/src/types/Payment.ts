export interface Payment {
    id?: number;
    amount: number;
    method: string;
    user: number;           // userId
    reservation: number;    // reservationId
  }
  