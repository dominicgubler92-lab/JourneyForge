"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { AirportOption, DealOption } from "@/lib/travel/types";

type DealGlobeProps = {
  origin: AirportOption | null;
  deals: DealOption[];
};

function latLngToVector3(latitude: number, longitude: number, radius = 2) {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);

  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  );
}

function focusRotation(latitude: number, longitude: number) {
  return {
    x: THREE.MathUtils.degToRad(latitude * 0.72),
    y: THREE.MathUtils.degToRad(-longitude - 18),
  };
}

function Pin({
  latitude,
  longitude,
  color,
  scale = 1,
}: {
  latitude: number;
  longitude: number;
  color: string;
  scale?: number;
}) {
  const position = latLngToVector3(latitude, longitude, 2.05);

  return (
    <mesh position={position}>
      <sphereGeometry args={[0.045 * scale, 18, 18]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.7} />
    </mesh>
  );
}

function Arc({ from, to }: { from: AirportOption; to: DealOption }) {
  const curve = useMemo(() => {
    const start = latLngToVector3(from.latitude, from.longitude, 2.08);
    const end = latLngToVector3(to.latitude, to.longitude, 2.08);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.55);
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [from, to]);
  const points = useMemo(() => curve.getPoints(36), [curve]);
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
  const line = useMemo(
    () =>
      new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({
          color: "#f2c14e",
          transparent: true,
          opacity: 0.55,
        }),
      ),
    [geometry],
  );

  return <primitive object={line} />;
}

function GlobeScene({ origin, deals }: DealGlobeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const target = origin ? focusRotation(origin.latitude, origin.longitude) : { x: 0.18, y: -0.45 };

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (!origin) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, target.x, delta * 1.2);
      groupRef.current.rotation.y += delta * 0.12;
      return;
    }

    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, target.x, delta * 1.8);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, target.y, delta * 1.8);
  });

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 3, 5]} intensity={1.5} />
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[2, 96, 96]} />
          <meshStandardMaterial
            color="#123f45"
            roughness={0.82}
            metalness={0.12}
            emissive="#06292d"
            emissiveIntensity={0.32}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.012, 48, 48]} />
          <meshBasicMaterial color="#8ed6c9" wireframe transparent opacity={0.08} />
        </mesh>
        {origin && <Pin latitude={origin.latitude} longitude={origin.longitude} color="#f6efe1" scale={1.5} />}
        {origin && deals.map((deal) => <Arc key={`arc-${deal.id}`} from={origin} to={deal} />)}
        {deals.map((deal) => (
          <Pin
            key={deal.id}
            latitude={deal.latitude}
            longitude={deal.longitude}
            color="#f2c14e"
            scale={0.95}
          />
        ))}
      </group>
    </>
  );
}

export function DealGlobe({ origin, deals }: DealGlobeProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <Canvas camera={{ position: [0, 0, 5.8], fov: 42 }} gl={{ antialias: true, alpha: true }}>
        <GlobeScene origin={origin} deals={deals} />
      </Canvas>
    </div>
  );
}
