import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { Group } from 'three';

/**
 * Globo decorativo para la sección de ubicación del perfil — a propósito
 * discreto: un detalle que casi no se nota a primer vistazo, no un elemento
 * que compita con el título. Nada de relleno oscuro ni anillos dramáticos;
 * solo la cuadrícula fina y un puntito de "aquí", en tonos naranja/piel de
 * marca. El mapa real ya está al lado (ver AgencyMap); esto es un gesto.
 *
 * `flat` en el <Canvas> es el punto clave del color: por defecto R3F aplica
 * tone mapping ACES Filmic (pensado para escenas fotorrealistas), que sobre
 * un naranja saturado como el de marca lo apaga y lo ensucia en cuanto le
 * toca una luz. `flat` lo desactiva y pinta el color tal cual se define.
 */

function latLonToVec3(latDeg: number, lonDeg: number, r: number): [number, number, number] {
  const lat = (latDeg * Math.PI) / 180;
  const lon = (lonDeg * Math.PI) / 180;
  return [r * Math.cos(lat) * Math.sin(lon), r * Math.sin(lat), r * Math.cos(lat) * Math.cos(lon)];
}

function Globe({ colorHex }: { colorHex: string }) {
  const groupRef = useRef<Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.08;
  });

  const radius = 1.6;
  const skin = '#FDCBA0';

  return (
    <group ref={groupRef}>
      {/* Cuadrícula muy fina, casi transparente — la textura justa para
          leerse como globo sin llamar la atención. */}
      <mesh>
        <sphereGeometry args={[radius, 20, 14]} />
        <meshBasicMaterial color={colorHex} wireframe transparent opacity={0.22} toneMapped={false} />
      </mesh>

      {/* Un pelín de volumen, en tono piel muy tenue — nunca oscuro. */}
      <mesh>
        <sphereGeometry args={[radius * 0.98, 24, 16]} />
        <meshBasicMaterial color={skin} transparent opacity={0.08} toneMapped={false} />
      </mesh>

      {/* Puntito de "aquí" — el único acento con algo más de presencia. */}
      <group position={latLonToVec3(41.4, 2.2, radius)}>
        <mesh>
          <sphereGeometry args={[0.045, 12, 12]} />
          <meshBasicMaterial color={colorHex} toneMapped={false} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshBasicMaterial color={skin} transparent opacity={0.3} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

export default function LocationGlobe({ colorHex }: { colorHex?: string }) {
  return (
    <Canvas
      flat
      dpr={[1, 1.5]}
      camera={{ position: [0, 0.2, 5.4], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <Globe colorHex={colorHex || '#FF8000'} />
    </Canvas>
  );
}
