/**
 * クリック位置からいちばん近い星座を探す。
 */
import type { Constellation } from "@/types/astro";

import { arcSegments, DEG, raDecToVec3, type Vec3 } from "./coordinates";

export interface PickTarget {
  id: string;
  /** 星座線を大円に沿って分割した短い線分（単位ベクトルの組） */
  segments: [Vec3, Vec3][];
  label: Vec3;
}

export function buildPickTargets(constellations: Constellation[]): PickTarget[] {
  return constellations.map((c) => ({
    id: c.id,
    segments: pairs(arcSegments(c.lines)),
    label: raDecToVec3(...c.label),
  }));
}

function pairs(points: Vec3[]): [Vec3, Vec3][] {
  return Array.from({ length: points.length / 2 }, (_, i) => [points[2 * i], points[2 * i + 1]]);
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** 点 p と線分 ab の距離（3次元の直線距離） */
function distanceToSegment(p: Vec3, a: Vec3, b: Vec3): number {
  const ab = sub(b, a);
  const t = Math.min(Math.max(dot(sub(p, a), ab) / (dot(ab, ab) || 1), 0), 1);
  const d = sub(p, [a[0] + ab[0] * t, a[1] + ab[1] * t, a[2] + ab[2] * t]);
  return Math.sqrt(dot(d, d));
}

/** 単位球面上の弦の長さ → 角距離（度） */
function chordToDegrees(chord: number): number {
  return (2 * Math.asin(Math.min(chord / 2, 1))) / DEG;
}

/**
 * 方向 dir（単位ベクトル）から maxDegrees 以内でいちばん近い星座の id を返す。
 * 星座線とラベル位置の近いほうで測る。
 */
export function pickConstellation(
  dir: Vec3,
  targets: PickTarget[],
  maxDegrees: number,
): string | null {
  let bestId: string | null = null;
  let bestChord = Infinity;
  for (const t of targets) {
    let chord = Math.sqrt(dot(sub(dir, t.label), sub(dir, t.label)));
    for (const [a, b] of t.segments) chord = Math.min(chord, distanceToSegment(dir, a, b));
    if (chord < bestChord) {
      bestChord = chord;
      bestId = t.id;
    }
  }
  return chordToDegrees(bestChord) <= maxDegrees ? bestId : null;
}
