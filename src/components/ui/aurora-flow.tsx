import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function AuroraBackground() {
  const { scene } = useThree();
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);

  React.useEffect(() => {
    const geometry = new THREE.PlaneGeometry(200, 200);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec2 resolution;
        varying vec2 vUv;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                             -0.577350269189626, 0.024390243902439);
          vec2 i  = floor(v + dot(v, C.yy) );
          vec2 x0 = v -   i + dot(i, C.xx);
          vec2 i1;
          i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
            + i.x + vec3(0.0, i1.x, 1.0 ));
          vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
          m = m*m ;
          m = m*m ;
          vec3 x = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x) - 0.5;
          vec3 ox = floor(x + 0.5);
          vec3 a0 = x - ox;
          m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
          vec3 g;
          g.x  = a0.x  * x0.x  + h.x  * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec2 uv = vUv;

          float flow1 = snoise(vec2(uv.x * 2.0 + time * 0.08, uv.y * 0.5 + time * 0.04));
          float flow2 = snoise(vec2(uv.x * 1.5 + time * 0.06, uv.y * 0.8 + time * 0.03));
          float flow3 = snoise(vec2(uv.x * 3.0 + time * 0.1, uv.y * 0.3 + time * 0.06));

          float streaks = sin((uv.x + flow1 * 0.3) * 8.0 + time * 0.15) * 0.5 + 0.5;
          streaks *= sin((uv.y + flow2 * 0.2) * 12.0 + time * 0.12) * 0.5 + 0.5;

          float aurora = (flow1 + flow2 + flow3) * 0.33 + 0.5;
          aurora = pow(aurora, 2.0);

          vec3 darkBg = vec3(0.02, 0.01, 0.0);
          vec3 warm = vec3(0.6, 0.25, 0.05);
          vec3 orange = vec3(1.0, 0.5, 0.0);
          vec3 amber = vec3(1.0, 0.7, 0.2);
          vec3 gold = vec3(1.0, 0.85, 0.4);

          vec3 color = darkBg;

          float warmFlow = smoothstep(0.3, 0.7, aurora + streaks * 0.3);
          color = mix(color, warm, warmFlow);

          float orangeFlow = smoothstep(0.6, 0.9, aurora + flow1 * 0.4);
          color = mix(color, orange, orangeFlow);

          float brightFlow = smoothstep(0.8, 1.0, streaks + aurora * 0.5);
          color = mix(color, amber, brightFlow * 0.7);

          float goldFlow = smoothstep(0.7, 0.95, flow3 + streaks * 0.2);
          color = mix(color, gold, goldFlow * 0.5);

          float noise = snoise(uv * 100.0) * 0.02;
          color += noise;

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });

    materialRef.current = material;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = -50;
    meshRef.current = mesh;
    scene.add(mesh);

    let animId: number;
    const animate = () => {
      material.uniforms.time.value += 0.008;
      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      scene.remove(mesh);
      geometry.dispose();
      material.dispose();
    };
  }, [scene]);

  return null;
}

function CameraController() {
  const { camera } = useThree();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = Math.sin(t * 0.04) * 4;
    camera.position.y = Math.cos(t * 0.06) * 3;
    camera.position.z = 30;
    camera.lookAt(0, 0, -30);
  });

  return null;
}

export function AuroraHero() {
  return (
    <div className="absolute inset-0 z-0">
      <Canvas
        camera={{ position: [0, 0, 30], fov: 75 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#050300' }}
      >
        <AuroraBackground />
        <CameraController />
        <ambientLight intensity={0.9} />
        <pointLight
          position={[20, 20, 10]}
          intensity={0.8}
          color="#FF8000"
          distance={100}
          decay={2}
        />
        <pointLight
          position={[-20, -10, 5]}
          intensity={0.6}
          color="#FFB347"
          distance={80}
          decay={2}
        />
      </Canvas>
    </div>
  );
}
