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
import { ConstellationLabels } from "./ConstellationLabels";
import { ConstellationLines } from "./ConstellationLines";
import { Effects } from "./Effects";
import { Globe } from "./Globe";
import { Stars } from "./Stars";

function Sky() {
  const { stars, constellations } = useSkyData();
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
      {layers.labels && <ConstellationLabels constellations={constellations.constellations} />}
    </>
  );
}

export default function CelestialCanvas() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ fov: 50, near: 0.001, far: 1000 }}
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
