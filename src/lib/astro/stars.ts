/**
 * 星の名前ラベル。表示する文字列と、拡大の度合いに応じた表示数を決める。
 */
import type { NotableStar } from "@/types/astro";

import { DEG } from "./coordinates";

const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";

/** 符号の末尾の番号を上付きにする（例: "π3" → "π³"）。フラムスティード番号だけの符号はそのまま */
function formatDesignation(desig: string): string {
  return desig.replace(
    /(\D)(\d+)$/,
    (_, letter: string, digits: string) =>
      letter + [...digits].map((d) => SUPERSCRIPT[Number(d)]).join(""),
  );
}

/**
 * 星の表示名。固有名を上の行、「符号＋属格」（例: "β Ceti"）を下の行にする。
 * 固有名が無ければ符号だけを1行で出す。
 */
export function starLabel(
  star: NotableStar,
  genitive: string,
  lang: "ja" | "en" = "ja",
): { main: string; sub: string } {
  const designation = star.desig ? `${formatDesignation(star.desig)} ${genitive}` : "";
  const name = lang === "ja" ? star.ja || star.name : star.name;
  return name ? { main: name, sub: designation } : { main: designation, sub: "" };
}

/**
 * 画面の1pxが天球上で何度にあたるか。
 * distance はカメラから見ている面までの距離（外から見るなら 距離 − 半径、内側なら半径）。
 */
export function degreesPerPixel(
  fovDeg: number,
  heightPx: number,
  distance: number,
  radius: number,
): number {
  // 1px あたりのワールド長 = 2·d·tan(fov/2) / 画面の高さ
  const worldPerPixel = (2 * distance * Math.tan((fovDeg * DEG) / 2)) / heightPx;
  return worldPerPixel / radius / DEG;
}

/** 拡大するほど暗い星まで名前を出す（1px あたりの角度が小さいほど拡大している） */
const STAR_LABEL_TIERS = [
  { maxDegreesPerPixel: 0.03, magLimit: 4 },
  { maxDegreesPerPixel: 0.045, magLimit: 3 },
  { maxDegreesPerPixel: 0.06, magLimit: 2 },
];

/** 名前を出す星の等級の上限。拡大が足りなければ null */
export function starLabelMagLimit(degPerPx: number): number | null {
  return STAR_LABEL_TIERS.find((t) => degPerPx <= t.maxDegreesPerPixel)?.magLimit ?? null;
}
