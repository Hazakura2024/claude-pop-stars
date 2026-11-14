"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useRef } from "react";
import * as THREE from "three";

import {
  degreesPerPixelToShow,
  distanceForDegreesPerPixel,
  fovForDegreesPerPixel,
  raDecToVec3,
} from "@/lib/astro";
import { GLOBE_RADIUS } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";

/** 初期視点はオリオン座の方向 */
const HOME: [ra: number, dec: number] = [84, 8];
const OUTSIDE_DISTANCE = 28;
const OUTSIDE_DISTANCE_RANGE: [number, number] = [14, 60];
const DEFAULT_FOV = 50;
const INSIDE_FOV_RANGE: [number, number] = [20, 100];
/** 検索した星へカメラを移動させる時間（秒） */
const FLIGHT_DURATION = 1.2;

/**
 * 検索した星への移動。向きは球面に沿って回し、距離（outside）か画角（inside）を同時に変える。
 * 向きは「カメラが見ている天球上の方向」で表す。
 */
interface Flight {
  rotation: THREE.Quaternion;
  from: THREE.Vector3;
  fromValue: number;
  toValue: number;
  t: number;
}

const identity = new THREE.Quaternion();
const step = new THREE.Quaternion();
const lookDir = new THREE.Vector3();

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
}

/**
 * ドラッグ回転・ズーム・自転と、検索した星への移動を担当。
 * - outside: カメラが天球の周りを回る。ホイールで距離を変える
 * - inside : カメラは中心付近に固定。ドラッグで見回し、ホイールで画角を変える
 */
export function CameraRig() {
  // カメラは R3F のストアが持つ可変オブジェクトなので、エフェクト内で get() から取り出して操作する
  const get = useThree((s) => s.get);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const flight = useRef<Flight | null>(null);
  const viewMode = useSkyStore((s) => s.viewMode);
  // 星座・星を選んでいる間は、カードの内容と画面がずれないよう自動回転を止める
  const autoRotate = useSkyStore(
    (s) => s.autoRotate && s.selectedId === null && s.selectedStarId === null,
  );
  const resetToken = useSkyStore((s) => s.resetToken);
  const focusToken = useSkyStore((s) => s.focusToken);

  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const dir = new THREE.Vector3(...raDecToVec3(...HOME));
    flight.current = null;
    if (viewMode === "outside") {
      // 縦長画面（スマホ）では天球儀が横にはみ出さないよう距離を伸ばす
      const fit = Math.max(1, 0.9 / camera.aspect);
      camera.position.copy(dir).multiplyScalar(Math.min(OUTSIDE_DISTANCE * fit, 60));
    } else {
      // 中心からわずかに後ろへ置き、原点（target）越しに HOME 方向を見る
      camera.position.copy(dir).multiplyScalar(-0.01);
    }
    camera.fov = DEFAULT_FOV;
    camera.updateProjectionMatrix();
    controls.current?.target.set(0, 0, 0);
    controls.current?.update();
  }, [get, viewMode, resetToken]);

  // 検索で星・星座が選ばれたら、そこへ向かう移動を始める
  useEffect(() => {
    const focus = useSkyStore.getState().focus;
    if (!focus) return;
    const { camera: cam, size } = get();
    const camera = cam as THREE.PerspectiveCamera;
    const inside = useSkyStore.getState().viewMode === "inside";
    const to = new THREE.Vector3(...raDecToVec3(focus.ra, focus.dec));
    const from = camera.position.clone().normalize();
    if (inside) from.negate();

    // 星なら名前が表示されるところまで拡大する（すでに十分近ければそのまま）
    const degPerPx = focus.mag === undefined ? null : degreesPerPixelToShow(focus.mag);
    let fromValue: number;
    let toValue: number;
    if (inside) {
      fromValue = camera.fov;
      toValue = degPerPx
        ? THREE.MathUtils.clamp(
            Math.min(fromValue, fovForDegreesPerPixel(degPerPx, size.height)),
            ...INSIDE_FOV_RANGE,
          )
        : fromValue;
    } else {
      fromValue = camera.position.length();
      toValue = degPerPx
        ? THREE.MathUtils.clamp(
            Math.min(
              fromValue,
              GLOBE_RADIUS +
                distanceForDegreesPerPixel(degPerPx, camera.fov, size.height, GLOBE_RADIUS),
            ),
            ...OUTSIDE_DISTANCE_RANGE,
          )
        : fromValue;
    }
    flight.current = {
      rotation: new THREE.Quaternion().setFromUnitVectors(from, to),
      from,
      fromValue,
      toValue,
      t: 0,
    };
  }, [get, focusToken]);

  useFrame(({ camera: cam }, delta) => {
    const f = flight.current;
    if (!f) return;
    const camera = cam as THREE.PerspectiveCamera;
    f.t = Math.min(f.t + delta / FLIGHT_DURATION, 1);
    const e = easeInOutCubic(f.t);
    lookDir.copy(f.from).applyQuaternion(step.slerpQuaternions(identity, f.rotation, e));
    const value = THREE.MathUtils.lerp(f.fromValue, f.toValue, e);
    if (viewMode === "inside") {
      camera.position.copy(lookDir).multiplyScalar(-camera.position.length());
      camera.fov = value;
      camera.updateProjectionMatrix();
    } else {
      camera.position.copy(lookDir).multiplyScalar(value);
    }
    controls.current?.update();
    if (f.t === 1) flight.current = null;
  });

  useEffect(() => {
    if (viewMode !== "inside") return;
    const { camera: cam, gl } = get();
    const camera = cam as THREE.PerspectiveCamera;
    const domElement = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      flight.current = null;
      camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.04, ...INSIDE_FOV_RANGE);
      camera.updateProjectionMatrix();
    };
    domElement.addEventListener("wheel", onWheel, { passive: false });
    return () => domElement.removeEventListener("wheel", onWheel);
  }, [get, viewMode]);

  const inside = viewMode === "inside";

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableZoom={!inside}
      minDistance={inside ? 0.001 : OUTSIDE_DISTANCE_RANGE[0]}
      maxDistance={inside ? 0.1 : OUTSIDE_DISTANCE_RANGE[1]}
      // 内側ではドラッグ方向を反転して「空をつかんで動かす」感覚にする
      rotateSpeed={inside ? -0.35 : 0.6}
      autoRotate={autoRotate}
      autoRotateSpeed={inside ? 0.25 : 0.6}
      dampingFactor={0.08}
      // ドラッグやホイールで操作したら、移動の途中でもそちらを優先する
      onStart={() => {
        flight.current = null;
      }}
    />
  );
}
