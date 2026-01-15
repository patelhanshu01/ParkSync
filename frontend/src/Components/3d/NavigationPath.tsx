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

    const arrowPoints = useMemo(() => {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i < pathPoints.length; i += 5) {
            points.push(pathPoints[i]);
        }
        return points;
    }, [pathPoints]);

    // Animation state
    const guideRef = React.useRef<THREE.Group>(null);
    const progressRef = React.useRef(0);

    useFrame((_, delta: number) => {
        if (guideRef.current) {
            // Move guide along curve
            const newProgress = (progressRef.current + delta * 0.3) % 1;
            progressRef.current = newProgress;

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
            {/* Path Line (Yellow Road Paint) */}
            {/* We use a tube but flattened to look like paint on the road */}
            <mesh position={[0, 0.2, 0]}>
                <tubeGeometry args={[curve, 128, 1.5, 4, false]} />
                <meshStandardMaterial
                    color="#FFD700"
                    emissive="#FFD700"
                    emissiveIntensity={0.5}
                    roughness={0.8}
                    transparent
                    opacity={0.9}
                />
            </mesh>

            {/* Guide Vehicle (Simplified) */}
            <group ref={guideRef}>
                <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
                    <coneGeometry args={[1, 3, 16]} />
                    <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={1} />
                </mesh>
            </group>

            {/* Directional Arrows (Painted on ground) */}
            {arrowPoints.map((point, index) => (
                <group key={index} position={[point.x, 0.3, point.z]}>
                    <mesh rotation={[-Math.PI / 2, 0, Math.atan2(endPosition[0] - startPosition[0], endPosition[2] - startPosition[2])]}>
                        <planeGeometry args={[2, 2]} />
                        <meshBasicMaterial
                            color="#fff"
                            transparent
                            opacity={0.8}
                            side={THREE.DoubleSide}
                        />
                    </mesh>
                </group>
            ))}
        </group>
    );
};

export default NavigationPath;
