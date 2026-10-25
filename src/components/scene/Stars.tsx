"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { bvToRgb, magnitudeToIntensity, magnitudeToSize, raDecToVec3 } from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { StarCatalog } from "@/types/astro";

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aPhase;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uRefDistance;

  varying vec3 vColor;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.85 + 0.15 * sin(uTime * 2.2 + aPhase);
    float attenuation = clamp(uRefDistance / -mvPosition.z, 0.6, 2.2);
    gl_PointSize = aSize * uPixelRatio * twinkle * attenuation;
    gl_Position = projectionMatrix * mvPosition;
    vColor = aColor;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float core = smoothstep(0.18, 0.0, d);
    float glow = exp(-d * d * 14.0);
    vec3 color = vColor * glow + vec3(1.0) * core;
    gl_FragColor = vec4(color, glow);
  }
`;

export function Stars({ catalog }: { catalog: StarCatalog }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const viewMode = useSkyStore((s) => s.viewMode);
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(() => {
    const { stars, magLimit } = catalog;
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    const phases = new Float32Array(stars.length);

    stars.forEach(([ra, dec, mag, bv], i) => {
      positions.set(raDecToVec3(ra, dec, GLOBE_RADIUS), i * 3);
      const k = magnitudeToIntensity(mag, magLimit);
      const [r, g, b] = bvToRgb(bv);
      colors.set([r * k, g * k, b * k], i * 3);
      sizes[i] = magnitudeToSize(mag, magLimit);
      // 黄金角ずつずらして、瞬きのタイミングを星ごとにばらけさせる
      phases[i] = (i * 2.399963) % (Math.PI * 2);
    });

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    return geo;
  }, [catalog]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPixelRatio: { value: 1 },
      uRefDistance: { value: 28 },
    }),
    [],
  );

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;
    m.uniforms.uTime.value += delta;
    m.uniforms.uPixelRatio.value = dpr;
    // 内側から見るときは星までの距離が半径に固定されるので基準距離も合わせる
    m.uniforms.uRefDistance.value = viewMode === "inside" ? GLOBE_RADIUS * 1.5 : 28;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
