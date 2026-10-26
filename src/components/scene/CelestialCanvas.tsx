"use client";

import { Stars as Starfield } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";

import { useSkyData } from "@/hooks/useSkyData";
import { palette } from "@/lib/theme";
import { useSkyStore } from "@/store/useSkyStore";

import { Armillary } from "./Armillary";
import { CameraRig } from "./CameraRig";
import { CelestialGrid, Ecliptic } from "./CelestialGrid";
import { ConstellationHighlight } from "./ConstellationHighlight";
import { ConstellationLabels } from "./ConstellationLabels";
import { ConstellationLines } from "./ConstellationLines";
import { ConstellationPicker } from "./ConstellationPicker";
import { Effects } from "./Effects";
import { Globe } from "./Globe";
import { StarLabels } from "./StarLabels";
import { Stars } from "./Stars";

function Sky() {
  const { stars, constellations, starNames } = useSkyData();
  const layers = useSkyStore((s) => s.layers);
  const viewMode = useSkyStore((s) => s.viewMode);
  const setReady = useSkyStore((s) => s.setReady);

  useEffect(() => setReady(true), [setReady]);

  return (
    <>
      {viewMode === "outside" && (
        <>
          <Globe />
          <Armillary />
          {/* 天球儀の背景を飾る遠景の星（実データではない） */}
          <Starfield
            radius={120}
            depth={60}
            count={2500}
            factor={5}
            saturation={1}
            fade
            speed={0.6}
          />
        </>
      )}
      <Stars catalog={stars} />
      {layers.grid && <CelestialGrid />}
      {layers.ecliptic && <Ecliptic />}
      {layers.constellations && (
        <ConstellationLines constellations={constellations.constellations} />
      )}
      <ConstellationHighlight constellations={constellations.constellations} />
      {layers.labels && <ConstellationLabels constellations={constellations.constellations} />}
      {layers.starNames && <StarLabels catalog={starNames} />}
      <ConstellationPicker constellations={constellations.constellations} />
    </>
  );
}

export default function CelestialCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      // near を小さくしすぎると深度の精度が落ち、球の表面と星・線の前後判定が揺れてちらつく。
      // 一番近い描画物でも 10（天球の半径）離れているので 0.1 で十分
      camera={{ fov: 50, near: 0.1, far: 1000 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      className="touch-none"
    >
      <color attach="background" args={[palette.void]} />
      <Suspense fallback={null}>
        <Sky />
      </Suspense>
      <CameraRig />
      <Effects />
    </Canvas>
  );
}
