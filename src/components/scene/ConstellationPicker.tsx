"use client";

import { type ThreeEvent, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import { buildPickTargets, degreesPerPixel, pickConstellation, type Vec3 } from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { Constellation } from "@/types/astro";

/** 画面上でこの距離（px）以内に星座線かラベルがあれば選択できる */
const PICK_RADIUS_PX = { mouse: 18, touch: 28 };
/** これ以上ポインターが動いたらドラッグとみなし、クリックとして扱わない（px） */
const DRAG_THRESHOLD = 5;

/**
 * 天球と同じ大きさの透明な球でクリック・ホバーを受け取り、近くの星座を探す。
 * 色も深度も書き込まないので見た目には影響しない。
 */
export function ConstellationPicker({ constellations }: { constellations: Constellation[] }) {
  const targets = useMemo(() => buildPickTargets(constellations), [constellations]);
  const get = useThree((s) => s.get);
  const select = useSkyStore((s) => s.select);
  const hover = useSkyStore((s) => s.hover);

  /** 画面上のピクセル距離を、天球上の角度（度）に換算して星座を探す */
  const pick = (point: THREE.Vector3, pointerType: string) => {
    const { camera: cam, size } = get();
    const camera = cam as THREE.PerspectiveCamera;
    const px = pointerType === "touch" ? PICK_RADIUS_PX.touch : PICK_RADIUS_PX.mouse;
    const inside = useSkyStore.getState().viewMode === "inside";
    const distance = inside ? GLOBE_RADIUS : camera.position.length() - GLOBE_RADIUS;
    const maxDegrees = px * degreesPerPixel(camera.fov, size.height, distance, GLOBE_RADIUS);
    const dir = point.clone().normalize().toArray() as Vec3;
    return pickConstellation(dir, targets, maxDegrees);
  };

  const setCursor = (cursor: string) => {
    get().gl.domElement.style.cursor = cursor;
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    const id = pick(e.point, e.pointerType);
    hover(id);
    setCursor(id ? "pointer" : "");
  };

  const onPointerOut = () => {
    hover(null);
    setCursor("");
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > DRAG_THRESHOLD) return;
    e.stopPropagation();
    select(pick(e.point, (e.nativeEvent as PointerEvent).pointerType ?? "mouse"));
  };

  return (
    <mesh onClick={onClick} onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
      <sphereGeometry args={[GLOBE_RADIUS, 48, 32]} />
      <meshBasicMaterial side={THREE.DoubleSide} colorWrite={false} depthWrite={false} />
    </mesh>
  );
}
