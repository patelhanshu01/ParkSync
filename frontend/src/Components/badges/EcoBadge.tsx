import React, { useMemo } from 'react';
import { CO2Impact } from '../../types/CO2';
import { getRandomEquivalent } from '../../utils/co2Equivalents';

interface EcoBadgeProps {
    co2Impact: CO2Impact;
    showDetails?: boolean;
}

const EcoBadge: React.FC<EcoBadgeProps> = ({ co2Impact, showDetails = true }) => {
    const { estimated_g, savings_pct, is_lowest } = co2Impact;

    // Use useMemo to prevent the example from changing on every re-render
    const equivalent = useMemo(() => getRandomEquivalent(estimated_g), [estimated_g]);

    if (!is_lowest && !showDetails) return null;

    return (
        <div style={{
            display: 'inline-flex',
            flexDirection: 'column',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: is_lowest ? 'rgba(76, 175, 80, 0.1)' : 'rgba(33, 150, 243, 0.1)',
            color: is_lowest ? '#4caf50' : '#2196f3',
            border: `1px solid ${is_lowest ? '#4caf50' : '#2196f3'}`,
            margin: '4px',
            minWidth: 'fit-content'
        }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {is_lowest ? '🟢 Green Choice' : '🌍'}
                <span style={{ marginLeft: '6px' }}>
                    {estimated_g}g CO₂
                    {savings_pct > 0 && ` | ${savings_pct.toFixed(0)}% savings`}
                </span>
            </div>
            {showDetails && equivalent && (
                <div style={{
                    marginTop: '4px',
                    fontSize: '10px',
                    fontWeight: '400',
                    opacity: 0.8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <span>{equivalent.icon} Same as {equivalent.value} {equivalent.description}</span>
                </div>
            )}
        </div>
    );
};

export default EcoBadge;
