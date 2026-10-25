/**
 * 天球座標 → Three.js のワールド座標。
 *
 * - +Y が天の北極
 * - 赤経 0h が +X、赤経 6h が -Z（北から見て反時計回りに赤経が増える）
 *
 * この向きにすると、天球の中心から見たとき東が左に来て実際の空と一致し、
 * 外から見たときは天球儀と同じく左右が反転する。
 */
export const DEG = Math.PI / 180;

/** 黄道傾斜角（J2000） */
export const OBLIQUITY_DEG = 23.4393;

export type Vec3 = [x: number, y: number, z: number];

export function raDecToVec3(raDeg: number, decDeg: number, radius = 1): Vec3 {
  const ra = raDeg * DEG;
  const dec = decDeg * DEG;
  const c = Math.cos(dec);
  return [radius * c * Math.cos(ra), radius * Math.sin(dec), -radius * c * Math.sin(ra)];
}

/** 黄経（度）→ 赤経・赤緯（度）。黄緯 0 の点（黄道上）のみ */
export function eclipticToRaDec(lambdaDeg: number): [ra: number, dec: number] {
  const l = lambdaDeg * DEG;
  const e = OBLIQUITY_DEG * DEG;
  const ra = Math.atan2(Math.sin(l) * Math.cos(e), Math.cos(l));
  const dec = Math.asin(Math.sin(e) * Math.sin(l));
  return [(ra / DEG + 360) % 360, dec / DEG];
}

/** 赤緯一定の小円（赤道や赤緯線）を点列で返す */
export function declinationCircle(decDeg: number, radius: number, segments = 128): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) =>
    raDecToVec3((i / segments) * 360, decDeg, radius),
  );
}

/** 赤経一定の大円の半分（北極→南極） */
export function rightAscensionMeridian(raDeg: number, radius: number, segments = 64): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) =>
    raDecToVec3(raDeg, 90 - (i / segments) * 180, radius),
  );
}

export function eclipticCircle(radius: number, segments = 180): Vec3[] {
  return Array.from({ length: segments + 1 }, (_, i) => {
    const [ra, dec] = eclipticToRaDec((i / segments) * 360);
    return raDecToVec3(ra, dec, radius);
  });
}

/**
 * 2点（赤経・赤緯）を大円に沿って結ぶ点列を返す（両端を含む）。
 * 2点を直線で結ぶと中ほどが球の内側に沈み、天球儀モードでは球に隠れてしまうため、
 * stepDeg 以下の間隔で球面上を補間する（球面線形補間 slerp）。
 */
export function greatCircleArc(
  [raA, decA]: [number, number],
  [raB, decB]: [number, number],
  radius = 1,
  stepDeg = 2,
): Vec3[] {
  const a = raDecToVec3(raA, decA);
  const b = raDecToVec3(raB, decB);
  const cosAngle = Math.min(Math.max(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1), 1);
  const angle = Math.acos(cosAngle);
  // 浮動小数点の誤差で 4°/2° が 2.0000001 になり余分に分割されないよう、わずかに差し引く
  const steps = Math.max(1, Math.ceil(angle / (stepDeg * DEG) - 1e-9));
  const sinAngle = Math.sin(angle);

  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    // ほぼ同じ点なら線形補間で十分（sin(angle) ≈ 0 での割り算を避ける）
    const [wa, wb] =
      sinAngle < 1e-6
        ? [1 - t, t]
        : [Math.sin((1 - t) * angle) / sinAngle, Math.sin(t * angle) / sinAngle];
    return [0, 1, 2].map((k) => radius * (wa * a[k] + wb * b[k])) as Vec3;
  });
}

/**
 * 星座線（折れ線の配列）を、大円に沿った短い線分の組 [p0, p1, p1, p2, …] に変換する。
 * drei の <Line segments> にそのまま渡せる。
 */
export function arcSegments(lines: [number, number][][], radius = 1, stepDeg = 2): Vec3[] {
  const points: Vec3[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.length - 1; i++) {
      const arc = greatCircleArc(line[i], line[i + 1], radius, stepDeg);
      for (let j = 0; j < arc.length - 1; j++) points.push(arc[j], arc[j + 1]);
    }
  }
  return points;
}
