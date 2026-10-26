"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  degreesPerPixel,
  magnitudeToSize,
  raDecToVec3,
  starLabel,
  starLabelMagLimit,
} from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { NamedStarCatalog } from "@/types/astro";

const toWorld = new THREE.Vector3();
const toCamera = new THREE.Vector3();

/**
 * 拡大したときに、星の下へ名前とバイエル符号を出す。
 * 拡大の度合い（1px あたりの角度）に応じて、明るい星から順に表示数を増やす。
 */
export function StarLabels({ catalog }: { catalog: NamedStarCatalog }) {
  const lang = useSkyStore((s) => s.labelLang);
  const viewMode = useSkyStore((s) => s.viewMode);
  const [magLimit, setMagLimit] = useState<number | null>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  const items = useMemo(
    () =>
      catalog.stars.map((star) => ({
        ...star,
        key: `${star.ra},${star.dec}`,
        position: new THREE.Vector3(...raDecToVec3(star.ra, star.dec, GLOBE_RADIUS)),
        // 星の光に文字が重ならないよう、明るい星ほど下へずらす（px）
        offset: 4 + magnitudeToSize(star.mag) * 0.35,
      })),
    [catalog],
  );
  const visible = useMemo(
    () => (magLimit === null ? [] : items.filter((s) => s.mag <= magLimit)),
    [items, magLimit],
  );

  useFrame(({ camera, size }) => {
    const { fov } = camera as THREE.PerspectiveCamera;
    const inside = viewMode === "inside";
    const distance = inside ? GLOBE_RADIUS : camera.position.length() - GLOBE_RADIUS;
    const limit = starLabelMagLimit(degreesPerPixel(fov, size.height, distance, GLOBE_RADIUS));
    // しきい値を越えたときだけ再レンダーする
    if (limit !== magLimit) setMagLimit(limit);

    // 天球儀モードでは裏側の名前をフェードアウトさせる
    if (inside) return;
    toCamera.copy(camera.position).normalize();
    visible.forEach((item, i) => {
      const el = refs.current[i];
      if (!el) return;
      const facing = toWorld.copy(item.position).normalize().dot(toCamera);
      el.style.opacity = String(THREE.MathUtils.smoothstep(facing, 0.05, 0.35));
    });
  });

  return visible.map((star, i) => {
    const { main, sub } = starLabel(star, star.genitive, lang);
    return (
      <Html
        key={star.key}
        position={star.position}
        center
        zIndexRange={[5, 0]}
        // center 指定時は pointerEvents プロップが効かないので style で指定する
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="star-label"
          style={
            {
              "--star-offset": `${star.offset}px`,
              ...(viewMode === "inside" && { opacity: 1 }),
            } as React.CSSProperties
          }
        >
          <span className="star-label-main">{main}</span>
          {sub && <span className="star-label-sub">{sub}</span>}
        </div>
      </Html>
    );
  });
}
