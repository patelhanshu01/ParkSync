export class DateUtils {
    static addHours(date: Date, hours: number): Date {
      const result = new Date(date);
      result.setHours(result.getHours() + hours);
      return result;
    }
  
    static addMinutes(date: Date, minutes: number): Date {
      const result = new Date(date);
      result.setMinutes(result.getMinutes() + minutes);
      return result;
    }
  
    static getDifferenceInHours(start: Date, end: Date): number {
      const diffMs = end.getTime() - start.getTime();
      return diffMs / (1000 * 60 * 60);
    }
  
    static getDifferenceInMinutes(start: Date, end: Date): number {
      const diffMs = end.getTime() - start.getTime();
      return diffMs / (1000 * 60);
    }
  
    static isOverlapping(
      start1: Date,
      end1: Date,
      start2: Date,
      end2: Date
    ): boolean {
      return start1 < end2 && start2 < end1;
    }
  
    static formatDuration(hours: number): string {
      const h = Math.floor(hours);
      const m = Math.round((hours - h) * 60);
      return `${h}h ${m}m`;
    }
  }