import { describe, expect, it } from "vitest";

import {
  bvToRgb,
  bvToTemperature,
  eclipticToRaDec,
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
