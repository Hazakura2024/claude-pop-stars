"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { declinationCircle, eclipticCircle, rightAscensionMeridian } from "@/lib/astro";
import { GLOBE_RADIUS, palette } from "@/lib/theme";

const R = GLOBE_RADIUS * 1.002;

/** 赤経線（2h ごと）・赤緯線（30° ごと）・天の赤道 */
export function CelestialGrid() {
  const meridians = useMemo(
    () => Array.from({ length: 12 }, (_, i) => rightAscensionMeridian(i * 30, R)),
    [],
  );
  const parallels = useMemo(() => [-60, -30, 30, 60].map((d) => declinationCircle(d, R)), []);
  const equator = useMemo(() => declinationCircle(0, R), []);

  return (
    <group>
      {[...meridians, ...parallels].map((points, i) => (
        <Line
          key={i}
          points={points}
          color={palette.violet}
          lineWidth={0.8}
          transparent
          opacity={0.45}
          toneMapped={false}
        />
      ))}
      <Line points={equator} color={palette.cyan} lineWidth={1.6} toneMapped={false} />
    </group>
  );
}

export function Ecliptic() {
  const points = useMemo(() => eclipticCircle(R), []);
  return (
    <Line
      points={points}
      color={palette.yellow}
      lineWidth={1.8}
      dashed
      dashSize={0.4}
      gapSize={0.25}
      toneMapped={false}
    />
  );
}
