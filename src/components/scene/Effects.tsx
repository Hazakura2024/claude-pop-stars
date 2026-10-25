"use client";

import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useMemo } from "react";
import * as THREE from "three";

/** ネオンの発光（Bloom）と、少しだけレトロなフィルム感 */
export function Effects() {
  const aberration = useMemo(() => new THREE.Vector2(0.0007, 0.0009), []);

  return (
    <EffectComposer multisampling={4}>
      <Bloom
        mipmapBlur
        intensity={1.25}
        luminanceThreshold={0.12}
        luminanceSmoothing={0.3}
        radius={0.75}
      />
      <ChromaticAberration offset={aberration} radialModulation={false} modulationOffset={0} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.12} />
      <Vignette eskil={false} offset={0.25} darkness={0.75} />
    </EffectComposer>
  );
}
