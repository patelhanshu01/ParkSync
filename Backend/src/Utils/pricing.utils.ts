export interface PricingCalculation {
    basePrice: number;
    hours: number;
    totalPrice: number;
    overtimeCharge?: number;
  }
  
  export class PricingUtils {
    calculateTotalPrice(pricePerHour: number, startTime: Date, endTime: Date): PricingCalculation {
      const durationMs = endTime.getTime() - startTime.getTime();
      const hours = Math.ceil(durationMs / (1000 * 60 * 60)); // Round up to next hour
      
      return {
        basePrice: pricePerHour,
        hours,
        totalPrice: pricePerHour * hours,
      };
    }
  
    calculateOvertimeCharge(
      pricePerHour: number,
      plannedEndTime: Date,
      actualEndTime: Date
    ): number {
      if (actualEndTime <= plannedEndTime) return 0;
  
      const overtimeMs = actualEndTime.getTime() - plannedEndTime.getTime();
      const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60));
      
      return pricePerHour * overtimeHours;
    }
  
    applyDiscount(totalPrice: number, discountPercent: number): number {
      return totalPrice * (1 - discountPercent / 100);
    }
  
    estimatePrice(
      pricePerHour: number,
      durationHours: number,
      discountPercent: number = 0
    ): number {
      const base = pricePerHour * durationHours;
      return this.applyDiscount(base, discountPercent);
    }
  }
  