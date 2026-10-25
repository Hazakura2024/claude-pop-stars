"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { raDecToVec3 } from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { Constellation } from "@/types/astro";

const toWorld = new THREE.Vector3();
const toCamera = new THREE.Vector3();

export function ConstellationLabels({ constellations }: { constellations: Constellation[] }) {
  const lang = useSkyStore((s) => s.labelLang);
  const viewMode = useSkyStore((s) => s.viewMode);
  const selectedId = useSkyStore((s) => s.selectedId);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const items = useMemo(
    () =>
      constellations.map((c) => ({
        ...c,
        position: new THREE.Vector3(...raDecToVec3(...c.label, GLOBE_RADIUS * 1.01)),
      })),
    [constellations],
  );

  // 天球儀モードでは裏側のラベルをフェードアウトさせる
  useFrame(({ camera }) => {
    if (viewMode !== "outside") return;
    toCamera.copy(camera.position).normalize();
    items.forEach((item, i) => {
      const el = refs.current[i];
      if (!el) return;
      const facing = toWorld.copy(item.position).normalize().dot(toCamera);
      el.style.opacity = String(THREE.MathUtils.smoothstep(facing, 0.05, 0.35));
    });
  });

  return items.map((c, i) => (
    <Html
      key={c.id}
      position={c.position}
      center
      zIndexRange={[10, 0]}
      // center 指定時は pointerEvents プロップが効かないので style で指定する
      style={{ pointerEvents: "none" }}
    >
      <div
        ref={(el) => {
          refs.current[i] = el;
        }}
        className="constellation-label"
        data-rank={c.rank}
        data-selected={c.id === selectedId || undefined}
        style={viewMode === "inside" ? { opacity: 1 } : undefined}
      >
        {lang === "ja" ? c.ja : c.name}
      </div>
    </Html>
  ));
}
