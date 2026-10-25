/** 赤経・赤緯（度）。赤経は 0〜360 */
export type RaDec = [ra: number, dec: number];

/** public/data/stars.json の1レコード */
export type StarRecord = [ra: number, dec: number, mag: number, bv: number];

export interface StarCatalog {
  /** 収録した最も暗い等級 */
  magLimit: number;
  stars: StarRecord[];
}

export interface Constellation {
  /** IAU 略符（例: "Ori"） */
  id: string;
  /** ラテン語名（例: "Orion"） */
  name: string;
  /** 日本語名（例: "オリオン座"） */
  ja: string;
  /** 1(主要)〜3(マイナー) */
  rank: number;
  /** ラベル表示位置 */
  label: RaDec;
  /** 星座線（折れ線の配列） */
  lines: RaDec[][];
}

export interface ConstellationCatalog {
  constellations: Constellation[];
}
