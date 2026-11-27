import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import "./TwinScene.css";

/* The 3D view of the site. Built with primitives so the scene runs anywhere;
   each part is a small component, so a GLB model (Kenney, Quaternius, Mixamo,
   Sketchfab CC-BY) can replace it later with drei's useGLTF without touching
   the rest. Positions are in metres; the road runs along x. */

type Props = {
  robotTarget: { x?: number; y?: number; z?: number } | null;
  robotSpeed: number;
  alarm: boolean;
};

const COLORS = {
  ground: "#cfd8dc",
  road: "#6b7a84",
  tunnel: "#4a5a66",
  worker: "#f2a900",
  sensor: "#0f6a7a",
  robot: "#1f2933",
  zone: "#c8323e",
};

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[60, 40]} />
      <meshStandardMaterial color={COLORS.ground} />
    </mesh>
  );
}

function Road() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[40, 6]} />
      <meshStandardMaterial color={COLORS.road} />
    </mesh>
  );
}

function TunnelEntrance() {
  // A hill block with an arch cut by a dark cylinder: reads as a tunnel mouth.
  return (
    <group position={[12, 0, 0]}>
      <mesh position={[4, 3, 0]}>
        <boxGeometry args={[8, 6, 14]} />
        <meshStandardMaterial color="#8a9a6a" />
      </mesh>
      <mesh position={[0.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[3, 3, 0.2, 32, 1, false, 0, Math.PI]} />
        <meshStandardMaterial color={COLORS.tunnel} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0.05, 1.5, 0]}>
        <boxGeometry args={[0.2, 3, 6]} />
        <meshStandardMaterial color={COLORS.tunnel} />
      </mesh>
    </group>
  );
}

function Worker({ position, moving }: { position: [number, number, number]; moving?: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current && moving) ref.current.position.z = position[2] + Math.sin(clock.elapsedTime * 0.8) * 1.5;
  });
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 1, 12]} />
        <meshStandardMaterial color={COLORS.worker} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.22, 12, 12]} />
        <meshStandardMaterial color={COLORS.worker} />
      </mesh>
    </group>
  );
}

function Sensor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
        <meshStandardMaterial color="#9aa5ad" />
      </mesh>
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={COLORS.sensor} emissive={COLORS.sensor} emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function RedZone({ position, size, active }: { position: [number, number, number]; size: [number, number]; active: boolean }) {
  const ref = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.opacity = active ? 0.55 + Math.sin(clock.elapsedTime * 6) * 0.2 : 0.25;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={position}>
      <planeGeometry args={size} />
      <meshStandardMaterial ref={ref} color={COLORS.zone} transparent opacity={0.25} />
    </mesh>
  );
}

function Robot({ target, speed }: { target: THREE.Vector3; speed: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.position.lerp(target, Math.min(1, delta * 2));
    // Legs bob only while moving.
    const legs = ref.current.children.slice(1);
    legs.forEach((leg, i) => {
      leg.position.y = 0.35 + (speed > 0 ? Math.abs(Math.sin(performance.now() / 150 + i)) * 0.1 : 0);
    });
  });
  return (
    <group ref={ref} position={[-12, 0, 0]}>
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.4, 0.4, 0.6]} />
        <meshStandardMaterial color={COLORS.robot} />
      </mesh>
      {[-0.5, 0.5].flatMap((x) =>
        [-0.25, 0.25].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.35, z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
            <meshStandardMaterial color={COLORS.robot} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Camera() {
  // One slow push-in during the whole scene, nothing else moves the camera.
  useFrame(({ camera, clock }) => {
    const k = Math.min(1, clock.elapsedTime / 40);
    camera.position.set(-6 + k * 4, 10 - k * 2, 16 - k * 3);
    camera.lookAt(2, 0, 0);
  });
  return null;
}

export function TwinScene({ robotTarget, robotSpeed, alarm }: Props) {
  const target = new THREE.Vector3(robotTarget?.x ?? -12, robotTarget?.y ?? 0, robotTarget?.z ?? 0);
  return (
    <div className="scene3d" aria-label="Digital twin of the construction site">
      <Canvas camera={{ position: [-6, 10, 16], fov: 45 }} dpr={[1, 1.5]}>
        <color attach="background" args={["#e8edf1"]} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 15, 8]} intensity={1.1} />
        <Camera />
        <Ground />
        <Road />
        <TunnelEntrance />
        <RedZone position={[9, 0.01, 0]} size={[5, 7]} active={alarm} />
        <RedZone position={[-2, 0.01, -5]} size={[6, 3]} active={false} />
        <Worker position={[-4, 0, 4]} moving />
        <Worker position={[2, 0, -4]} moving />
        <Worker position={[alarm ? 8.5 : 5.5, 0, 2]} />
        <Sensor position={[-8, 0, 3.5]} />
        <Sensor position={[0, 0, 3.5]} />
        <Sensor position={[8, 0, 3.5]} />
        <Sensor position={[0, 0, -3.5]} />
        <Robot target={target} speed={robotSpeed} />
      </Canvas>
    </div>
  );
}
