/**
 * 星座の見頃と、日本（東京）からの見え方。
 */

/** 東京の緯度（度） */
export const TOKYO_LATITUDE = 35.7;

export type Season = "春" | "夏" | "秋" | "冬";

export interface BestViewing {
  /** 1〜12 */
  month: number;
  /** 上旬・中旬・下旬 */
  period: "上旬" | "中旬" | "下旬";
  season: Season;
}

/**
 * 20時ごろに南中する（いちばん高く昇る）時期を、赤経から求める。
 *
 * 0時の地方恒星時は 9/21 ごろに 0h で、1か月に約 2h ずつ進む。
 * 20時の恒星時 = 0時の恒星時 - 4h なので、赤経 α が 20時に南中するのは
 * 9/21 から (α + 4h) / 2h か月後。
 */
export function bestViewing(raDeg: number): BestViewing {
  const raHours = raDeg / 15;
  const monthsAfterSep21 = ((((raHours + 4) / 2) % 12) + 12) % 12;
  // 9/21 を 9 + 20/30 か月目とみなす
  const monthPos = (9 + 20 / 30 - 1 + monthsAfterSep21) % 12; // 0 = 1月1日
  const month = Math.floor(monthPos) + 1;
  const dayFraction = monthPos - Math.floor(monthPos);
  const period = dayFraction < 1 / 3 ? "上旬" : dayFraction < 2 / 3 ? "中旬" : "下旬";
  return { month, period, season: seasonOf(month) };
}

function seasonOf(month: number): Season {
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

export type Visibility = "circumpolar" | "full" | "partial" | "never";

/**
 * 星座の赤緯の範囲から、北緯 latitude の地点での見え方を判定する。
 * - circumpolar: 全体が一年中沈まない
 * - full: 全体が地平線より上に昇る
 * - partial: 一部しか昇らない
 * - never: まったく昇らない
 */
export function visibilityFrom(
  [minDec, maxDec]: [number, number],
  latitude = TOKYO_LATITUDE,
): Visibility {
  const horizon = latitude - 90; // これより南の赤緯は昇らない
  if (minDec > 90 - latitude) return "circumpolar";
  if (minDec > horizon) return "full";
  if (maxDec > horizon) return "partial";
  return "never";
}

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  circumpolar: "一年中沈まない",
  full: "全体が見える",
  partial: "一部だけ見える",
  never: "見えない",
};

/** 赤経（度）→ "5h 35m" */
export function formatRa(raDeg: number): string {
  const totalMinutes = Math.round((raDeg / 15) * 60) % (24 * 60);
  return `${Math.floor(totalMinutes / 60)}h ${String(totalMinutes % 60).padStart(2, "0")}m`;
}

/** 赤緯（度）→ "+5°" / "−52°" */
export function formatDec(decDeg: number): string {
  const d = Math.round(decDeg);
  return `${d >= 0 ? "+" : "−"}${Math.abs(d)}°`;
}
