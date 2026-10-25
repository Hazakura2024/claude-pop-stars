"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { arcSegments } from "@/lib/astro";
import { GLOBE_RADIUS, palette } from "@/lib/theme";
import type { Constellation } from "@/types/astro";

/**
 * 全星座の線分を1つの Line2 にまとめて描画する（ドローコール1回）。
 * 線は大円に沿って分割し、長い線でも球に沈んで隠れないようにする。
 */
export function ConstellationLines({ constellations }: { constellations: Constellation[] }) {
  const segments = useMemo(
    () => constellations.flatMap((c) => arcSegments(c.lines, GLOBE_RADIUS)),
    [constellations],
  );

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
