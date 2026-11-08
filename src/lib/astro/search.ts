/**
 * 星・星座の検索。ひらがな／カタカナ、大文字／小文字、ギリシャ文字の読み（"beta" → "β"）の
 * 違いを吸収して照合する。
 */
import type { Constellation, NamedStar } from "@/types/astro";

export type SearchResult =
  { kind: "constellation"; constellation: Constellation } | { kind: "star"; star: NamedStar };

interface SearchEntry {
  result: SearchResult;
  /** 正規化した検索キー */
  keys: string[];
  /** 同じ一致度のときの並び順（小さいほど上）。星座を先に、星は明るい順 */
  order: number;
}

const GREEK: Record<string, string> = {
  alpha: "α",
  beta: "β",
  gamma: "γ",
  delta: "δ",
  epsilon: "ε",
  zeta: "ζ",
  eta: "η",
  theta: "θ",
  iota: "ι",
  kappa: "κ",
  lambda: "λ",
  mu: "μ",
  nu: "ν",
  xi: "ξ",
  omicron: "ο",
  pi: "π",
  rho: "ρ",
  sigma: "σ",
  tau: "τ",
  upsilon: "υ",
  phi: "φ",
  chi: "χ",
  psi: "ψ",
  omega: "ω",
};
// 長い読みから試す（"epsilon" より先に "eta" が当たらないように）
const GREEK_PATTERN = new RegExp(
  `\\b(${Object.keys(GREEK)
    .toSorted((a, b) => b.length - a.length)
    .join("|")})`,
  "g",
);

/** 全角半角・大文字小文字・ひらがなカタカナを揃え、空白と記号を除く */
export function normalizeQuery(text: string): string {
  return (
    text
      // NFKC で全角英数を半角に、上付き数字（³）を普通の数字にする
      .normalize("NFKC")
      .toLowerCase()
      // ひらがな → カタカナ
      .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60))
      .replace(/[\s・·'’.\-()（）]/g, "")
  );
}

/** ギリシャ文字の読みを文字に置き換えた検索語（"beta ceti" → "βceti"） */
function greekVariant(text: string): string {
  return normalizeQuery(text.toLowerCase().replace(GREEK_PATTERN, (w) => GREEK[w]));
}

/** 略符（例: "Ser1" → "Ser"） */
function abbreviation(id: string): string {
  return id.replace(/\d+$/, "");
}

export function buildSearchIndex(
  stars: NamedStar[],
  constellations: Constellation[],
): SearchEntry[] {
  const byId = new Map(constellations.map((c) => [c.id, c]));
  const constellationEntries = constellations.map((c): SearchEntry => ({
    result: { kind: "constellation", constellation: c },
    keys: [c.ja, c.name, c.en, c.genitive, abbreviation(c.id)].map(normalizeQuery),
    // 星の等級より必ず小さい値（-Infinity 同士の引き算は NaN になるので使わない）
    order: -100,
  }));
  const starEntries = stars.map((s): SearchEntry => {
    const con = byId.get(s.con);
    const keys = [s.ja, s.name];
    if (s.desig) {
      keys.push(`${s.desig} ${s.genitive}`, `${s.desig} ${abbreviation(s.con)}`);
      // 「オリオン座β」のような日本語の呼び方
      if (con) keys.push(`${con.ja.replace(/（.+）$/, "")}${s.desig}`);
    }
    return {
      result: { kind: "star", star: s },
      keys: keys.filter(Boolean).map(normalizeQuery),
      order: s.mag,
    };
  });
  return [...constellationEntries, ...starEntries];
}

/** 一致度。前方一致 0、部分一致 1、一致しなければ null */
function matchScore(keys: string[], queries: string[]): number | null {
  let best: number | null = null;
  for (const key of keys) {
    for (const q of queries) {
      if (key.startsWith(q)) return 0;
      if (key.includes(q)) best = 1;
    }
  }
  return best;
}

/** 一致度の高い順、同じなら明るい順に最大 limit 件 */
export function searchSky(index: SearchEntry[], text: string, limit = 8): SearchResult[] {
  const queries = [...new Set([normalizeQuery(text), greekVariant(text)])].filter(Boolean);
  if (queries.length === 0) return [];
  return index
    .flatMap((entry) => {
      const score = matchScore(entry.keys, queries);
      return score === null ? [] : [{ entry, score }];
    })
    .sort((a, b) => a.score - b.score || a.entry.order - b.entry.order)
    .slice(0, limit)
    .map(({ entry }) => entry.result);
}
