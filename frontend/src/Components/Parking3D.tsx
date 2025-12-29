import React, { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, Html, Sparkles, Float, Text, Grid, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import { Button, Box, Chip, Stack, Typography } from '@mui/material';

const Loader = () => (
  <Html center>
    <div style={{ color: 'white' }}>Preparing scene…</div>
  </Html>
);

const statusColors: Record<string, string> = {
  available: '#22c55e',
  reserved: '#f5a524',
  occupied: '#ef4444'
};

const AnimatedCar: React.FC<{ curve: THREE.CatmullRomCurve3; offset: number; color: string }> = ({ curve, offset, color }) => {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * 0.05 + offset) % 1;
    const position = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    ref.current.position.copy(position);
    const axis = new THREE.Vector3(0, 0, 1);
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, tangent);
    ref.current.quaternion.slerp(quaternion, 0.2);
  });

  return (
    <group ref={ref} position={[0, 0.4, 0]}>
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.7, 2.8]} />
        <meshStandardMaterial color={color} metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.7, -0.2]}>
        <boxGeometry args={[1.1, 0.5, 1.5]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.45, 1.45]}>
        <boxGeometry args={[1.2, 0.4, 0.1]} />
        <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={3} />
      </mesh>
    </group>
  );
};

function ProceduralParking({ rows = 3, cols = 6, carCount = 3, groupRef, onSpotSelect, initialSpots, selectedSpotId }: { rows?: number; cols?: number; carCount?: number; groupRef: React.RefObject<THREE.Group>; onSpotSelect?: (spot: any) => void; initialSpots?: any[]; selectedSpotId?: number | null }) {
  // Create spot metadata (id, number, status). Use initialSpots if provided, else generate demo data
  const spotsMeta = useMemo(() => {
    const arr: any[] = [];
    let idCounter = 1000;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const statusChoices = ['available', 'occupied', 'reserved'];
        const status = initialSpots?.[r * cols + c]?.status || statusChoices[Math.floor(Math.random() * 3)];
        arr.push({ id: initialSpots?.[r * cols + c]?.id || idCounter++, spot_number: `${String.fromCharCode(65 + r)}${c + 1}`, x: c * 2.8, z: r * 5.2, status });
      }
    }
    return arr;
  }, [rows, cols, initialSpots]);

  const laneCurve = useMemo(() => {
    const padding = 4;
    const width = (cols - 1) * 2.8;
    const depth = (rows - 1) * 5.2;
    return new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-width / 2 - padding, 0.45, depth / 2 + padding),
        new THREE.Vector3(width / 2 + padding, 0.45, depth / 2 + padding),
        new THREE.Vector3(width / 2 + padding, 0.45, -depth / 2 - padding),
        new THREE.Vector3(-width / 2 - padding, 0.45, -depth / 2 - padding)
      ],
      true,
      'catmullrom',
      0.2
    );
  }, [cols, rows]);

  const laneTube = useMemo(() => {
    return new THREE.TubeGeometry(laneCurve, 200, 0.15, 8, true);
  }, [laneCurve]);

  return (
    <group ref={groupRef}>
      {/* ground */}
      <group position={[0, -0.05, 0]}>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[cols * 4.5 + 20, rows * 6.5 + 20]} />
          <meshStandardMaterial color="#0b1220" />
        </mesh>
        <Grid
          args={[cols * 4.5 + 20, rows * 6.5 + 20]}
          cellColor="#0b283f"
          sectionColor="#102c3f"
          cellSize={1.2}
          fadeDistance={80}
          position={[0, 0.01, 0]}
        />
      </group>

      {/* neon drive lane */}
      <mesh geometry={laneTube}>
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1.4} transparent opacity={0.65} />
      </mesh>
      <Sparkles count={120} speed={0.4} opacity={0.3} scale={[cols * 3, 4, rows * 4]} position={[0, 2, 0]} />

      {/* parking spots (interactive) */}
      {spotsMeta.map((s) => {
        const pos: [number, number, number] = [s.x - (cols - 1), 0.05, s.z - (rows - 1) * 2.6];
        const color = statusColors[s.status] || '#26a69a';
        const selected = s.id === (selectedSpotId ?? null);
        return (
          <group key={s.id} position={pos}>
            <RoundedBox
              args={[2, 0.1, 4.2]}
              radius={0.12}
              smoothness={4}
              scale={selected ? [1.08, 1.06, 1.08] : [1, 1, 1]}
              onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
              onPointerOut={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'auto'; }}
              onClick={(e: any) => { e.stopPropagation(); onSpotSelect && onSpotSelect(s); }}
            >
              <meshStandardMaterial
                color={color}
                roughness={0.5}
                metalness={0.25}
                emissive={selected ? color : '#0c1729'}
                emissiveIntensity={selected ? 0.9 : 0.25}
              />
            </RoundedBox>

            {/* divider line */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
              <planeGeometry args={[0.12, 4.2]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.55} />
            </mesh>

            {/* spot label */}
            <Text position={[0, 0.35, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.48} color="#e2e8f0">
              {s.spot_number}
            </Text>
          </group>
        );
      })}

      {/* moving hero lane cars */}
      {Array.from({ length: carCount }).map((_, i) => (
        <AnimatedCar key={`car-${i}`} curve={laneCurve} offset={i / carCount} color={i % 2 === 0 ? '#06b6d4' : '#8b5cf6'} />
      ))}

      {/* entrance arch */}
      <Float speed={1.4} floatIntensity={0.5} position={[0, 0, -((rows - 1) * 2.6 + 6)]}>
        <mesh position={[0, 1.6, 0]} castShadow>
          <boxGeometry args={[cols * 2.3, 0.12, 0.8]} />
          <meshStandardMaterial color="#0ea5e9" emissive="#0ea5e9" emissiveIntensity={1.2} />
        </mesh>
        <Text position={[0, 1, 0]} fontSize={0.8} color="#e0f2fe" anchorX="center" anchorY="middle">
          ARRIVAL
        </Text>
      </Float>
    </group>
  );
}

const Parking3D: React.FC<{ onExport?: (url: string) => void; onSpotSelect?: (spot: any) => void; initialSpots?: any[]; selectedSpotId?: number | null }> = ({ onExport, onSpotSelect, initialSpots, selectedSpotId }) => {
  const groupRef = useRef<THREE.Group>(null);

  const exportGLB = () => {
    if (!groupRef.current) return;
    const exporter = new GLTFExporter();
    (exporter as any).parse(
      groupRef.current,
      (result: any) => {
        let blob: Blob;
        if (result instanceof ArrayBuffer) {
          blob = new Blob([result], { type: 'model/gltf-binary' });
        } else {
          const str = JSON.stringify(result);
          blob = new Blob([str], { type: 'model/gltf+json' });
        }
        const url = URL.createObjectURL(blob);
        onExport?.(url);
      },
      { binary: true }
    );
  };

  return (
    <Box sx={{ background: 'linear-gradient(135deg, #0b1220 0%, #060912 100%)', borderRadius: 2, p: 2, border: '1px solid rgba(255,255,255,0.06)' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle1" sx={{ color: '#e2e8f0', letterSpacing: 0.2 }}>Immersive 3D Bay</Typography>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label="Animated lanes" color="primary" />
          <Chip size="small" label="AR Ready" variant="outlined" sx={{ color: '#67e8f9', borderColor: 'rgba(103,232,249,0.4)' }} />
        </Stack>
      </Box>

      <div style={{ width: '100%', height: '520px', borderRadius: '16px', overflow: 'hidden' }}>
        <Canvas camera={{ position: [10, 10, 14], fov: 48 }} shadows gl={{ antialias: true }}>
          <color attach="background" args={['#05070e']} />
          <fog attach="fog" args={['#05070e', 20, 70]} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 16, 10]} intensity={1.1} castShadow shadow-mapSize={[2048, 2048]} />
          <Suspense fallback={<Loader />}>
            <ProceduralParking groupRef={groupRef} onSpotSelect={onSpotSelect} initialSpots={initialSpots} selectedSpotId={selectedSpotId} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls makeDefault enablePan enableZoom enableRotate maxPolarAngle={Math.PI / 2.2} />
        </Canvas>
      </div>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2, alignItems: 'center' }}>
        <Button variant="contained" onClick={exportGLB}>Export scene to AR (GLB)</Button>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
          Click a glowing bay to select & reserve. Export to drop the same layout into AR.
        </Typography>
      </Stack>
    </Box>
  );
};

export default Parking3D;
