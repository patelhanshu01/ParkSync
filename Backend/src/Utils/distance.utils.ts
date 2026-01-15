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
      locations: Array<{ lat: number; lng: number; [key: string]: any }>,
      options?: { limit?: number; inPlace?: boolean }
    ): typeof locations {
      const inPlace = !!options?.inPlace;
      const limit = options?.limit;
      const target = inPlace ? locations : new Array(locations.length);

      for (let i = 0; i < locations.length; i++) {
        const loc = locations[i];
        const distance = this.calculateDistance(userLat, userLng, loc.lat, loc.lng);
        if (inPlace) {
          (loc as any).distance = distance;
          (target as any)[i] = loc;
        } else {
          (target as any)[i] = { ...loc, distance };
        }
      }

      if (limit && limit > 0 && limit < target.length) {
        const top = new Array<any>(limit);
        let size = 0;
        for (let i = 0; i < target.length; i++) {
          const item = (target as any)[i];
          let pos = size;
          while (pos > 0 && top[pos - 1].distance > item.distance) {
            if (pos < limit) top[pos] = top[pos - 1];
            pos -= 1;
          }
          if (pos < limit) {
            top[pos] = item;
            if (size < limit) size += 1;
          }
        }
        return top.slice(0, size);
      }

      return target.sort((a: any, b: any) => a.distance - b.distance);
    }
  }
  
