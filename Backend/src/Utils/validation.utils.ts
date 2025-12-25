export class ValidationUtils {
    static isValidEmail(email: string): boolean {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    }
  
    static isValidPhoneNumber(phone: string): boolean {
      const phoneRegex = /^\+?[\d\s-()]+$/;
      return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
    }
  
    static isPositiveNumber(value: any): boolean {
      return typeof value === 'number' && value > 0;
    }
  
    static isValidDateRange(start: Date, end: Date): boolean {
      return start < end;
    }
  
    static isValidCoordinates(lat: number, lng: number): boolean {
      return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
    }
  }
  