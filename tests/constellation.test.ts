import { describe, expect, it } from "vitest";

import {
  bestViewing,
  buildPickTargets,
  formatDec,
  formatRa,
  pickConstellation,
  raDecToVec3,
  visibilityFrom,
} from "@/lib/astro";
import type { Constellation } from "@/types/astro";

describe("bestViewing（20時に南中する時期）", () => {
  it("ベテルギウス（5.92h）は 2月中旬・冬", () => {
    expect(bestViewing(5.92 * 15)).toEqual({ month: 2, period: "中旬", season: "冬" });
  });
  it("レグルス（10.14h）は 4月下旬・春", () => {
    expect(bestViewing(10.14 * 15)).toEqual({ month: 4, period: "下旬", season: "春" });
  });
  it("アンタレス（16.49h）は 7月下旬・夏", () => {
    expect(bestViewing(16.49 * 15)).toEqual({ month: 7, period: "下旬", season: "夏" });
  });
  it("赤経 0h は秋分の 2か月後の 11月・秋", () => {
    expect(bestViewing(0)).toMatchObject({ month: 11, season: "秋" });
  });
});

describe("visibilityFrom（東京）", () => {
  it("こぐま座は沈まない", () => expect(visibilityFrom([66, 89])).toBe("circumpolar"));
  it("オリオン座は全体が見える", () => expect(visibilityFrom([-10, 20])).toBe("full"));
  it("りゅうこつ座は一部だけ", () => expect(visibilityFrom([-70, -50])).toBe("partial"));
  it("はちぶんぎ座は見えない", () => expect(visibilityFrom([-89, -75])).toBe("never"));
});

describe("format", () => {
  it("赤経", () => expect(formatRa(83.82)).toBe("5h 35m"));
  it("赤経 24h は 0h に丸める", () => expect(formatRa(359.999)).toBe("0h 00m"));
  it("赤緯", () => {
    expect(formatDec(5.4)).toBe("+5°");
    expect(formatDec(-52.3)).toBe("−52°");
  });
});

describe("pickConstellation", () => {
  const make = (id: string, ra: number): Constellation => ({
    id,
    name: id,
    ja: id,
    en: id,
    genitive: id,
    rank: 1,
    brightest: [],
    decRange: [0, 10],
    label: [ra, 30],
    lines: [
      [
        [ra, 0],
        [ra + 10, 0],
      ],
    ],
  });
  const targets = buildPickTargets([make("A", 0), make("B", 90)]);

  it("線分の近くをクリックするとその星座", () => {
    expect(pickConstellation(raDecToVec3(5, 1), targets, 4)).toBe("A");
    expect(pickConstellation(raDecToVec3(95, -1), targets, 4)).toBe("B");
  });
  it("ラベルの近くでも選べる", () => {
    expect(pickConstellation(raDecToVec3(90, 31), targets, 4)).toBe("B");
  });
  it("どれからも遠ければ null", () => {
    expect(pickConstellation(raDecToVec3(45, -40), targets, 4)).toBeNull();
  });
});
