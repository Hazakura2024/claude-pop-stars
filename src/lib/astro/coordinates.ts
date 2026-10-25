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
