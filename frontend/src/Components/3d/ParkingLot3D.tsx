import React, { Suspense, useMemo } from 'react';
import { ParkingSpot } from '../../types/Parking';
import { Canvas } from '@react-three/fiber';
import {
    OrbitControls,
    PerspectiveCamera,
    Text,
    Html,
    useProgress,
    Sky,
    BakeShadows
} from '@react-three/drei';
import SpotMarker from './SpotMarker';
import NavigationPath from './NavigationPath';

interface ParkingLot3DProps {
    spots: ParkingSpot[];
    selectedSpot: ParkingSpot | null;
    onSpotSelect: (spot: ParkingSpot) => void;
    activeFloor?: number;
}

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{ color: '#333', fontWeight: 'bold', background: 'white', padding: '10px 20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                Building Lot... {progress.toFixed(0)}%
            </div>
        </Html>
    );
}

const ParkingLot3D: React.FC<ParkingLot3DProps> = ({ spots, selectedSpot, onSpotSelect, activeFloor = 1 }) => {
    const currentFloor = activeFloor;

    // Filter by floor once
    const floorSpots = useMemo(() => spots.filter(s => s.floor_level === currentFloor), [spots, currentFloor]);

    // Auto-layout spots into multiple rows/cols when coordinates are missing or cramped
    const layoutSpots = useMemo(() => {
        if (!floorSpots.length) return [] as (ParkingSpot & { layoutX: number; layoutZ: number })[];

        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;
        for (let i = 0; i < floorSpots.length; i++) {
            const x = Number(floorSpots[i].position_x) || 0;
            const z = Number(floorSpots[i].position_y) || 0;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }
        const spanX = maxX - minX;
        const spanZ = maxZ - minZ;
        const needsAutoLayout = spanX < 40 && spanZ < 40; // narrow spread means positions are missing or single-line

        if (!needsAutoLayout) {
            return floorSpots.map(s => {
                const layoutX = Number(s.position_x) || 0;
                const layoutZ = Number(s.position_y) || 0;
                return {
                    ...s,
                    layoutX,
                    layoutZ,
                    position_x: layoutX,
                    position_y: layoutZ
                };
            });
        }

        const rows = Math.max(2, Math.min(4, Math.ceil(floorSpots.length / 6)));
        const cols = Math.ceil(floorSpots.length / rows);
        const xSpacing = 26;
        const zSpacing = 46; // wider gap for drive lanes

        return floorSpots.map((s, idx) => {
            const row = Math.floor(idx / cols);
            const col = idx % cols;
            const laneOffset = row % 2 === 0 ? 0 : 10; // stagger rows a bit
            const layoutX = (col - (cols - 1) / 2) * xSpacing;
            const layoutZ = (row - (rows - 1) / 2) * zSpacing + laneOffset;
            return {
                ...s,
                layoutX,
                layoutZ,
                position_x: layoutX,
                position_y: layoutZ
            };
        });
    }, [floorSpots]);

    const layoutBounds = useMemo(() => {
        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        for (let i = 0; i < layoutSpots.length; i++) {
            const spot = layoutSpots[i];
            const x = spot.layoutX;
            const z = spot.layoutZ;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
        }

        if (!layoutSpots.length) {
            minX = 0;
            maxX = 0;
            minZ = 0;
            maxZ = 0;
        }

        const boundedMinX = Math.min(minX, -60);
        const boundedMaxX = Math.max(maxX, 60);
        const boundedMinZ = Math.min(minZ, -60);
        const boundedMaxZ = Math.max(maxZ, 60);

        const width = boundedMaxX - boundedMinX + 140;
        const depth = boundedMaxZ - boundedMinZ + 140;
        const centerX = (boundedMinX + boundedMaxX) / 2;
        const centerZ = (boundedMinZ + boundedMaxZ) / 2;
        const entranceZ = boundedMaxZ + 70;

        return { minX: boundedMinX, maxX: boundedMaxX, minZ: boundedMinZ, maxZ: boundedMaxZ, width, depth, centerX, centerZ, entranceZ };
    }, [layoutSpots]);

    const { minX, maxX, minZ, maxZ, width, depth, centerX, centerZ, entranceZ } = layoutBounds;

    const rowCenters = useMemo(() => {
        if (!layoutSpots.length) return [] as number[];
        const set = new Set<number>();
        for (let i = 0; i < layoutSpots.length; i++) {
            set.add(layoutSpots[i].layoutZ);
        }
        const rows = Array.from(set);
        rows.sort((a, b) => a - b);
        return rows;
    }, [layoutSpots]);

    const laneMeshes = useMemo(() => {
        const lanes: React.JSX.Element[] = [];
        for (let i = 0; i < rowCenters.length - 1; i++) {
            const midZ = (rowCenters[i] + rowCenters[i + 1]) / 2;
            lanes.push(
                <mesh key={`lane-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.05, midZ]}>
                    <planeGeometry args={[width + 80, 12]} />
                    <meshStandardMaterial color="#374151" roughness={0.7} />
                </mesh>
            );
        }
        return lanes;
    }, [rowCenters, centerX, width]);

    const selectedLayoutSpot = useMemo(() => {
        if (!selectedSpot) return null;
        return layoutSpots.find(s => s.id === selectedSpot.id) || null;
    }, [layoutSpots, selectedSpot]);

    return (
        <div style={{ width: '100%', height: '600px', backgroundColor: '#f0f0f0', borderRadius: '16px', overflow: 'hidden', border: '1px solid #ddd' }}>
            <Canvas shadows dpr={[1, 2]}>
                <Suspense fallback={<Loader />}>
                    {/* Realistic Environment */}
                    <Sky sunPosition={[120, 25, 90]} turbidity={4} rayleigh={2.5} mieCoefficient={0.005} mieDirectionalG={0.8} />
                    <ambientLight intensity={0.6} />
                    <directionalLight
                        position={[150, 200, 100]}
                        intensity={1.5}
                        castShadow
                        shadow-mapSize={[2048, 2048]}
                        shadow-camera-left={-width}
                        shadow-camera-right={width}
                        shadow-camera-top={depth}
                        shadow-camera-bottom={-depth}
                    />

                    <PerspectiveCamera makeDefault position={[centerX, Math.max(260, depth * 0.6), maxZ + 240]} fov={50} />
                    <OrbitControls
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                        minPolarAngle={0}
                        maxPolarAngle={Math.PI / 2.1} /* Stop before going under ground */
                        target={[centerX, 0, centerZ]}
                    />

                    {/* --- GROUND (open lot) --- */}
                    <group>
                        {/* Main ground */}
                        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.2, centerZ]}>
                            <planeGeometry args={[width + 260, depth + 260]} />
                            <meshStandardMaterial color="#2f3b4a" roughness={0.85} metalness={0.05} />
                        </mesh>

                        {/* Perimeter line */}
                        <mesh position={[centerX, 0.5, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
                            <planeGeometry args={[width + 40, depth + 40]} />
                            <meshBasicMaterial color="#4b5563" wireframe={true} transparent opacity={0.15} />
                        </mesh>

                        {/* Drive lanes between rows */}
                        {laneMeshes}
                    </group>

                    {/* Level Title (Now subtle clean text on ground) */}
                    <Text
                        position={[centerX, 1, minZ - 30]}
                        rotation={[-Math.PI / 2, 0, 0]}
                        fontSize={30}
                        color="#ffffff"
                        fillOpacity={0.4}
                        anchorX="center"
                        anchorY="middle"
                    >
                        FLOOR {currentFloor}
                    </Text>

                    {/* --- ENTRY (Boom Barrier) --- */}
                    <group position={[centerX, 0, entranceZ]}>
                        {/* Concrete Island */}
                        <mesh position={[0, 1, 0]} receiveShadow castShadow>
                            <boxGeometry args={[40, 2, 10]} />
                            <meshStandardMaterial color="#ecf0f1" />
                        </mesh>
                        {/* Barrier Post */}
                        <mesh position={[-15, 5, 0]} receiveShadow castShadow>
                            <cylinderGeometry args={[1, 1, 10]} />
                            <meshStandardMaterial color="#f39c12" />
                        </mesh>
                        {/* The Arm (Red/White striped usually, just Red for now) */}
                        <mesh position={[0, 9, 0]} receiveShadow castShadow>
                            <boxGeometry args={[35, 1, 1]} />
                            <meshStandardMaterial color="#c0392b" />
                        </mesh>

                        <Text
                            position={[0, 15, 0]}
                            fontSize={12}
                            color="#2c3e50"
                            anchorX="center"
                            anchorY="middle"
                            fontWeight="bold"
                        >
                            ENTRANCE
                        </Text>
                    </group>
                    {/* --- SPOTS --- */}
                    {layoutSpots.map(spot => (
                        <SpotMarker
                            key={spot.id}
                            spot={spot}
                            isSelected={selectedSpot?.id === spot.id}
                            onClick={() => spot.status === 'available' && onSpotSelect(spot)}
                        />
                    ))}

                    {/* --- NAVIGATION PATH --- */}
                    {selectedSpot && (
                        <NavigationPath
                            startPosition={[centerX, 0, entranceZ]}
                            endPosition={[
                                Number((selectedLayoutSpot?.layoutX) ?? selectedSpot.position_x) || 0,
                                0,
                                Number((selectedLayoutSpot?.layoutZ) ?? selectedSpot.position_y) || 0
                            ]}
                        />
                    )}

                    <BakeShadows />
                </Suspense>
            </Canvas>
        </div>
    );
};

export default ParkingLot3D;
