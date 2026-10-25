"use client";

import { GLOBE_RADIUS, palette } from "@/lib/theme";

const DEG = Math.PI / 180;

/** 天球儀の子午環・地平環。天球儀モードの装飾 */
export function Armillary() {
  return (
    <group>
      {/* 子午環（縦のリング） */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS * 1.1, 0.06, 12, 160]} />
        <meshBasicMaterial color={palette.yellow} toneMapped={false} />
      </mesh>
      {/* 地平環（横のリング） */}
      <mesh rotation={[90 * DEG, 0, 0]}>
        <torusGeometry args={[GLOBE_RADIUS * 1.16, 0.1, 12, 160]} />
        <meshBasicMaterial color={palette.violet} toneMapped={false} />
      </mesh>
      {/* 極軸 */}
      <mesh>
        <cylinderGeometry args={[0.04, 0.04, GLOBE_RADIUS * 2.4, 8]} />
        <meshBasicMaterial color={palette.cyan} toneMapped={false} />
      </mesh>
    </group>
  );
}
