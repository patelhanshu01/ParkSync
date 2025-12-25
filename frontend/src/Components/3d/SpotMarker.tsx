import React, { useRef, useState } from 'react';
import { ParkingSpot } from '../../types/Parking';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface SpotMarkerProps {
    spot: ParkingSpot;
    isSelected: boolean;
    onClick: () => void;
}

const SPOT_COLORS: Record<string, string> = {
    available: '#00F5FF',      // Neon Cyan
    occupied: '#FF2E63',       // Neon Pink
    reserved: '#FFE05D',       // Neon Yellow
    ev_charging: '#00D1FF',    // Neon Light Blue
    accessibility: '#A683E3'   // Neon Purple
};

const SpotMarker: React.FC<SpotMarkerProps> = ({ spot, isSelected, onClick }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    const color = SPOT_COLORS[spot.status] || '#757575';
    const x = Number(spot.position_x) || 0;
    const z = Number(spot.position_y) || 0;
    const y = isSelected ? 3 : 0;

    const spotWidth = 25;
    const spotLength = 50;

    return (
        <group position={[x, y, z]}>
            {/* Parking Spot Box */}
            <mesh
                ref={meshRef}
                onClick={onClick}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
                castShadow
                receiveShadow
            >
                <boxGeometry args={[spotWidth, 2, spotLength]} />
                <meshStandardMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={isSelected ? 0.5 : hovered ? 0.3 : 0.1}
                    metalness={0.3}
                    roughness={0.7}
                />
            </mesh>

            {/* Selection Indicator (Neon Ring) */}
            {isSelected && (
                <mesh position={[0, 8, 0]}>
                    <torusGeometry args={[spotWidth * 0.5, 0.8, 16, 48]} />
                    <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={2} transparent opacity={0.8} />
                </mesh>
            )}

            {/* Hover Outline */}
            {hovered && spot.status === 'available' && (
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(spotWidth + 2, 4, spotLength + 2)]} />
                    <lineBasicMaterial attach="material" color="white" linewidth={2} />
                </lineSegments>
            )}

            {/* Spot Number Label */}
            <Text
                position={[0, 15, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                fontSize={8}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineWidth={1}
                outlineColor="#000000"
            >
                {spot.spot_number}
            </Text>

            {/* Type Icons */}
            {spot.type === 'ev' && (
                <Text
                    position={[0, 20, 0]}
                    fontSize={6}
                    color="#FFC107"
                    anchorX="center"
                    anchorY="middle"
                >
                    ⚡
                </Text>
            )}
            {spot.type === 'accessibility' && (
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
