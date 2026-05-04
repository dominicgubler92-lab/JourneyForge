"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { europeAirports } from "@/lib/travel/providers/airport-data";
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

function focusQuaternion(latitude: number, longitude: number) {
  const airportVector = latLngToVector3(latitude, longitude, 1).normalize();
  const cameraFacingVector = new THREE.Vector3(0, 0, 1);
  return new THREE.Quaternion().setFromUnitVectors(airportVector, cameraFacingVector);
}

function makeLabelTexture(label: string, highlight: boolean) {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  const scale = window.devicePixelRatio || 1;
  canvas.width = 260 * scale;
  canvas.height = 76 * scale;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  context.scale(scale, scale);
  context.font = highlight ? "700 24px sans-serif" : "700 20px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = highlight ? "rgba(246,239,225,0.96)" : "rgba(242,193,78,0.94)";
  context.strokeStyle = "rgba(7,28,31,0.9)";
  context.lineWidth = 5;
  context.strokeText(label, 130, 38);
  context.fillText(label, 130, 38);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
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

function CityLabel({
  latitude,
  longitude,
  label,
  highlight = false,
}: {
  latitude: number;
  longitude: number;
  label: string;
  highlight?: boolean;
}) {
  const texture = useMemo(() => makeLabelTexture(label, highlight), [label, highlight]);
  const position = latLngToVector3(latitude, longitude, 2.34);

  if (!texture) return null;

  return (
    <sprite position={position} scale={highlight ? [0.92, 0.27, 1] : [0.72, 0.22, 1]}>
      <spriteMaterial map={texture} transparent depthTest depthWrite={false} />
    </sprite>
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
  const targetQuaternion = useMemo(
    () => (origin ? focusQuaternion(origin.latitude, origin.longitude) : null),
    [origin],
  );
  const previewAirports = deals.length === 0 ? europeAirports.slice(0, 12) : [];

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!targetQuaternion) {
      groupRef.current.rotation.y += delta * 0.12;
      return;
    }

    groupRef.current.quaternion.slerp(targetQuaternion, Math.min(1, delta * 2.4));
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
        {origin && (
          <CityLabel
            latitude={origin.latitude}
            longitude={origin.longitude}
            label={`${origin.cityName} ${origin.iataCode}`}
            highlight
          />
        )}
        {origin && deals.map((deal) => <Arc key={`arc-${deal.id}`} from={origin} to={deal} />)}
        {previewAirports.map((airport) => (
          <group key={`preview-${airport.iataCode}`}>
            <Pin
              latitude={airport.latitude}
              longitude={airport.longitude}
              color={airport.iataCode === origin?.iataCode ? "#f6efe1" : "#f2c14e"}
              scale={airport.iataCode === origin?.iataCode ? 1.45 : 0.82}
            />
            <CityLabel
              latitude={airport.latitude}
              longitude={airport.longitude}
              label={`${airport.cityName} ${airport.iataCode}`}
              highlight={airport.iataCode === origin?.iataCode}
            />
          </group>
        ))}
        {deals.map((deal) => (
          <group key={deal.id}>
            <Pin
              latitude={deal.latitude}
              longitude={deal.longitude}
              color="#f2c14e"
              scale={0.95}
            />
            <CityLabel
              latitude={deal.latitude}
              longitude={deal.longitude}
              label={`${deal.destinationName} ${deal.destinationIata}`}
            />
          </group>
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
