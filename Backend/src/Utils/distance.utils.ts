export class DistanceUtils {
    /**
     * Calculate distance between two points using Haversine formula
     * @returns distance in kilometers
     */
    static calculateDistance(
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number {
      const R = 6371; // Earth's radius in km
      const dLat = this.toRadians(lat2 - lat1);
      const dLng = this.toRadians(lng2 - lng1);
  
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(this.toRadians(lat1)) *
          Math.cos(this.toRadians(lat2)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
  
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }
  
    private static toRadians(degrees: number): number {
      return degrees * (Math.PI / 180);
    }
  
    static sortByDistance(
      userLat: number,
      userLng: number,
      locations: Array<{ lat: number; lng: number; [key: string]: any }>
    ): typeof locations {
      return locations
        .map(loc => ({
          ...loc,
          distance: this.calculateDistance(userLat, userLng, loc.lat, loc.lng),
        }))
        .sort((a, b) => a.distance - b.distance);
    }
  }
  