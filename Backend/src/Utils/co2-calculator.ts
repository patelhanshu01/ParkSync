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
      const results = options.map(opt => ({
        id: opt.id,
        co2Grams: this.calculateICEEmissions(opt.distanceKm, opt.circlingKm || 0.5),
      }));
  
      const maxCO2 = Math.max(...results.map(r => r.co2Grams));
  
      return results.map(r => ({
        co2Grams: r.co2Grams,
        savingsPercent: this.calculateSavings(r.co2Grams, maxCO2),
        isEcoChoice: r.co2Grams === Math.min(...results.map(x => x.co2Grams)),
      }));
    }
  }