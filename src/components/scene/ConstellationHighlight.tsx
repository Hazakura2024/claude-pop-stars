"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { arcSegments } from "@/lib/astro";
import { GLOBE_RADIUS, palette } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { Constellation } from "@/types/astro";

function HighlightLines({ constellation, color }: { constellation: Constellation; color: string }) {
  const segments = useMemo(
    () => arcSegments(constellation.lines, GLOBE_RADIUS * 1.001),
    [constellation],
  );

  return <Line points={segments} segments color={color} lineWidth={3.2} toneMapped={false} />;
}

/** 選択中の星座を黄色、ホバー中の星座をシアンで重ね描きする */
export function ConstellationHighlight({ constellations }: { constellations: Constellation[] }) {
  const selectedId = useSkyStore((s) => s.selectedId);
  const hoveredId = useSkyStore((s) => s.hoveredId);
  const byId = useMemo(() => new Map(constellations.map((c) => [c.id, c])), [constellations]);

  const selected = selectedId ? byId.get(selectedId) : undefined;
  const hovered = hoveredId && hoveredId !== selectedId ? byId.get(hoveredId) : undefined;

  return (
    <>
      {hovered && <HighlightLines constellation={hovered} color={palette.cyan} />}
      {selected && <HighlightLines constellation={selected} color={palette.yellow} />}
    </>
  );
}
