/**
 * CO2 Equivalents Utility
 * 
 * Provides conversions from grams of CO2 into relatable everyday examples.
 */

export interface CO2Equivalent {
    value: number;
    unit: string;
    description: string;
    icon: string;
}

const CONVERSIONS = {
    SMARTPHONE_CHARGE: 5, // ~5g CO2 per full charge
    LED_BULB_HOUR: 4,     // ~4g CO2 per hour of 7W LED bulb
    TREE_DAY: 60,         // ~60g CO2 absorbed by a mature tree per day (21kg/year / 365)
};

export const getCO2Equivalents = (grams: number): CO2Equivalent[] => {
    const equivalents: CO2Equivalent[] = [];

    if (grams <= 0) return equivalents;

    // Smartphone charges
    equivalents.push({
        value: Math.round(grams / CONVERSIONS.SMARTPHONE_CHARGE),
        unit: 'phone charges',
        description: 'smartphone charges',
        icon: '📱'
    });

    // LED bulb hours
    equivalents.push({
        value: Math.round(grams / CONVERSIONS.LED_BULB_HOUR),
        unit: 'bulb hours',
        description: 'hours of LED light',
        icon: '💡'
    });

    // Tree days
    equivalents.push({
        value: Number((grams / CONVERSIONS.TREE_DAY).toFixed(1)),
        unit: 'tree days',
        description: "days of a tree's CO₂ absorption",
        icon: '🌳'
    });

    return equivalents;
};

export const getRandomEquivalent = (grams: number): CO2Equivalent | null => {
    const equivalents = getCO2Equivalents(grams);
    if (equivalents.length === 0) return null;
    return equivalents[Math.floor(Math.random() * equivalents.length)];
};
