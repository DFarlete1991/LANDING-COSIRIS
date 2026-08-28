import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import type { Mesh } from 'three';

/**
 * Ambientación 3D decorativa del hero de perfil — a propósito discreta: un
 * detalle que casi no se nota a primer vistazo, no un elemento que compita
 * con el contenido. Solo se monta en desktop (ver InmobiliariaPerfilPage),
 * donde hay hueco de sobra a la derecha del texto y el coste de GPU es
 * asumible; en el móvil de una campaña de pago cada KB cuenta, así que ahí
 * ni se carga el bundle de three.js.
 *
 * Dos cosas hacen que esto no se vea "pesado":
 * 1. `flat` en el <Canvas> — por defecto R3F aplica tone mapping ACES
 *    Filmic (pensado para escenas fotorrealistas), que sobre un naranja
 *    saturado lo apaga y lo ensucia en cuanto le toca una luz. `flat` lo
 *    desactiva y pinta el color tal cual se define.
 * 2. Sin luz direccional — una luz direccional sobre una figura grande crea
 *    esa mancha brillante con sombra alrededor que se lee como una bola
 *    sólida oscura. Solo luz ambiental, pareja en toda la superficie, y
 *    opacidades bajas: el resultado es translúcido, no una masa de color.
 */

function SlowSpin({ speed, children }: { speed: number; children: React.ReactNode }) {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (!ref.current) return;
    ref.current.rotation.x += delta * speed * 0.35;
    ref.current.rotation.y += delta * speed * 0.5;
  });
  return <group ref={ref as never}>{children}</group>;
}

type Shape = 'icosahedron' | 'dodecahedron' | 'octahedron' | 'torus';

function ShapeGeometry({ shape, detail }: { shape: Shape; detail: number }) {
  switch (shape) {
    case 'dodecahedron':
      return <dodecahedronGeometry args={[1, detail]} />;
    case 'octahedron':
      return <octahedronGeometry args={[1, detail]} />;
    case 'torus':
      return <torusGeometry args={[1, 0.35, 12, 32]} />;
    default:
      return <icosahedronGeometry args={[1, detail]} />;
  }
}

function Orb({
  shape,
  position,
  scale,
  color,
  speed,
  distort,
  wireframe,
  opacity,
  floatSpeed,
}: {
  shape: Shape;
  position: [number, number, number];
  scale: number;
  color: string;
  speed: number;
  distort: number;
  wireframe?: boolean;
  opacity: number;
  floatSpeed: number;
}) {
  return (
    <Float speed={floatSpeed} rotationIntensity={0.4} floatIntensity={0.9}>
      <SlowSpin speed={speed}>
        <mesh position={position} scale={scale}>
          <ShapeGeometry shape={shape} detail={wireframe ? 0 : 1} />
          {wireframe ? (
            <meshBasicMaterial color={color} wireframe transparent opacity={opacity} toneMapped={false} />
          ) : (
            <MeshDistortMaterial
              color={color}
              distort={distort}
              speed={1}
              roughness={1}
              metalness={0}
              transparent
              opacity={opacity}
              toneMapped={false}
            />
          )}
        </mesh>
      </SlowSpin>
    </Float>
  );
}

export default function ProfileHeroOrbs({ colorHex }: { colorHex?: string }) {
  const primary = colorHex || '#FF8000';
  const skin = '#FDCBA0';

  return (
    <Canvas
      flat
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 8], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* Sin luz direccional a propósito — ver nota arriba. */}
      <ambientLight intensity={1.6} />

      <Orb shape="icosahedron" position={[1.3, 0.7, 0]} scale={0.62} color={primary} speed={0.4} distort={0.28} opacity={0.4} floatSpeed={1.1} />
      <Orb shape="dodecahedron" position={[-1.2, -1.1, -1.6]} scale={0.42} color={skin} speed={0.5} distort={0.18} opacity={0.35} floatSpeed={1.4} />
      <Orb shape="torus" position={[-1.5, 1.0, -1]} scale={0.32} color={primary} speed={0.7} wireframe distort={0} opacity={0.3} floatSpeed={1.7} />
      <Orb shape="octahedron" position={[0.5, -1.5, 1]} scale={0.3} color={skin} speed={0.9} wireframe distort={0} opacity={0.35} floatSpeed={2} />
      <Orb shape="icosahedron" position={[1.7, -0.5, -1.3]} scale={0.22} color={primary} speed={1} wireframe distort={0} opacity={0.35} floatSpeed={2.2} />
    </Canvas>
  );
}
