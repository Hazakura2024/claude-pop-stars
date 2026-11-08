"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

import { raDecToVec3 } from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";

const toWorld = new THREE.Vector3();
const toCamera = new THREE.Vector3();

/** 検索で選んだ星に付ける、点滅するリング */
export function StarMarker() {
  const focus = useSkyStore((s) => (s.focus?.kind === "star" ? s.focus : null));
  const viewMode = useSkyStore((s) => s.viewMode);
  const ref = useRef<HTMLDivElement>(null);

  const position = useMemo(
    () => focus && new THREE.Vector3(...raDecToVec3(focus.ra, focus.dec, GLOBE_RADIUS)),
    [focus],
  );

  // 天球儀モードで星が裏側へ回ったら隠す
  useFrame(({ camera }) => {
    const el = ref.current;
    if (!el || !position) return;
    if (viewMode === "inside") {
      el.style.opacity = "1";
      return;
    }
    toCamera.copy(camera.position).normalize();
    const facing = toWorld.copy(position).normalize().dot(toCamera);
    el.style.opacity = String(THREE.MathUtils.smoothstep(facing, 0.05, 0.35));
  });

  if (!position) return null;

  return (
    <Html position={position} center zIndexRange={[6, 0]} style={{ pointerEvents: "none" }}>
      <div ref={ref} className="star-marker" aria-hidden />
    </Html>
  );
}
