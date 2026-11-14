"use client";

import { Line } from "@react-three/drei";
import { useMemo } from "react";

import { arcSegments } from "@/lib/astro";
import { GLOBE_RADIUS, palette } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { Constellation, NamedStar } from "@/types/astro";

function HighlightLines({ constellation, color }: { constellation: Constellation; color: string }) {
  const segments = useMemo(
    () => arcSegments(constellation.lines, GLOBE_RADIUS * 1.001),
    [constellation],
  );

  return <Line points={segments} segments color={color} lineWidth={3.2} toneMapped={false} />;
}

/**
 * 選択中の星座を黄色、ホバー中の星座をシアンで重ね描きする。
 * 星を選んでいるときは、その星が属する星座を黄色にする。
 */
export function ConstellationHighlight({
  constellations,
  stars,
}: {
  constellations: Constellation[];
  stars: NamedStar[];
}) {
  const hoveredId = useSkyStore((s) => s.hoveredId);
  const selectedId = useSkyStore((s) => s.selectedId);
  const selectedStarId = useSkyStore((s) => s.selectedStarId);
  const byId = useMemo(() => new Map(constellations.map((c) => [c.id, c])), [constellations]);
  const starById = useMemo(() => new Map(stars.map((s) => [s.id, s])), [stars]);

  const selectedConstellationId =
    selectedId ?? (selectedStarId ? starById.get(selectedStarId)?.con : undefined);
  const selected = selectedConstellationId ? byId.get(selectedConstellationId) : undefined;
  const hovered =
    hoveredId && hoveredId !== selectedConstellationId ? byId.get(hoveredId) : undefined;

  return (
    <>
      {hovered && <HighlightLines constellation={hovered} color={palette.cyan} />}
      {selected && <HighlightLines constellation={selected} color={palette.yellow} />}
    </>
  );
}
