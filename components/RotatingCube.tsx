"use client";

import { Edges } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

function Cube() {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta;
    meshRef.current.rotation.y += delta * 0.6;
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial color="#7f9bc7" />
      <Edges color="#000000" threshold={15} />
    </mesh>
  );
}

export default function RotatingCube() {
  return (
    <div className="aspect-square w-[clamp(12rem,40vw,28rem)]">
      <Canvas camera={{ position: [8, 7, 10], fov: 28 }}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        <Cube />
      </Canvas>
    </div>
  );
}
