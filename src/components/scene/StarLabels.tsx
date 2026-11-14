"use client";

import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import {
  degreesPerPixel,
  magnitudeToSize,
  raDecToVec3,
  starLabel,
  starLabelMagLimit,
} from "@/lib/astro";
import { type LabelPlacement, type LabelRequest, placeLabels } from "@/lib/labelLayout";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";
import type { NamedStarCatalog } from "@/types/astro";

const toWorld = new THREE.Vector3();
const toCamera = new THREE.Vector3();
const projected = new THREE.Vector3();

/**
 * 拡大したときに、星の下へ名前とバイエル符号を出す。
 * 拡大の度合い（1px あたりの角度）に応じて、明るい星から順に表示数を増やす。
 * 名前どうしが重なるときは、明るい星（選択中・ホバー中の星は最優先）から置いていき、
 * 後の名前は上・右・左・斜めへずらす。どこにも置けなければ隠す。
 */
export function StarLabels({ catalog }: { catalog: NamedStarCatalog }) {
  const lang = useSkyStore((s) => s.labelLang);
  const parts = useSkyStore((s) => s.starLabelParts);
  const viewMode = useSkyStore((s) => s.viewMode);
  // 選択中・ホバー中の星は、拡大が足りなくても名前を出す
  const selectedStarId = useSkyStore((s) => s.selectedStarId);
  const hoveredStarId = useSkyStore((s) => s.hoveredStarId);
  const [magLimit, setMagLimit] = useState<number | null>(null);
  // 星の id → ラベルの要素。並び順は選択やホバーで変わり、drei の <Html> の中身は
  // 別のタイミングで描画されるので、添字ではなく id で対応させる
  const refs = useRef(new Map<string, HTMLDivElement>());
  // ラベルの大きさ（px）。文字が変わらない限り同じなので、測るのは一度だけにする
  const sizes = useRef(new WeakMap<HTMLDivElement, { width: number; height: number }>());
  // 前のフレームの置き場所。変わったときだけ DOM を書き換える
  const placements = useRef(new WeakMap<HTMLDivElement, LabelPlacement | null>());

  // 言語や表示する項目を切り替えると文字が変わるので測り直す
  useEffect(() => {
    sizes.current = new WeakMap();
  }, [lang, parts]);

  const items = useMemo(
    () =>
      catalog.stars.map((star) => ({
        ...star,
        position: new THREE.Vector3(...raDecToVec3(star.ra, star.dec, GLOBE_RADIUS)),
        // 星の光に文字が重ならないよう、明るい星ほど下へずらす（px）
        offset: 4 + magnitudeToSize(star.mag) * 0.35,
      })),
    [catalog],
  );
  // 重なりを解く優先順に並べる（カタログは明るい順なので、選択中・ホバー中の星だけを先頭へ）
  const visible = useMemo(() => {
    const pinned = [selectedStarId, hoveredStarId].flatMap(
      (id) => items.find((s) => s.id === id) ?? [],
    );
    const unique = [...new Set(pinned)];
    const shown = items.filter(
      (s) => magLimit !== null && s.mag <= magLimit && !unique.includes(s),
    );
    return [...unique, ...shown];
  }, [items, magLimit, selectedStarId, hoveredStarId]);

  useFrame(({ camera, size }) => {
    const { fov } = camera as THREE.PerspectiveCamera;
    const inside = viewMode === "inside";
    const distance = inside ? GLOBE_RADIUS : camera.position.length() - GLOBE_RADIUS;
    const limit = starLabelMagLimit(degreesPerPixel(fov, size.height, distance, GLOBE_RADIUS));
    // しきい値を越えたときだけ再レンダーする
    if (limit !== magLimit) setMagLimit(limit);

    toCamera.copy(camera.position).normalize();
    // 天球儀モードでは裏側の名前をフェードアウトさせる
    const fades = visible.map((item) =>
      inside
        ? 1
        : THREE.MathUtils.smoothstep(
            toWorld.copy(item.position).normalize().dot(toCamera),
            0.05,
            0.35,
          ),
    );

    const requests = visible.map((item, i): LabelRequest | null => {
      const el = refs.current.get(item.id);
      if (!el || fades[i] < 0.5) return null;
      projected.copy(item.position).project(camera);
      // カメラの後ろ
      if (projected.z > 1) return null;
      let box = sizes.current.get(el);
      if (!box) {
        // 非表示（カメラの後ろで display: none）の間は測れないので、測れたときだけ覚える
        if (!el.offsetWidth) return null;
        box = { width: el.offsetWidth, height: el.offsetHeight };
        sizes.current.set(el, box);
      }
      const x = ((projected.x + 1) / 2) * size.width;
      const y = ((1 - projected.y) / 2) * size.height;
      const previous = placements.current.get(el)?.candidate;
      return { x, y, offset: item.offset, previous, ...box };
    });

    const result = placeLabels(requests);
    visible.forEach((item, i) => {
      const el = refs.current.get(item.id);
      if (!el) return;
      const p = result[i];
      el.style.opacity = String(p ? fades[i] : 0);
      // 隠したラベルは前の位置のまま（フェードアウト中に動かさない）
      if (!p) return;
      const prev = placements.current.get(el);
      if (prev?.dx !== p.dx || prev.dy !== p.dy) {
        el.style.transform = `translate(${p.dx}px, ${p.dy}px)`;
        el.style.alignItems = p.align;
      }
      placements.current.set(el, p);
    });
  });

  /** ラベルの要素を id で登録する ref コールバック。外れたら（同じ要素のときだけ）消す */
  const register = useCallback(
    (id: string) => (el: HTMLDivElement | null) => {
      if (!el) return;
      const map = refs.current;
      map.set(id, el);
      return () => {
        if (map.get(id) === el) map.delete(id);
      };
    },
    [],
  );

  return visible.map((star) => {
    const { main, sub } = starLabel(star, star.genitive, lang);
    // 固有名の無い星は符号が1段目（名前）になるので、符号を隠す設定でも残す
    const designation = parts.designation && sub;
    return (
      <Html
        key={star.id}
        position={star.position}
        center
        zIndexRange={[5, 0]}
        // center 指定時は pointerEvents プロップが効かないので style で指定する
        style={{ pointerEvents: "none" }}
      >
        <div
          ref={register(star.id)}
          className="star-label"
          // SkyPicker が名前のクリックを判定するのに使う
          data-star-id={star.id}
          style={{ "--star-offset": `${star.offset}px` } as React.CSSProperties}
        >
          <span className="star-label-main">{main}</span>
          {(designation || parts.magnitude) && (
            <span className="star-label-sub">
              {designation && <span>{designation}</span>}
              {/* 等級は情報カードと同じく黄色のドット文字で */}
              {parts.magnitude && (
                <span className="star-label-mag">
                  {star.mag.toFixed(2)}
                  {lang === "ja" ? "等" : " mag"}
                </span>
              )}
            </span>
          )}
        </div>
      </Html>
    );
  });
}
