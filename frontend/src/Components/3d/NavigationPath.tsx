import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface NavigationPathProps {
    startPosition: [number, number, number];
    endPosition: [number, number, number];
}

const NavigationPath: React.FC<NavigationPathProps> = ({ startPosition, endPosition }) => {
    // Simple straight-line path for now
    // In production, you'd use A* pathfinding to avoid obstacles
    const pathPoints = useMemo(() => {

        const steps = 20;

        // Create a slightly curved path for better visuals
        const midX = (startPosition[0] + endPosition[0]) / 2;
        const midZ = (startPosition[2] + endPosition[2]) / 2;

        // Control point for curve (offset slightly)
        const controlX = midX + (Math.random() > 0.5 ? 20 : -20);

        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...startPosition),
            new THREE.Vector3(controlX, 5, midZ),
            new THREE.Vector3(endPosition[0], 5, endPosition[2])
        );

        return curve.getPoints(steps);
    }, [startPosition, endPosition]);

    const curve = useMemo(() => new THREE.CatmullRomCurve3(pathPoints), [pathPoints]);

    // Animation state
    const guideRef = React.useRef<THREE.Group>(null);
    const [progress, setProgress] = React.useState(0);

    useFrame((_, delta: number) => {
        if (guideRef.current) {
            // Move guide along curve
            const newProgress = (progress + delta * 0.3) % 1;
            setProgress(newProgress);

            const position = curve.getPointAt(newProgress);
            const tangent = curve.getTangentAt(newProgress);

            guideRef.current.position.copy(position);

            // Look along the path
            const lookAtPos = position.clone().add(tangent);
            guideRef.current.lookAt(lookAtPos);
        }
    });

    return (
        <group>
            {/* Path Line (Neon Core) */}
            <mesh>
                <tubeGeometry args={[curve, 64, 0.5, 8, false]} />
                <meshStandardMaterial
                    color="#00F5FF"
                    emissive="#00F5FF"
                    emissiveIntensity={5}
                />
            </mesh>

            {/* Outer Glow Path */}
            <mesh>
                <tubeGeometry args={[curve, 64, 1.2, 8, false]} />
                <meshStandardMaterial
                    color="#00F5FF"
                    transparent
                    opacity={0.2}
                />
            </mesh>

            {/* Cyber Guide Vehicle */}
            <group ref={guideRef}>
                <mesh position={[0, 0.5, 0]}>
                    <boxGeometry args={[3, 1, 6]} />
                    <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={2} />
                </mesh>
                <mesh position={[0, 1.2, -0.5]}>
                    <boxGeometry args={[2.5, 0.8, 3]} />
                    <meshStandardMaterial color="#1a1a1a" roughness={0.1} metalness={1} />
                </mesh>
            </group>

            {/* Animated Directional Arrows */}
            {pathPoints.filter((_, i) => i % 4 === 0).map((point, index) => (
                <group key={index} position={[point.x, 0.2, point.z]}>
                    <mesh rotation={[-Math.PI / 2, 0, Math.atan2(endPosition[0] - startPosition[0], endPosition[2] - startPosition[2])]}>
                        <planeGeometry args={[3, 3]} />
                        <meshBasicMaterial
                            color="#00F5FF"
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

export default NavigationPath;
