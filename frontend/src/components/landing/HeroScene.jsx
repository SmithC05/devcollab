import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useReducedMotion } from 'framer-motion';

function ParticleNetwork() {
  const shouldReduceMotion = useReducedMotion();
  
  // Use fewer points on mobile or if reduced motion is preferred
  const isMobile = window.innerWidth < 768;
  const PARTICLE_COUNT = isMobile || shouldReduceMotion ? 25 : 50;
  const MAX_DISTANCE = 4.0;
  
  const pointsRef = useRef();
  const linesRef = useRef();

  // Initialize particle data
  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const vel = [];
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Spread them wide and deep
      pos[i * 3] = (Math.random() - 0.5) * 30; // x
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5; // z
      
      vel.push(new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
      ));
    }
    return { positions: pos, velocities: vel };
  }, [PARTICLE_COUNT]);

  // Pre-allocate max possible lines buffer (n * (n-1) / 2)
  const maxLines = (PARTICLE_COUNT * (PARTICLE_COUNT - 1)) / 2;
  const linePositions = useMemo(() => new Float32Array(maxLines * 6), [maxLines]);

  useFrame(() => {
    if (shouldReduceMotion) return; // Freeze animation

    const posAttr = pointsRef.current.geometry.attributes.position;
    let lineIndex = 0;
    
    // Update positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      posAttr.array[i * 3] += velocities[i].x;
      posAttr.array[i * 3 + 1] += velocities[i].y;
      posAttr.array[i * 3 + 2] += velocities[i].z;
      
      // Bounce off invisible boundaries
      if (Math.abs(posAttr.array[i * 3]) > 20) velocities[i].x *= -1;
      if (Math.abs(posAttr.array[i * 3 + 1]) > 15) velocities[i].y *= -1;
      if (Math.abs(posAttr.array[i * 3 + 2] + 5) > 10) velocities[i].z *= -1;
    }
    posAttr.needsUpdate = true;

    // Calculate lines based on distance
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const p1 = new THREE.Vector3(posAttr.array[i3], posAttr.array[i3 + 1], posAttr.array[i3 + 2]);
      
      for (let j = i + 1; j < PARTICLE_COUNT; j++) {
        const j3 = j * 3;
        const p2 = new THREE.Vector3(posAttr.array[j3], posAttr.array[j3 + 1], posAttr.array[j3 + 2]);
        
        const dist = p1.distanceTo(p2);
        
        if (dist < MAX_DISTANCE) {
          linePositions[lineIndex++] = p1.x;
          linePositions[lineIndex++] = p1.y;
          linePositions[lineIndex++] = p1.z;
          linePositions[lineIndex++] = p2.x;
          linePositions[lineIndex++] = p2.y;
          linePositions[lineIndex++] = p2.z;
        }
      }
    }
    
    // Update line geometry with exact draw range
    linesRef.current.geometry.attributes.position.needsUpdate = true;
    linesRef.current.geometry.setDrawRange(0, lineIndex / 3);
  });

  return (
    <group>
      {/* Points */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={PARTICLE_COUNT} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.08} transparent opacity={0.3} sizeAttenuation />
      </points>
      
      {/* Connections */}
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={maxLines * 2} array={linePositions} itemSize={3} />
        </bufferGeometry>
        {/* Accent blue for lines at low opacity */}
        <lineBasicMaterial color="#6fa8ff" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

function SceneRotator() {
  const groupRef = useRef();
  const shouldReduceMotion = useReducedMotion();

  useFrame((state) => {
    if (!shouldReduceMotion && groupRef.current) {
      // Very slow ambient rotation
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.02) * 0.05;
    }
  });

  return (
    <group ref={groupRef}>
      <ParticleNetwork />
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: true, alpha: true }}>
        <color attach="background" args={['#08090b']} />
        <SceneRotator />
      </Canvas>
    </div>
  );
}
