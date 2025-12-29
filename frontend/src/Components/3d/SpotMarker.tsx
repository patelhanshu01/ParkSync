import React, { useMemo } from 'react';
import { ParkingSpot } from '../../types/Parking';
import { Text } from '@react-three/drei';

// Helper to generate a random car color
const getRandomCarColor = () => {
    const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#ecf0f1', '#34495e', '#95a5a6'];
    return colors[Math.floor(Math.random() * colors.length)];
};

// Simple Low Poly 3D Car
const LowPolyCar = ({ color }: { color: string }) => (
    <group>
        {/* Car Body (Chassis) */}
        <mesh position={[0, 3.5, 0]} castShadow receiveShadow>
            <boxGeometry args={[16, 4, 34]} />
            <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
        </mesh>

        {/* Car Cabin (Top) */}
        <mesh position={[0, 7, -2]} castShadow receiveShadow>
            <boxGeometry args={[14, 3, 18]} />
            <meshStandardMaterial color="#2c3e50" roughness={0.2} metalness={0.5} />
        </mesh>

        {/* Windows (Simple block representation) */}
        <mesh position={[0, 7.1, -2]}>
            <boxGeometry args={[14.2, 2.8, 18.2]} />
            <meshStandardMaterial color="#111" roughness={0.0} metalness={0.9} />
        </mesh>

        {/* Wheels */}
        <mesh position={[-7, 1.5, 9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 2, 16]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[7, 1.5, 9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 2, 16]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[-7, 1.5, -9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 2, 16]} />
            <meshStandardMaterial color="#333" />
        </mesh>
        <mesh position={[7, 1.5, -9]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[2, 2, 2, 16]} />
            <meshStandardMaterial color="#333" />
        </mesh>

        {/* Headlights (Yellow/White) - Front */}
        <mesh position={[-5, 3.5, 17.1]}>
            <planeGeometry args={[2.5, 1.5]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
        </mesh>
        <mesh position={[5, 3.5, 17.1]}>
            <planeGeometry args={[2.5, 1.5]} />
            <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={5} />
        </mesh>

        {/* Taillights (Red) - Back */}
        <mesh position={[-5, 3.5, -17.1]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[3, 1.5]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
        </mesh>
        <mesh position={[5, 3.5, -17.1]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[3, 1.5]} />
            <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={3} />
        </mesh>
    </group>
);


interface SpotMarkerProps {
    spot: ParkingSpot;
    isSelected: boolean;
    onClick: () => void;
}

const SpotMarker: React.FC<SpotMarkerProps> = ({ spot, isSelected, onClick }) => {
    // Determine positions
    const x = Number(spot.position_x);
    const z = Number(spot.position_y); // "y" in DB maps to "z" in 3D usually

    // Standard parking spot dimensions
    const width = 22;  // ~ 2.2 meters scaled x10
    const depth = 40;  // ~ 4.0 meters scaled x10

    const isOccupied = spot.status === 'occupied';

    // Memoize random car color so it doesn't change on re-renders
    const carColor = useMemo(() => getRandomCarColor(), []);

    // Visual State Colors
    // Reference image has reddish/pink pavement for spots
    const pavementColor = isSelected ? '#3498db' : (spot.type === 'accessibility' ? '#9b59b6' : '#e57373');
    // #e57373 is a nice faded red/pink pavement color

    return (
        <group position={[x, 0, z]}>

            {/* 1. The Pavement (Red Spot) */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.1, 0]} // Slightly above ground
                receiveShadow
                onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                }}
            >
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial
                    color={pavementColor}
                    roughness={0.9}
                    metalness={0.0}
                    polygonOffset
                    polygonOffsetFactor={-1} // Ensure it renders on top of asphalt
                />
            </mesh>

            {/* 2. White Lines (Stripes) */}
            {/* Left Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-width / 2, 0.15, 0]}>
                <planeGeometry args={[0.5, depth]} />
                <meshBasicMaterial color="white" />
            </mesh>
            {/* Right Line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0.15, 0]}>
                <planeGeometry args={[0.5, depth]} />
                <meshBasicMaterial color="white" />
            </mesh>
            {/* Top Line (Back) */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, -depth / 2]}>
                <planeGeometry args={[width, 0.5]} />
                <meshBasicMaterial color="white" />
            </mesh>


            {/* 3. Occupied State: Render Car */}
            {isOccupied && (
                <LowPolyCar color={carColor} />
            )}

            {/* 4. Vacant State: Spot Number */}
            {!isOccupied && (
                <Text
                    position={[0, 0.5, 10]} // Placed on the ground towards the front
                    rotation={[-Math.PI / 2, 0, 0]} // Flat on ground
                    fontSize={6}
                    color="white"
                    anchorX="center"
                    anchorY="middle"
                    fillOpacity={0.9}
                >
                    {spot.spot_number}
                </Text>
            )}

            {/* 5. Selection Highlight (Hovering Chevron/Indicator) */}
            {isSelected && (
                <mesh position={[0, 15, 0]} rotation={[0, 0, 0]}>
                    <coneGeometry args={[4, 8, 4]} />
                    <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={2} />
                </mesh>
            )}

            {/* Type Icons (Simple floating spheres/colors for EV/Handicap if not standard) */}
            {spot.type === 'ev' && (
                <Text
                    position={[0, 20, 0]}
                    fontSize={6}
                    color="#9C27B0"
                    anchorX="center"
                    anchorY="middle"
                >
                    ♿
                </Text>
            )}
        </group>
    );
};

export default SpotMarker;
