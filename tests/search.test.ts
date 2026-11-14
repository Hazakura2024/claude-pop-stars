import { describe, expect, it } from "vitest";

import {
  buildSearchIndex,
  degreesPerPixel,
  degreesPerPixelToShow,
  distanceForDegreesPerPixel,
  fovForDegreesPerPixel,
  normalizeQuery,
  type SearchResult,
  searchSky,
  starLabelMagLimit,
} from "@/lib/astro";
import type { Constellation, NamedStar } from "@/types/astro";

const constellation = (id: string, ja: string, name: string, genitive: string): Constellation => ({
  id,
  name,
  ja,
  en: name,
  genitive,
  rank: 1,
  brightest: [],
  decRange: [0, 10],
  label: [0, 0],
  lines: [],
});

const star = (
  id: string,
  ja: string,
  name: string,
  desig: string,
  mag: number,
  con: string,
  genitive: string,
): NamedStar => ({ id, ja, name, desig, mag, ra: 0, dec: 0, con, genitive, bv: null });

const index = buildSearchIndex(
  [
    star("1", "リゲル", "Rigel", "β", 0.18, "Ori", "Orionis"),
    star("2", "ベテルギウス", "Betelgeuse", "α", 0.45, "Ori", "Orionis"),
    star("3", "ディフダ", "Diphda", "β", 2.04, "Cet", "Ceti"),
    star("4", "", "", "π3", 3.19, "Ori", "Orionis"),
  ],
  [
    constellation("Ori", "オリオン座", "Orion", "Orionis"),
    constellation("Cet", "くじら座", "Cetus", "Ceti"),
  ],
);

const ids = (results: SearchResult[]) =>
  results.map((r) => (r.kind === "star" ? r.star.id : r.constellation.id));

describe("normalizeQuery", () => {
  it("ひらがなをカタカナに、大文字を小文字に、空白を除く", () => {
    expect(normalizeQuery("でぃふだ")).toBe("ディフダ");
    expect(normalizeQuery("Beta  Ceti")).toBe("betaceti");
  });
  it("全角英数と上付き数字を揃える", () => {
    expect(normalizeQuery("ＤＩＰＨＤＡ")).toBe("diphda");
    expect(normalizeQuery("π³")).toBe("π3");
  });
});

describe("searchSky", () => {
  it("ひらがなでも日本語名で見つかる", () =>
    expect(ids(searchSky(index, "でぃふだ"))).toEqual(["3"]));
  it("英語名は大文字小文字を区別しない", () => {
    expect(ids(searchSky(index, "DIPHDA"))).toEqual(["3"]);
  });
  it("ギリシャ文字の読み・属格・略符で探せる", () => {
    expect(ids(searchSky(index, "beta ceti"))).toEqual(["3"]);
    expect(ids(searchSky(index, "β cet"))).toEqual(["3"]);
    expect(ids(searchSky(index, "pi3 ori"))).toEqual(["4"]);
  });
  it("「オリオン座β」のような日本語の呼び方", () => {
    expect(ids(searchSky(index, "オリオン座β"))).toEqual(["1"]);
  });
  it("星座が先、星は明るい順", () => {
    expect(ids(searchSky(index, "オリオン"))).toEqual(["Ori", "1", "2", "4"]);
  });
  it("前方一致を部分一致より先に出す（星座より先でも）", () => {
    // "ri" は Rigel に前方一致、Orion・Orionis には部分一致
    expect(ids(searchSky(index, "ri"))).toEqual(["1", "Ori", "2", "4"]);
  });
  it("空の検索語では何も出さない", () => expect(searchSky(index, "  ")).toEqual([]));
});

describe("拡大率の逆算", () => {
  it("distanceForDegreesPerPixel は degreesPerPixel の逆", () => {
    const d = distanceForDegreesPerPixel(0.04, 50, 800, 10);
    expect(degreesPerPixel(50, 800, d, 10)).toBeCloseTo(0.04, 9);
  });
  it("fovForDegreesPerPixel は degreesPerPixel の逆（距離＝半径）", () => {
    const fov = fovForDegreesPerPixel(0.04, 800);
    expect(degreesPerPixel(fov, 800, 10, 10)).toBeCloseTo(0.04, 9);
  });
  it("degreesPerPixelToShow まで拡大すると、その等級の星の名前が出る", () => {
    for (const mag of [-1.4, 2, 2.5, 3.9]) {
      expect(starLabelMagLimit(degreesPerPixelToShow(mag))).toBeGreaterThanOrEqual(mag);
    }
  });
});
