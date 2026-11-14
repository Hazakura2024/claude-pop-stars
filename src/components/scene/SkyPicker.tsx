"use client";

import { type ThreeEvent, useThree } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

import {
  buildPickTargets,
  buildStarPickTargets,
  degreesPerPixel,
  pickConstellation,
  pickStar,
  type Vec3,
} from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { Constellation, NamedStar } from "@/types/astro";

type PointerLike = Pick<PointerEvent, "pointerType" | "clientX" | "clientY">;

/** 画面上でこの距離（px）以内に星座線・ラベル・星があれば選択できる */
const PICK_RADIUS_PX = { mouse: 18, touch: 28 };
/** これ以上ポインターが動いたらドラッグとみなし、クリックとして扱わない（px） */
const DRAG_THRESHOLD = 5;

/**
 * 画面座標 (x, y) の下にある、表示中の星の名前ラベルの星 id。
 * ラベルは pointer-events: none（ラベルの上からでもドラッグで回せるように）なので、
 * イベントは受け取らず、ここで位置を調べる。重なりは StarLabels が解いているので最初の1つでよい。
 */
function starIdAtLabel(x: number, y: number): string | null {
  for (const el of document.querySelectorAll<HTMLElement>(".star-label[data-star-id]")) {
    // 重なって隠したラベルや、裏側でフェードアウトしたラベルは対象外
    if (Number(el.style.opacity || 1) < 0.5) continue;
    const r = el.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom)
      return el.dataset.starId ?? null;
  }
  return null;
}

/**
 * 天球と同じ大きさの透明な球でクリック・ホバーを受け取り、選択モードに応じて
 * 近くの星座か星を探す。色も深度も書き込まないので見た目には影響しない。
 */
export function SkyPicker({
  constellations,
  stars,
}: {
  constellations: Constellation[];
  stars: NamedStar[];
}) {
  const constellationTargets = useMemo(() => buildPickTargets(constellations), [constellations]);
  const starTargets = useMemo(() => buildStarPickTargets(stars), [stars]);
  const get = useThree((s) => s.get);

  /**
   * ポインターの先の星座か星を探す。星モードでは名前のラベルの上なら、その星を選ぶ。
   * それ以外は画面上のピクセル距離を天球上の角度（度）に換算し、近いものを探す
   */
  const pick = (point: THREE.Vector3, { pointerType, clientX, clientY }: PointerLike) => {
    const { camera: cam, size } = get();
    const camera = cam as THREE.PerspectiveCamera;
    const px = pointerType === "touch" ? PICK_RADIUS_PX.touch : PICK_RADIUS_PX.mouse;
    const { viewMode, pickMode } = useSkyStore.getState();
    if (pickMode === "star") {
      const labeled = starIdAtLabel(clientX, clientY);
      if (labeled) return labeled;
    }
    const distance = viewMode === "inside" ? GLOBE_RADIUS : camera.position.length() - GLOBE_RADIUS;
    const maxDegrees = px * degreesPerPixel(camera.fov, size.height, distance, GLOBE_RADIUS);
    const dir = point.clone().normalize().toArray() as Vec3;
    return pickMode === "star"
      ? pickStar(dir, starTargets, maxDegrees)
      : pickConstellation(dir, constellationTargets, maxDegrees);
  };

  const setCursor = (cursor: string) => {
    get().gl.domElement.style.cursor = cursor;
  };

  const hover = (id: string | null) => {
    const s = useSkyStore.getState();
    if (s.pickMode === "star") s.hoverStar(id);
    else s.hover(id);
    setCursor(id ? "pointer" : "");
  };

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => hover(pick(e.point, e.nativeEvent));

  const onPointerOut = () => hover(null);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > DRAG_THRESHOLD) return;
    e.stopPropagation();
    const id = pick(e.point, e.nativeEvent as PointerEvent);
    const s = useSkyStore.getState();
    if (s.pickMode === "star") s.selectStar(id);
    else s.select(id);
  };

  return (
    <mesh onClick={onClick} onPointerMove={onPointerMove} onPointerOut={onPointerOut}>
      <sphereGeometry args={[GLOBE_RADIUS, 48, 32]} />
      <meshBasicMaterial side={THREE.DoubleSide} colorWrite={false} depthWrite={false} />
    </mesh>
  );
}
