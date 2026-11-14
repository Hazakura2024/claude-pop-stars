"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { raDecToVec3 } from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { NamedStar, NamedStarCatalog } from "@/types/astro";

const toWorld = new THREE.Vector3();
const toCamera = new THREE.Vector3();

/** 星に付けるリング。選択中は黄色で脈打ち、ホバー中はシアンの細いリング */
function Marker({ star, variant }: { star: NamedStar; variant: "selected" | "hovered" }) {
  const viewMode = useSkyStore((s) => s.viewMode);
  const ref = useRef<HTMLDivElement>(null);
  const position = useMemo(
    () => new THREE.Vector3(...raDecToVec3(star.ra, star.dec, GLOBE_RADIUS)),
    [star],
  );

  // 天球儀モードで星が裏側へ回ったら隠す
  useFrame(({ camera }) => {
    const el = ref.current;
    if (!el) return;
    if (viewMode === "inside") {
      el.style.opacity = "1";
      return;
    }
    toCamera.copy(camera.position).normalize();
    const facing = toWorld.copy(position).normalize().dot(toCamera);
    el.style.opacity = String(THREE.MathUtils.smoothstep(facing, 0.05, 0.35));
  });

  return (
    <Html position={position} center zIndexRange={[6, 0]} style={{ pointerEvents: "none" }}>
      <div ref={ref} className="star-marker" data-variant={variant} aria-hidden />
    </Html>
  );
}

/** 選択中・ホバー中の星の目印 */
export function StarMarker({ catalog }: { catalog: NamedStarCatalog }) {
  const selectedStarId = useSkyStore((s) => s.selectedStarId);
  const hoveredStarId = useSkyStore((s) => s.hoveredStarId);
  const byId = useMemo(() => new Map(catalog.stars.map((s) => [s.id, s])), [catalog]);

  const selected = selectedStarId ? byId.get(selectedStarId) : undefined;
  const hovered =
    hoveredStarId && hoveredStarId !== selectedStarId ? byId.get(hoveredStarId) : undefined;

  return (
    <>
      {hovered && <Marker key={hovered.id} star={hovered} variant="hovered" />}
      {selected && <Marker key={selected.id} star={selected} variant="selected" />}
    </>
  );
}
