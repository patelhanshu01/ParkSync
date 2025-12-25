import React from 'react';

export type BadgeType = 'cheapest' | 'closest' | 'ev' | 'best_value' | 'covered' | 'cctv';

interface FeatureBadgeProps {
    type: BadgeType;
    value?: string | number;
}

const BADGE_CONFIG: Record<BadgeType, { icon: string; label: string; bgColor: string; textColor: string; borderColor: string }> = {
    cheapest: { icon: '💸', label: 'Cheapest', bgColor: '#fff3cd', textColor: '#856404', borderColor: '#ffeeba' },
    closest: { icon: '🚶', label: 'Closest', bgColor: '#d1ecf1', textColor: '#0c5460', borderColor: '#bee5eb' },
    ev: { icon: '🔌', label: 'EV Compatible', bgColor: '#d4edda', textColor: '#155724', borderColor: '#c3e6cb' },
    best_value: { icon: '⭐', label: 'Best Value', bgColor: '#f8d7da', textColor: '#721c24', borderColor: '#f5c6cb' },
    covered: { icon: '🏠', label: 'Covered', bgColor: '#e2e3e5', textColor: '#383d41', borderColor: '#d6d8db' },
    cctv: { icon: '📹', label: 'CCTV', bgColor: '#e7f3ff', textColor: '#004085', borderColor: '#b8daff' }
};

const FeatureBadge: React.FC<FeatureBadgeProps> = ({ type, value }) => {
    const config = BADGE_CONFIG[type];

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            backgroundColor: config.bgColor,
            color: config.textColor,
            border: `1px solid ${config.borderColor}`,
            margin: '4px'
        }}>
            <span>{config.icon}</span>
            <span style={{ marginLeft: '4px' }}>{config.label}</span>
            {value && <span style={{ marginLeft: '4px' }}>({value})</span>}
        </div>
    );
};

export default FeatureBadge;
