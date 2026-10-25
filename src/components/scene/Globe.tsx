"use client";

import { useMemo } from "react";
import * as THREE from "three";

import { GLOBE_RADIUS, palette } from "@/lib/theme";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uBase;
  uniform vec3 uRimA;
  uniform vec3 uRimB;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    // 補間後のベクトルは正規化し直す。さらに pow の底を 0〜1 に収める。
    // 誤差で dot が 1 を超えると pow(負, 2.6) が NaN になり、Bloom がそれを広げて球の周りが明滅する
    vec3 normal = normalize(vNormal);
    float facing = clamp(dot(normal, normalize(vViewDir)), 0.0, 1.0);
    float fresnel = pow(1.0 - facing, 2.6);
    vec3 rim = mix(uRimA, uRimB, clamp(normal.y * 0.5 + 0.5, 0.0, 1.0));
    gl_FragColor = vec4(uBase + rim * fresnel * 1.4, 1.0);
  }
`;

/**
 * 天球の「玉」。深度を書き込むので、外から見たとき裏側の星や線を隠す。
 * 表面のみ描画するため、内側からは見えない（プラネタリウムモードの邪魔をしない）。
 */
export function Globe() {
  const uniforms = useMemo(
    () => ({
      uBase: { value: new THREE.Color(palette.globe) },
      uRimA: { value: new THREE.Color(palette.pink) },
      uRimB: { value: new THREE.Color(palette.cyan) },
    }),
    [],
  );

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 0.995, 96, 64]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        toneMapped={false}
      />
    </mesh>
  );
}
