import React from 'react';
import { CO2Impact } from '../../types/CO2';

interface EcoBadgeProps {
    co2Impact: CO2Impact;
    showDetails?: boolean;
}

const EcoBadge: React.FC<EcoBadgeProps> = ({ co2Impact, showDetails = true }) => {
    const { estimated_g, savings_pct, is_lowest } = co2Impact;

    if (!is_lowest && !showDetails) return null;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: is_lowest ? '#d4edda' : '#e7f3ff',
            color: is_lowest ? '#155724' : '#004085',
            border: `1px solid ${is_lowest ? '#c3e6cb' : '#b8daff'}`,
            margin: '4px'
        }}>
            {is_lowest ? '🟢 Green Choice' : '🌍'}
            {showDetails && (
                <span style={{ marginLeft: '6px' }}>
                    {estimated_g}g CO₂
                    {savings_pct > 0 && ` | ${savings_pct.toFixed(0)}% savings`}
                </span>
            )}
        </div>
    );
};

export default EcoBadge;
