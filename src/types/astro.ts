/** 赤経・赤緯（度）。赤経は 0〜360 */
export type RaDec = [ra: number, dec: number];

/** public/data/stars.json の1レコード */
export type StarRecord = [ra: number, dec: number, mag: number, bv: number];

export interface StarCatalog {
  /** 収録した最も暗い等級 */
  magLimit: number;
  stars: StarRecord[];
}

/** 星座に属する明るい星 */
export interface NotableStar {
  /** 日本語の固有名（無ければ空文字） */
  ja: string;
  /** 英語の固有名（無ければ空文字） */
  name: string;
  /** バイエル符号・フラムスティード番号など（例: "α"） */
  desig: string;
  mag: number;
}

export interface Constellation {
  /** IAU 略符（例: "Ori"） */
  id: string;
  /** ラテン語名（例: "Orion"） */
  name: string;
  /** 日本語名（例: "オリオン座"） */
  ja: string;
  /** 英語名（例: "Orion"、"Air Pump"） */
  en: string;
  /** ラテン語の属格。星の名前に使う（例: "Orionis"） */
  genitive: string;
  /** 1(主要)〜3(マイナー) */
  rank: number;
  /** 明るい順に最大3つ */
  brightest: NotableStar[];
  /** 星座線の頂点と属する恒星を合わせた赤緯の範囲 [最小, 最大]（度） */
  decRange: [min: number, max: number];
  /** ラベル表示位置 */
  label: RaDec;
  /** 星座線（折れ線の配列） */
  lines: RaDec[][];
}

export interface ConstellationCatalog {
  constellations: Constellation[];
}
