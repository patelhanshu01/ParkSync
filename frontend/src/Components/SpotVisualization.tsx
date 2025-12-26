import React, { useState } from 'react';
import { ParkingSpot } from '../types/Parking';

interface SpotVisualizationProps {
    spots: ParkingSpot[];
    onSpotClick?: (spot: ParkingSpot) => void;
    selectedSpotId?: number;
}

const SPOT_THEME = {
    available: { color: '#00F5FF', glow: 'rgba(0, 245, 255, 0.4)', icon: null },
    occupied: { color: '#FF2E63', glow: 'rgba(255, 46, 99, 0.2)', icon: 'car' },
    reserved: { color: '#FFE05D', glow: 'rgba(255, 224, 93, 0.3)', icon: 'lock' },
    ev_charging: { color: '#00D1FF', glow: 'rgba(0, 209, 255, 0.5)', icon: 'bolt' },
    accessibility: { color: '#A683E3', glow: 'rgba(166, 131, 227, 0.5)', icon: 'wheelchair' }
};

const CarIcon = ({ color }: { color: string }) => (
    <svg viewBox="0 0 100 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '80%', height: 'auto', display: 'block', margin: '0 auto' }}>
        <rect x="15" y="10" width="70" height="40" rx="12" fill={color} fillOpacity="0.8" />
        <rect x="25" y="15" width="20" height="30" rx="4" fill="rgba(0,0,0,0.4)" />
        <rect x="55" y="15" width="20" height="30" rx="4" fill="rgba(0,0,0,0.4)" />
        <rect x="20" y="5" width="10" height="4" rx="2" fill="white" fillOpacity="0.5" />
        <rect x="70" y="5" width="10" height="4" rx="2" fill="white" fillOpacity="0.5" />
    </svg>
);

const BoltIcon = () => (
    <svg viewBox="0 0 24 24" fill="#00D1FF" width="14" height="14"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
);

const WheelchairIcon = () => (
    <svg viewBox="0 0 24 24" fill="#A683E3" width="14" height="14"><circle cx="12" cy="4" r="2" /><path d="M19 13v-2c-1.1 0-2 .9-2 2v4.17c0 .55-.45 1-1 1s-1-.45-1-1V13c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v4h2v5h2v-5h2v5h2v-6.5c2.49 0 4.5-2.01 4.5-4.5z" /></svg>
);

const ArrowIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
        <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
);

const SpotVisualization: React.FC<SpotVisualizationProps> = ({ spots, onSpotClick, selectedSpotId }) => {

    const groupedByFloor = spots.reduce((acc, spot) => {
        const floor = spot.floor_level || 1;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(spot);
        return acc;
    }, {} as Record<number, ParkingSpot[]>);

    const floors = Object.keys(groupedByFloor).map(Number).sort((a, b) => a - b);
    const [activeFloor, setActiveFloor] = useState(floors[0] || 1);

    const displaySpots = groupedByFloor[activeFloor] || [];
    const selectedSpot = displaySpots.find(s => s.id === selectedSpotId);

    // Organize spots into two columns for the "Road" look
    const leftColumn = displaySpots.filter((_, i) => i % 2 === 0);
    const rightColumn = displaySpots.filter((_, i) => i % 2 !== 0);

    return (
        <div style={{ position: 'relative' }}>
            <div style={{
                backgroundColor: '#0A0E14',
                borderRadius: '16px',
                padding: '24px',
                color: 'white',
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '30px 30px',
                border: '1px solid #1E2633',
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                overflow: 'hidden'
            }}>
                {/* Floor Selector */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', backgroundColor: '#161B22', padding: '6px', borderRadius: '14px', width: 'fit-content', margin: '0 auto 40px auto', border: '1px solid #2D333B' }}>
                    {floors.map(floor => (
                        <button
                            key={floor}
                            onClick={() => setActiveFloor(floor)}
                            style={{
                                padding: '12px 28px',
                                backgroundColor: activeFloor === floor ? '#00F5FF' : 'transparent',
                                color: activeFloor === floor ? '#000' : '#8B949E',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: '800',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: activeFloor === floor ? '0 0 25px rgba(0, 245, 255, 0.5)' : 'none',
                                transform: activeFloor === floor ? 'scale(1.05)' : 'scale(1)'
                            }}
                        >
                            {floor}{floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th'} Floor
                        </button>
                    ))}
                </div>

                {/* Layout Grid */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '100px', // Wider road
                    position: 'relative',
                    padding: '20px 0'
                }}>
                    {/* Animated Road Lane Marking */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '40px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'space-around',
                        pointerEvents: 'none',
                        opacity: 0.5
                    }}>
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="road-arrow" style={{ animation: `pulse-opacity 2s infinite ${i * 0.4}s` }}>
                                <ArrowIcon />
                            </div>
                        ))}
                    </div>

                    {/* Left Column */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 65px)', gap: '20px' }}>
                        {leftColumn.map(spot => renderSpot(spot, (s) => onSpotClick?.(s), selectedSpotId))}
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 65px)', gap: '20px' }}>
                        {rightColumn.map(spot => renderSpot(spot, (s) => onSpotClick?.(s), selectedSpotId))}
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginTop: '48px', flexWrap: 'wrap', borderTop: '1px solid #1E2633', paddingTop: '24px' }}>
                    {Object.entries(SPOT_THEME).map(([status, theme]) => (
                        <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#8B949E' }}>
                            <div style={{ width: '14px', height: '14px', backgroundColor: theme.color, borderRadius: '4px', boxShadow: `0 0 10px ${theme.glow}` }} />
                            <span style={{ textTransform: 'capitalize' }}>{status.replace('_', ' ')}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Unique Overlay: Route Overview Panel (Inspired by Image 2) */}
            {selectedSpot && (
                <div style={{
                    position: 'absolute',
                    top: '100px',
                    right: '-20px',
                    width: '180px',
                    backgroundColor: 'rgba(22, 27, 34, 0.95)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid #00F5FF',
                    boxShadow: '0 0 30px rgba(0, 245, 255, 0.2)',
                    zIndex: 10,
                    animation: 'slide-in-right 0.5s ease'
                }}>
                    <div style={{ color: '#00F5FF', fontSize: '12px', fontWeight: '800', marginBottom: '12px', letterSpacing: '1px' }}>SPOT S-{selectedSpot.spot_number}</div>
                    <div style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '16px' }}>Selected</div>

                    <div style={{ display: 'grid', gap: '12px' }}>
                        <div style={{ fontSize: '11px', color: '#8B949E' }}>
                            Distance from Entry
                            <div style={{ fontSize: '16px', color: 'white', fontWeight: '700' }}>42m</div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#8B949E' }}>
                            Estimated Arrival
                            <div style={{ fontSize: '16px', color: '#00F5FF', fontWeight: '700' }}>1.5 min</div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-opacity {
                    0% { opacity: 0.1; transform: translateY(-5px); }
                    50% { opacity: 0.6; transform: translateY(0); }
                    100% { opacity: 0.1; transform: translateY(5px); }
                }
                @keyframes slide-in-right {
                    from { opacity: 0; transform: translateX(30px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .road-arrow { transition: all 0.3s ease; }
            `}</style>
        </div>
    );
};

const renderSpot = (spot: ParkingSpot, onClick: (spot: ParkingSpot) => void, selectedId?: number) => {
    const isSelected = selectedId === spot.id;
    const isAvailable = spot.status === 'available';

    return (
        <div
            key={spot.id}
            onClick={() => isAvailable && onClick(spot)}
            style={{
                width: '65px',
                height: '85px',
                backgroundColor: isSelected ? 'rgba(0, 245, 255, 0.15)' : '#161B22',
                borderRadius: '10px',
                border: `2px solid ${isSelected ? '#00F5FF' : isAvailable ? 'rgba(0, 245, 255, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: isAvailable ? 'pointer' : (spot.status === 'reserved' ? 'not-allowed' : 'default'),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: isSelected ? '0 0 25px rgba(0, 245, 255, 0.3), inset 0 0 10px rgba(0, 245, 255, 0.1)' : 'none',
                opacity: isAvailable || isSelected ? 1 : 0.6,
                transform: isSelected ? 'scale(1.1) translateY(-5px)' : 'none',
                overflow: 'hidden',
                zIndex: isSelected ? 5 : 1
            }}
        >
            {/* Spot Label (Image 3 inspired) */}
            <div style={{
                position: 'absolute',
                top: '4px',
                left: '6px',
                fontSize: '10px',
                fontWeight: '800',
                color: isAvailable ? 'rgba(0, 245, 255, 0.6)' : 'rgba(255,255,255,0.2)',
                zIndex: 2
            }}>
                {String.fromCharCode(65 + (spot.floor_level || 1))}{spot.spot_number.toString().padStart(2, '0')}
            </div>

            {/* Main Content */}
            <div style={{ zIndex: 1, textAlign: 'center', width: '100%' }}>
                {spot.status === 'occupied' ? (
                    <CarIcon color={isSelected ? '#00F5FF' : '#444'} />
                ) : spot.status === 'reserved' ? (
                    <div style={{ fontSize: '14px', filter: 'drop-shadow(0 0 5px #FFE05D)' }}>🔒</div>
                ) : isSelected ? (
                    <div style={{ color: '#00F5FF', fontWeight: '900', fontSize: '24px', filter: 'drop-shadow(0 0 8px #00F5FF)' }}>✓</div>
                ) : (
                    <div style={{
                        color: isAvailable ? '#00F5FF' : '#555',
                        fontWeight: '900',
                        fontSize: '18px',
                        opacity: isAvailable ? 0.8 : 0.4
                    }}>
                        {spot.spot_number}
                    </div>
                )}
            </div>

            {/* Feature Icons */}
            <div style={{ position: 'absolute', bottom: '6px', display: 'flex', gap: '4px' }}>
                {spot.type === 'ev' && <BoltIcon />}
                {spot.type === 'accessibility' && <WheelchairIcon />}
            </div>

            {/* Reserved badge with full info (date, start/end, duration) */}
            {spot.nextReservation && (() => {
                const start = new Date(spot.nextReservation!.startTime);
                const end = new Date(spot.nextReservation!.endTime);
                const now = new Date();
                if (end > now) {
                    const dateStr = start.toLocaleDateString();
                    const startTimeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const durationHours = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100;
                    const display = `${dateStr} ${startTimeStr} - ${endTimeStr}`;
                    return (
                        <div
                            title={`Reserved from ${start.toLocaleString()} for ${durationHours} hour${durationHours !== 1 ? 's' : ''}`}
                            style={{
                                position: 'absolute',
                                top: '6px',
                                right: '6px',
                                backgroundColor: '#FFE05D',
                                color: '#000',
                                padding: '6px 8px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                boxShadow: '0 4px 10px rgba(255,224,93,0.25)',
                                textAlign: 'center',
                                lineHeight: '1.1',
                                minWidth: '120px'
                            }}
                        >
                            <div style={{ fontSize: '10px', fontWeight: 900 }}>Reserved</div>
                            <div style={{ fontSize: '10px', fontWeight: 700 }}>{display}</div>
                            {(() => {
                                const minutesRemaining = Math.ceil((end.getTime() - now.getTime()) / 60000);
                                if (minutesRemaining > 0) {
                                    const availabilityStr = minutesRemaining < 60 ? `${minutesRemaining} min` : `${Math.ceil(minutesRemaining / 60)} hr`;
                                    return (
                                        <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
                                            Available in {availabilityStr}
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    );
                }
                return null;
            })()}

            {/* Neon Glow Bar */}
            {isSelected && (
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    backgroundColor: '#00F5FF',
                    boxShadow: '0 -5px 15px #00F5FF'
                }} />
            )}
        </div>
    );
};

export default SpotVisualization;
