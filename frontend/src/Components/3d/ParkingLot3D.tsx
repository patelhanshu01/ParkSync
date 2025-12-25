import React from 'react';
import { ParkingSpot } from '../../types/Parking';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text } from '@react-three/drei';
import SpotMarker from './SpotMarker';
import NavigationPath from './NavigationPath';


interface ParkingLot3DProps {
    spots: ParkingSpot[];
    selectedSpot: ParkingSpot | null;
    onSpotSelect: (spot: ParkingSpot) => void;
}

const ParkingLot3D: React.FC<ParkingLot3DProps> = ({ spots, selectedSpot, onSpotSelect }) => {
    const currentFloor = selectedSpot?.floor_level || 1;

    // Calculate parking lot bounds for camera positioning
    const allX = spots.map(s => Number(s.position_x) || 0);
    const allY = spots.map(s => Number(s.position_y) || 0);

    // Determine bounds with some padding
    const minX = Math.min(...allX, 0);
    const maxX = Math.max(...allX, 100);
    const minZ = Math.min(...allY, 0);
    const maxZ = Math.max(...allY, 100);

    const width = maxX - minX + 100; // Add padding
    const depth = maxZ - minZ + 100; // Add padding
    const centerX = (minX + maxX) / 2;
    const centerZ = (minZ + maxZ) / 2;

    return (
        <div style={{ width: '100%', height: '600px', backgroundColor: '#05070A', borderRadius: '16px', overflow: 'hidden', border: '1px solid #1E2633' }}>
            <Canvas shadows>
                <PerspectiveCamera makeDefault position={[centerX, 400, maxZ + 300]} fov={60} />
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.2}
                    target={[centerX, 0, centerZ]}
                />

                {/* Cinematic Lighting */}
                <ambientLight intensity={0.2} />
                <pointLight position={[centerX, 200, centerZ]} intensity={1} color="#00F5FF" />
                <spotLight
                    position={[centerX, 300, centerZ]}
                    intensity={1}
                    angle={0.6}
                    penumbra={0.5}
                    color="#fff"
                    castShadow
                />

                {/* Dark Metallic Floor */}
                <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.1, centerZ]}>
                    <planeGeometry args={[width + 400, depth + 400]} />
                    <meshStandardMaterial color="#0A0E14" roughness={0.6} metalness={0.8} />
                </mesh>

                {/* Neon Grid */}
                <gridHelper
                    args={[Math.max(width, depth) + 500, 40, "#1E2633", "rgba(0, 245, 255, 0.1)"]}
                    position={[centerX, 0.1, centerZ]}
                />

                {/* Level Title Overlay (Neon) */}
                <Text
                    position={[centerX, 120, minZ - 80]}
                    fontSize={50}
                    color="#00F5FF"
                    anchorX="center"
                    anchorY="middle"
                    font="/fonts/Inter-Bold.ttf"
                >
                    FLOOR {currentFloor}
                </Text>

                {/* Visual Walls / Boundary */}
                <group>
                    <mesh position={[centerX, 10, minZ - 100]}>
                        <boxGeometry args={[width + 200, 20, 2]} />
                        <meshStandardMaterial color="#1E2633" transparent opacity={0.5} />
                    </mesh>
                </group>

                {/* Entry Point (Neon Green) */}
                <group position={[centerX, 0, maxZ + 80]}>
                    <mesh position={[0, 1, 0]} receiveShadow>
                        <boxGeometry args={[80, 2, 50]} />
                        <meshStandardMaterial color="#111" />
                    </mesh>

                    <Text
                        position={[0, 6, 0]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={14}
                        color="#00F5FF"
                        anchorX="center"
                        anchorY="middle"
                        fontWeight="bold"
                    >
                        BLUEPRINT ENTRY
                    </Text>
                </group>

                {/* Parking Spots */}
                {spots
                    .filter(spot => spot.floor_level === currentFloor)
                    .map(spot => (
                        <SpotMarker
                            key={spot.id}
                            spot={spot}
                            isSelected={selectedSpot?.id === spot.id}
                            onClick={() => spot.status === 'available' && onSpotSelect(spot)}
                        />
                    ))}

                {/* Glowing Navigation Path */}
                {selectedSpot && (
                    <NavigationPath
                        startPosition={[centerX, 0, maxZ + 80]}
                        endPosition={[
                            Number(selectedSpot.position_x) || 0,
                            0,
                            Number(selectedSpot.position_y) || 0
                        ]}
                    />
                )}
            </Canvas>
        </div>
    );
};

export default ParkingLot3D;
