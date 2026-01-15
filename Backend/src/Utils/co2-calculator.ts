export interface CO2Result {
    co2Grams: number;
    savingsPercent: number;
    isEcoChoice: boolean;
  }
  
  export interface EmissionFactor {
    region: string;
    gCO2PerKm: number;
    gCO2PerKWh: number;
  }
  
  export class CO2Calculator {
    // Default emission factors
    private defaultEmissionFactor: EmissionFactor = {
      region: 'US',
      gCO2PerKm: 250, // Average ICE vehicle
      gCO2PerKWh: 500, // Grid intensity
    };
  
    calculateICEEmissions(distanceKm: number, circulingKm: number = 0): number {
      return (distanceKm + circulingKm) * this.defaultEmissionFactor.gCO2PerKm;
    }
  
    calculateEVEmissions(distanceKm: number, efficiencyKWhPerKm: number = 0.2): number {
      return distanceKm * efficiencyKWhPerKm * this.defaultEmissionFactor.gCO2PerKWh;
    }
  
    calculateSavings(optionCO2: number, maxCO2: number): number {
      if (maxCO2 === 0) return 0;
      return ((maxCO2 - optionCO2) / maxCO2) * 100;
    }
  
  rankByEmissions(options: Array<{ id: number; distanceKm: number; circlingKm?: number }>): CO2Result[] {
      const count = options.length;
      if (count === 0) return [];

      const co2ByIndex = new Array<number>(count);
      let maxCO2 = -Infinity;
      let minCO2 = Infinity;

      for (let i = 0; i < count; i++) {
        const opt = options[i];
        const co2 = this.calculateICEEmissions(opt.distanceKm, opt.circlingKm ?? 0.5);
        co2ByIndex[i] = co2;
        if (co2 > maxCO2) maxCO2 = co2;
        if (co2 < minCO2) minCO2 = co2;
      }

      const results = new Array<CO2Result>(count);
      for (let i = 0; i < count; i++) {
        const co2 = co2ByIndex[i];
        results[i] = {
          co2Grams: co2,
          savingsPercent: this.calculateSavings(co2, maxCO2),
          isEcoChoice: co2 === minCO2,
        };
      }

      return results;
    }
  }
