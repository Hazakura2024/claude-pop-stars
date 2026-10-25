"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { raDecToVec3, type Vec3 } from "@/lib/astro";
import { GLOBE_RADIUS, palette } from "@/lib/theme";
import type { Constellation } from "@/types/astro";

/** 全星座の線分を1つの Line2 にまとめて描画する（ドローコール1回） */
export function ConstellationLines({ constellations }: { constellations: Constellation[] }) {
  const segments = useMemo(() => {
    const points: Vec3[] = [];
    for (const c of constellations) {
      for (const line of c.lines) {
        for (let i = 0; i < line.length - 1; i++) {
          points.push(
            raDecToVec3(...line[i], GLOBE_RADIUS),
            raDecToVec3(...line[i + 1], GLOBE_RADIUS),
          );
        }
      }
    }
    return points;
  }, [constellations]);

  return (
    <Line
      points={segments}
      segments
      color={palette.pink}
      lineWidth={1.6}
      transparent
      opacity={0.85}
      toneMapped={false}
    />
  );
}
