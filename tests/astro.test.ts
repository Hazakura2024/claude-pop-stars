import { describe, expect, it } from "vitest";

import {
  arcSegments,
  bvToRgb,
  bvToTemperature,
  eclipticToRaDec,
  greatCircleArc,
  magnitudeToSize,
  raDecToVec3,
} from "@/lib/astro";

const close = (a: number[], b: number[]) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i], 6));

describe("raDecToVec3", () => {
  it("赤経0h・赤緯0° は +X", () => close(raDecToVec3(0, 0), [1, 0, 0]));
  it("天の北極は +Y", () => close(raDecToVec3(123, 90), [0, 1, 0]));
  it("赤経6h は -Z", () => close(raDecToVec3(90, 0), [0, 0, -1]));
  it("半径を掛ける", () => close(raDecToVec3(0, 0, 10), [10, 0, 0]));
});

describe("eclipticToRaDec", () => {
  it("春分点は (0, 0)", () => close(eclipticToRaDec(0), [0, 0]));
  it("夏至点は赤経6h・赤緯+23.44°", () => {
    const [ra, dec] = eclipticToRaDec(90);
    expect(ra).toBeCloseTo(90, 4);
    expect(dec).toBeCloseTo(23.4393, 4);
  });
});

describe("photometry", () => {
  it("明るい星ほど大きい", () => {
    expect(magnitudeToSize(-1.46)).toBeGreaterThan(magnitudeToSize(1));
    expect(magnitudeToSize(1)).toBeGreaterThan(magnitudeToSize(5.5));
  });

  it("太陽 (B-V≈0.65) は 5700〜5900K 前後", () => {
    const t = bvToTemperature(0.65);
    expect(t).toBeGreaterThan(5600);
    expect(t).toBeLessThan(6000);
  });

  it("青い星は青、赤い星は赤寄り", () => {
    const [rb, , bb] = bvToRgb(-0.2);
    const [rr, , br] = bvToRgb(1.8);
    expect(bb).toBeGreaterThan(rb);
    expect(rr).toBeGreaterThan(br);
  });
});

describe("greatCircleArc / arcSegments", () => {
  const length = (v: number[]) => Math.hypot(...v);

  it("両端は元の2点に一致する", () => {
    const arc = greatCircleArc([10, 20], [60, -10], 10);
    close(arc[0], raDecToVec3(10, 20, 10));
    close(arc[arc.length - 1], raDecToVec3(60, -10, 10));
  });

  it("途中の点もすべて球面上にある（直線のように沈まない）", () => {
    for (const p of greatCircleArc([0, 0], [90, 0], 10)) expect(length(p)).toBeCloseTo(10, 6);
  });

  it("赤道上 90° の弧の中点は赤経 45°", () => {
    const arc = greatCircleArc([0, 0], [90, 0], 1, 3); // 30分割 → 31点、真ん中は 15番目
    close(arc[15], raDecToVec3(45, 0));
  });

  it("間隔は stepDeg 以下", () => {
    expect(greatCircleArc([0, 0], [30, 0], 1, 2).length).toBe(16); // 15分割 + 1
  });

  it("同じ点同士でも NaN にならない", () => {
    const arc = greatCircleArc([30, 30], [30, 30]);
    expect(arc.flat().every(Number.isFinite)).toBe(true);
  });

  it("arcSegments は線分の組を返す", () => {
    const segs = arcSegments(
      [
        [
          [0, 0],
          [4, 0],
          [4, 4],
        ],
      ],
      1,
      2,
    );
    expect(segs).toHaveLength((2 + 2) * 2); // 各4°を2分割 × 2本、1線分=2点
    close(segs[1], segs[2]); // 前の線分の終点 = 次の線分の始点
  });
});
