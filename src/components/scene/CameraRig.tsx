"use client";

import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { type ComponentRef, useEffect, useRef } from "react";
import * as THREE from "three";

import { raDecToVec3 } from "@/lib/astro";
import { useSkyStore } from "@/store/useSkyStore";

/** 初期視点はオリオン座の方向 */
const HOME: [ra: number, dec: number] = [84, 8];
const OUTSIDE_DISTANCE = 28;
const DEFAULT_FOV = 50;
const INSIDE_FOV_RANGE: [number, number] = [20, 100];

/**
 * ドラッグ回転・ズーム・自転を担当。
 * - outside: カメラが天球の周りを回る。ホイールで距離を変える
 * - inside : カメラは中心付近に固定。ドラッグで見回し、ホイールで画角を変える
 */
export function CameraRig() {
  // カメラは R3F のストアが持つ可変オブジェクトなので、エフェクト内で get() から取り出して操作する
  const get = useThree((s) => s.get);
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null);
  const viewMode = useSkyStore((s) => s.viewMode);
  const autoRotate = useSkyStore((s) => s.autoRotate);
  const resetToken = useSkyStore((s) => s.resetToken);

  useEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const dir = new THREE.Vector3(...raDecToVec3(...HOME));
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

  useEffect(() => {
    if (viewMode !== "inside") return;
    const { camera: cam, gl } = get();
    const camera = cam as THREE.PerspectiveCamera;
    const domElement = gl.domElement;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
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
      minDistance={inside ? 0.001 : 14}
      maxDistance={inside ? 0.1 : 60}
      // 内側ではドラッグ方向を反転して「空をつかんで動かす」感覚にする
      rotateSpeed={inside ? -0.35 : 0.6}
      autoRotate={autoRotate}
      autoRotateSpeed={inside ? 0.25 : 0.6}
      dampingFactor={0.08}
    />
  );
}
