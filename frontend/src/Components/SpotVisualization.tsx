import React, { useState, useEffect } from 'react';
import { ParkingSpot } from '../types/Parking';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

interface SpotVisualizationProps {
    spots: ParkingSpot[];
    onSpotClick?: (spot: ParkingSpot) => void;
    selectedSpotId?: number;
}

const BoltIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="#00D1FF" width="14" height="14">
        <path d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);

const WheelchairIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="#A683E3" width="14" height="14">
        <circle cx="12" cy="4" r="2" />
        <path d="M19 13v-2c-1.1 0-2 .9-2 2v4.17c0 .55-.45 1-1 1s-1-.45-1-1V13c0-1.1-.9-2-2-2h-3c-1.1 0-2 .9-2 2v4h2v5h2v-5h2v5h2v-6.5c2.49 0 4.5-2.01 4.5-4.5z" />
    </svg>
);

// 1. Extract Helper Component for individual Spot
const SpotItem: React.FC<{
    spot: ParkingSpot;
    isSelected: boolean;
    isAvailable: boolean;
    onClick: (spot: ParkingSpot) => void;
}> = ({ spot, isSelected, isAvailable, onClick }) => {
    const [showTooltip, setShowTooltip] = useState(false);

    // Calculate vacancy time for occupied spots
    const getVacancyInfo = () => {
        if (spot.status === 'occupied' && spot.nextReservation) {
            const endTime = new Date(spot.nextReservation.endTime);
            const now = new Date();

            if (endTime > now) {
                const minutesRemaining = Math.ceil((endTime.getTime() - now.getTime()) / 60000);

                if (minutesRemaining < 60) {
                    return {
                        time: `${minutesRemaining}m`,
                        fullText: `Available in ${minutesRemaining} min`,
                        exactTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                } else {
                    const hoursRemaining = Math.floor(minutesRemaining / 60);
                    const mins = minutesRemaining % 60;
                    return {
                        time: mins > 0 ? `${hoursRemaining}h ${mins}m` : `${hoursRemaining}h`,
                        fullText: mins > 0 ? `Available in ${hoursRemaining}h ${mins}m` : `Available in ${hoursRemaining}h`,
                        exactTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    };
                }
            }
        }
        return null;
    };

    const vacancyInfo = getVacancyInfo();

    const getSpotColors = () => {
        // Selected spot - always distinctive blue
        if (isSelected) {
            return {
                background: '#0984e3',
                border: '3px solid #0984e3'
            };
        }

        // Logic based on Availability AND Type
        if (isAvailable) {
            // VACANT SPOTS
            if (spot.type === 'ev') {
                return {
                    background: 'rgba(0, 209, 255, 0.2)', // Light Blue Tint
                    border: '3px solid #00D1FF' // Light Blue
                };
            }
            if (spot.type === 'accessibility') {
                return {
                    background: 'rgba(166, 131, 227, 0.2)', // Purple Tint
                    border: '3px solid #A683E3' // Purple
                };
            }
            // Standard Vacant
            return {
                background: 'rgba(39, 174, 96, 0.4)', // Dark Green Tint
                border: '3px solid #27ae60' // Dark Green
            };
        } else {
            // OCCUPIED SPOTS
            if (spot.type === 'ev') {
                return {
                    background: 'rgba(214, 48, 49, 0.9)', // RED FILL
                    border: '3px solid #00D1FF' // Light Blue Border
                };
            }
            if (spot.type === 'accessibility') {
                return {
                    background: 'rgba(214, 48, 49, 0.9)', // RED FILL
                    border: '3px solid #A683E3' // Purple Border
                };
            }
            // Standard Occupied
            return {
                background: 'rgba(214, 48, 49, 0.9)', // RED FILL
                border: '3px solid #d63031' // Red Border
            };
        }
    };

    const colors = getSpotColors();

    return (
        <div
            onClick={() => isAvailable && onClick(spot)}
            style={{
                width: '160px',
                height: '80px',
                backgroundColor: colors.background,
                border: colors.border,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                cursor: isAvailable ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isSelected ? '0 8px 24px rgba(9, 132, 227, 0.4)' : 'none',
                backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
                if (isAvailable && !isSelected) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.filter = 'brightness(1.1)';
                }
                if (!isAvailable && vacancyInfo) {
                    setShowTooltip(true);
                }
            }}
            onMouseLeave={(e) => {
                if (isAvailable && !isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.filter = 'brightness(1)';
                }
                setShowTooltip(false);
            }}
        >
            {/* Spot Number */}
            < div style={{
                position: 'absolute',
                top: '8px',
                left: '12px',
                fontSize: '18px',
                color: isSelected ? 'white' : (isAvailable ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)'),
                fontWeight: '800',
                fontFamily: 'monospace'
            }}>
                {spot.spot_number}
            </div >

            {/* Status Indicator */}
            {
                spot.status === 'occupied' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <div style={{
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                        }}>
                            OCCUPIED
                        </div>
                        {vacancyInfo && (
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                fontSize: '10px',
                                fontWeight: '700',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '3px'
                            }}>
                                <span>🕒</span>
                                <span>{vacancyInfo.time}</span>
                            </div>
                        )}
                    </div>
                )
            }

            {/* Tooltip for occupied spots */}
            {
                showTooltip && vacancyInfo && (
                    <div style={{
                        position: 'absolute',
                        top: '-55px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600',
                        whiteSpace: 'nowrap',
                        zIndex: 100,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                        pointerEvents: 'none'
                    }}>
                        <div style={{ marginBottom: '2px' }}>
                            {vacancyInfo.fullText}
                        </div>
                        <div style={{ fontSize: '10px', opacity: 0.8 }}>
                            Expected at {vacancyInfo.exactTime}
                        </div>
                        {/* Tooltip arrow */}
                        <div style={{
                            position: 'absolute',
                            bottom: '-4px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid rgba(0, 0, 0, 0.9)'
                        }} />
                    </div>
                )
            }

            {
                isSelected && (
                    <div style={{
                        color: 'white',
                        fontWeight: '700',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        ✓ SELECTED
                    </div>
                )
            }

            {/* Type Icons */}
            <div style={{
                position: 'absolute',
                bottom: '8px',
                right: '8px',
                display: 'flex',
                gap: '4px',
                backgroundColor: 'rgba(0,0,0,0.3)',
                padding: '4px 6px',
                borderRadius: '6px'
            }}>
                {spot.type === 'ev' && <BoltIcon />}
                {spot.type === 'accessibility' && <WheelchairIcon />}
            </div>
        </div >
    );
};

const LegendItem: React.FC<{ color: string; label: string; icon?: React.ReactNode }> = ({ color, label, icon }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
            width: '20px',
            height: '20px',
            backgroundColor: color,
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 2px 8px ${color}40`
        }}>
            {icon && React.cloneElement(icon as React.ReactElement, { width: 12, height: 12, fill: 'white' })}
        </div>
        <span style={{ fontSize: '13px', color: '#fff', fontWeight: 500 }}>{label}</span>
    </div>
);

const SpotVisualization: React.FC<SpotVisualizationProps> = ({ spots, onSpotClick, selectedSpotId }) => {
    // 1. DEDUPLICATE SPOTS FIRST (before any hooks or returns)
    //    We need to ensure we have a stable list to derive state from.
    //    Using a ref or just memoizing could work, but since `spots` prop changes,
    //    we can just process it.
    const uniqueSpots = spots ? Array.from(new Map(spots.map(spot => [spot.spot_number, spot])).values()) : [];

    const groupedByFloor = uniqueSpots.reduce((acc, spot) => {
        const floor = spot.floor_level || 1;
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(spot);
        return acc;
    }, {} as Record<number, ParkingSpot[]>);

    const floors = Object.keys(groupedByFloor).map(Number).sort((a, b) => a - b);
    const hasMultipleFloors = floors.length > 1;

    // 2. DECLARE ALL HOOKS UNCONDITIONALLY
    const [activeFloor, setActiveFloor] = useState(1);

    // Initialize active floor when data loads
    useEffect(() => {
        if (floors.length > 0 && !floors.includes(activeFloor)) {
            setActiveFloor(floors[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [floors.join(','), activeFloor]);

    // 3. NOW HANDLE EARLY RETURNS (Conditional Rendering)
    if (!spots || spots.length === 0) {
        return (
            <div style={{
                padding: '60px',
                textAlign: 'center',
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                color: 'white'
            }}>
                <div style={{ fontSize: '18px', marginBottom: '12px' }}>No parking spots available</div>
                <div style={{ fontSize: '14px', opacity: 0.6 }}>Please check back later or select a different location</div>
            </div>
        );
    }

    const displaySpots = groupedByFloor[activeFloor] || [];

    // Sort spots alphanumerically (A1, A2, A10, B1)
    displaySpots.sort((a, b) => {
        return a.spot_number.localeCompare(b.spot_number, undefined, { numeric: true, sensitivity: 'base' });
    });

    const selectedSpot = displaySpots.find(s => s.id === selectedSpotId);

    const currentFloorIndex = floors.findIndex(f => f === activeFloor);
    const prevFloor = hasMultipleFloors && currentFloorIndex > 0 ? floors[currentFloorIndex - 1] : null;
    const nextFloor = hasMultipleFloors && currentFloorIndex < floors.length - 1 ? floors[currentFloorIndex + 1] : null;

    const toOrdinal = (n: number) => {
        const suffix = (n % 10 === 1 && n % 100 !== 11) ? 'st'
            : (n % 10 === 2 && n % 100 !== 12) ? 'nd'
                : (n % 10 === 3 && n % 100 !== 13) ? 'rd'
                    : 'th';
        return `${n}${suffix}`;
    };

    // Split into rows of 2 (left and right columns) for sequential numbering
    const rows: Array<{ left: ParkingSpot; right: ParkingSpot | null }> = [];
    for (let i = 0; i < displaySpots.length; i += 2) {
        rows.push({
            left: displaySpots[i],
            right: displaySpots[i + 1] || null
        });
    }

    return (
        <div style={{ position: 'relative', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                padding: '48px',
                color: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                minHeight: '600px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            }}>
                {/* Floor Selector */}
                {/* Header Actions: Floor Selector (Swiper) & View Toggle */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px',
                    marginBottom: '40px',
                    width: '100%',
                    maxWidth: '900px',
                    zIndex: 5
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
                            Floor {activeFloor}
                        </h2>
                    </div>

                    {/* Floor Swiper */}
                    {floors.length > 1 && (
                        <Swiper
                            spaceBetween={10}
                            slidesPerView={'auto'}
                            centeredSlides={false}
                            grabCursor={true}
                            style={{ width: '100%', padding: '4px' }}
                        >
                            {floors.map(floor => (
                                <SwiperSlide key={floor} style={{ width: 'auto' }}>
                                    <button
                                        onClick={() => setActiveFloor(floor)}
                                        style={{
                                            padding: '10px 28px',
                                            backgroundColor: activeFloor === floor ? '#0984e3' : 'rgba(255,255,255,0.1)',
                                            color: '#fff',
                                            border: activeFloor === floor ? 'none' : '1px solid rgba(255,255,255,0.2)',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            transition: 'all 0.3s',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}
                                    >
                                        Floor {floor}
                                    </button>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </div>

                {/* Content Area: 2D Grid only (3D removed) */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    position: 'relative',
                    width: '100%',
                    maxWidth: '900px',
                    padding: '20px 20px 40px'
                }}>
                    {/* Central Driving Lane */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '140px',
                        background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.03) 20%, rgba(255,255,255,0.03) 80%, transparent)',
                        borderLeft: '2px dashed rgba(255,255,255,0.2)',
                        borderRight: '2px dashed rgba(255,255,255,0.2)',
                        pointerEvents: 'none'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            fontSize: '24px',
                            opacity: 0.3
                        }}>↓</div>

                        {hasMultipleFloors && (
                            <>
                                {/* Top label */}
                                <button
                                    disabled={!prevFloor && currentFloorIndex === 0}
                                    onClick={() => prevFloor && setActiveFloor(prevFloor)}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        padding: '6px 14px',
                                        borderRadius: '999px',
                                        border: 'none',
                                        background: prevFloor ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.07)',
                                        color: 'white',
                                        fontWeight: 700,
                                        letterSpacing: '0.6px',
                                        textTransform: 'uppercase',
                                        fontSize: '11px',
                                        cursor: prevFloor ? 'pointer' : 'default',
                                        pointerEvents: prevFloor ? 'auto' : 'none'
                                    }}
                                >
                                    {currentFloorIndex === 0 ? 'ENTRY' : `${toOrdinal(prevFloor!)} floor`}
                                </button>

                                {/* Bottom label */}
                                {nextFloor && (
                                    <button
                                        onClick={() => setActiveFloor(nextFloor)}
                                        style={{
                                            position: 'absolute',
                                            bottom: '10px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            padding: '6px 14px',
                                            borderRadius: '999px',
                                            border: 'none',
                                            background: 'rgba(255,255,255,0.14)',
                                            color: 'white',
                                            fontWeight: 700,
                                            letterSpacing: '0.6px',
                                            textTransform: 'uppercase',
                                            fontSize: '11px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {`${toOrdinal(nextFloor)} floor`}
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Parking Rows */}
                    {rows.map((row, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '140px',
                            position: 'relative'
                        }}>
                            {/* Left Spot */}
                            <div style={{ width: '160px' }}>
                                {row.left && (
                                    <SpotItem
                                        spot={row.left}
                                        isSelected={selectedSpotId === row.left.id}
                                        isAvailable={row.left.status === 'available'}
                                        onClick={(s) => onSpotClick?.(s)}
                                    />
                                )}
                            </div>

                            {/* Right Spot */}
                            <div style={{ width: '160px' }}>
                                {row.right && (
                                    <SpotItem
                                        spot={row.right}
                                        isSelected={selectedSpotId === row.right.id}
                                        isAvailable={row.right.status === 'available'}
                                        onClick={(s) => onSpotClick?.(s)}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '32px',
                    marginTop: '48px',
                    flexWrap: 'wrap',
                    padding: '20px',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <LegendItem color="#27ae60" label="Available" />
                    <LegendItem color="#d63031" label="Occupied" />
                    <LegendItem color="#0984e3" label="My Selection" />
                    <LegendItem color="#6c5ce7" label="Accessibility" icon={<WheelchairIcon />} />
                    <LegendItem color="#00cec9" label="EV Charging" icon={<BoltIcon />} />
                </div>
            </div>

            {/* Selected Spot Detail Card */}
            {selectedSpot && (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                    zIndex: 10,
                    width: '260px',
                    border: '1px solid rgba(255,255,255,0.2)'
                }}>
                    <div style={{
                        fontSize: '11px',
                        fontWeight: '700',
                        color: 'rgba(255,255,255,0.7)',
                        textTransform: 'uppercase',
                        marginBottom: '8px',
                        letterSpacing: '1px'
                    }}>
                        Selected Spot
                    </div>
                    <div style={{
                        fontSize: '36px',
                        fontWeight: '900',
                        color: '#fff',
                        marginBottom: '12px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        {selectedSpot.spot_number}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        {selectedSpot.type === 'ev' && (
                            <span style={{
                                fontSize: '11px',
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <BoltIcon /> EV
                            </span>
                        )}
                        {selectedSpot.type === 'accessibility' && (
                            <span style={{
                                fontSize: '11px',
                                background: 'rgba(255,255,255,0.2)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}>
                                <WheelchairIcon /> Accessible
                            </span>
                        )}
                    </div>

                    <div style={{
                        fontSize: '28px',
                        fontWeight: '800',
                        color: '#fff',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        $3.50<span style={{ fontSize: '14px', fontWeight: 'normal', opacity: 0.8 }}>/hr</span>
                    </div>
                </div>
            )}
        </div>
    );
};


export default SpotVisualization;
