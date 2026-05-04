"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { geoEquirectangular, geoPath } from "d3-geo";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { GeometryObject, Objects, Topology } from "topojson-specification";
import { feature, mesh } from "topojson-client";
import countries from "world-atlas/countries-110m.json";
import { europeAirports } from "@/lib/travel/providers/airport-data";
import type { AirportOption, DealOption } from "@/lib/travel/types";

type DealGlobeProps = {
  origin: AirportOption | null;
  deals: DealOption[];
};

type WorldObjects = {
  countries: GeometryObject;
  land: GeometryObject;
} & Objects;
type WorldTopology = Topology<WorldObjects>;

const oceanLabels = [
  { label: "ATLANTIC", x: 1010, y: 440 },
  { label: "INDIAN OCEAN", x: 1320, y: 640 },
  { label: "PACIFIC", x: 290, y: 520 },
];

const majorRivers = [
  [
    [8.2, 46.8],
    [7.7, 47.6],
    [7.5, 49.8],
    [6.7, 51],
    [4.1, 51.9],
  ],
  [
    [8.1, 48.1],
    [11.6, 48.7],
    [14.4, 48.2],
    [16.4, 48.2],
    [19.1, 47.5],
    [23.6, 45.2],
    [29.6, 45.1],
  ],
  [
    [31.2, 30],
    [31.5, 25.7],
    [32.4, 15.6],
    [30.8, 7.3],
    [31.6, -2.3],
  ],
] satisfies Array<Array<[number, number]>>;

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

function makeEarthTexture() {
  if (typeof document === "undefined") {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 2048;
  canvas.height = 1024;
  const context = canvas.getContext("2d");

  if (!context) {
    return null;
  }

  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0b3d4a");
  gradient.addColorStop(0.52, "#0a5762");
  gradient.addColorStop(1, "#082f3c");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalAlpha = 0.22;
  context.fillStyle = "#8cd3d0";
  for (let y = 80; y < canvas.height; y += 105) {
    context.fillRect(0, y, canvas.width, 1);
  }
  for (let x = 120; x < canvas.width; x += 150) {
    context.fillRect(x, 0, 1, canvas.height);
  }
  context.globalAlpha = 1;

  const projection = geoEquirectangular()
    .scale(canvas.width / (2 * Math.PI))
    .translate([canvas.width / 2, canvas.height / 2]);
  const path = geoPath(projection, context);
  const topology = countries as unknown as WorldTopology;
  const land = feature(topology, topology.objects.land);
  const borders = mesh(topology, topology.objects.countries, (a, b) => a !== b);

  context.beginPath();
  path(land);
  context.fillStyle = "#2f765c";
  context.fill();

  context.beginPath();
  path(land);
  context.strokeStyle = "rgba(214, 232, 187, 0.24)";
  context.lineWidth = 1.6;
  context.stroke();

  context.beginPath();
  path(borders);
  context.strokeStyle = "rgba(246, 239, 225, 0.32)";
  context.lineWidth = 0.9;
  context.stroke();

  context.strokeStyle = "rgba(126, 210, 223, 0.78)";
  context.lineWidth = 2.4;
  majorRivers.forEach((river) => {
    context.beginPath();
    river.forEach(([longitude, latitude], index) => {
      const point = projection([longitude, latitude]);
      if (!point) return;
      if (index === 0) {
        context.moveTo(point[0], point[1]);
      } else {
        context.lineTo(point[0], point[1]);
      }
    });
    context.stroke();
  });

  context.font = "700 24px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(202, 231, 229, 0.34)";
  oceanLabels.forEach((label) => context.fillText(label.label, label.x, label.y));

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
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
  const earthTexture = useMemo(() => makeEarthTexture(), []);
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
            map={earthTexture ?? undefined}
            color={earthTexture ? "#ffffff" : "#123f45"}
            roughness={0.82}
            metalness={0.12}
            emissive="#032327"
            emissiveIntensity={0.12}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[2.012, 48, 48]} />
          <meshBasicMaterial color="#dff8f0" wireframe transparent opacity={0.045} />
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
