// DEPRECATED: Queue feature removed from product. This service is retained for history only and should not be used by controllers (controllers return 404).

export class QueueService {
  private notSupported() {
    throw new Error('Queue feature has been removed from the codebase. Use reservations instead');
  }

  async getQueueStatus(_reservationId: number) {
    this.notSupported();
  }

  async reassignSpot(_reservationId: number, _preference: 'nearest' | 'cheapest' | 'lowest_co2') {
    this.notSupported();
  }

  async keepWaiting(_reservationId: number) {
    this.notSupported();
  }

  async cancelAndRefund(_reservationId: number) {
    this.notSupported();
  }
}
