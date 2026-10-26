/**
 * d3-celestial (BSD-3-Clause, © Olaf Frohn) の GeoJSON を取得し、
 * アプリで使う軽量 JSON に変換して public/data/ に書き出す。
 *
 *   pnpm data
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type {
  Constellation,
  ConstellationCatalog,
  NamedStar,
  NamedStarCatalog,
  NotableStar,
  RaDec,
  StarCatalog,
  StarRecord,
} from "../src/types/astro";

const SOURCE = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data";
const OUT_DIR = path.resolve(import.meta.dirname, "../public/data");
const MAG_LIMIT = 6;
/** 名前ラベルを用意する星の等級の上限 */
const NAME_MAG_LIMIT = 4;

type Position = [number, number];

interface Feature<G, P> {
  id: string | number;
  properties: P;
  geometry: G;
}

interface FeatureCollection<G, P> {
  features: Feature<G, P>[];
}

type StarFeature = Feature<{ coordinates: Position }, { mag: number; bv: string }>;
type LineFeature = Feature<{ coordinates: Position[][] }, { rank: string }>;
type NameFeature = Feature<
  { coordinates: Position },
  { name: string; ja: string; en: string; gen: string; rank: string }
>;

/** starnames.json: HIP 番号 → 名前と所属星座 */
type StarNames = Record<string, { name: string; ja?: string; desig: string; c: string }>;

interface MemberStar extends NotableStar {
  dec: number;
  position: RaDec;
}

async function fetchJson<T>(file: string): Promise<T> {
  const res = await fetch(`${SOURCE}/${file}`);
  if (!res.ok) throw new Error(`${file}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** GeoJSON の経度 (-180〜180) を赤経 (0〜360) に直し、小数を丸める */
function toRaDec([lon, lat]: Position): RaDec {
  const ra = (lon + 360) % 360;
  return [round(ra, 4), round(lat, 4)];
}

/** 角距離が最も近い点の添字 */
function nearestIndex([ra, dec]: RaDec, points: RaDec[]): number {
  const rad = Math.PI / 180;
  const cosDist = ([r, d]: RaDec) =>
    Math.sin(dec * rad) * Math.sin(d * rad) +
    Math.cos(dec * rad) * Math.cos(d * rad) * Math.cos((ra - r) * rad);
  let best = 0;
  points.forEach((p, i) => {
    if (cosDist(p) > cosDist(points[best])) best = i;
  });
  return best;
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

async function main() {
  const [stars, lines, names, starNames] = await Promise.all([
    fetchJson<FeatureCollection<StarFeature["geometry"], StarFeature["properties"]>>(
      "stars.6.json",
    ),
    fetchJson<FeatureCollection<LineFeature["geometry"], LineFeature["properties"]>>(
      "constellations.lines.json",
    ),
    fetchJson<FeatureCollection<NameFeature["geometry"], NameFeature["properties"]>>(
      "constellations.json",
    ),
    fetchJson<StarNames>("starnames.json"),
  ]);

  // 所属星座ごとに恒星をまとめる（略符 → 星の配列）
  const members = new Map<string, MemberStar[]>();
  for (const f of stars.features) {
    const info = starNames[String(f.id)];
    if (!info || f.properties.mag > MAG_LIMIT) continue;
    const position = toRaDec(f.geometry.coordinates);
    const list = members.get(info.c) ?? [];
    list.push({
      ja: info.ja ?? "",
      name: info.name,
      desig: info.desig,
      mag: round(f.properties.mag, 2),
      dec: position[1],
      position,
    });
    members.set(info.c, list);
  }

  const starRecords: StarRecord[] = stars.features
    .filter((f) => f.properties.mag <= MAG_LIMIT)
    .map((f): StarRecord => {
      const bv = Number.parseFloat(f.properties.bv);
      return [
        ...toRaDec(f.geometry.coordinates),
        round(f.properties.mag, 2),
        Number.isFinite(bv) ? round(bv, 3) : 0.6,
      ];
    })
    // 明るい星を後に描くと加算合成で埋もれにくい
    .sort((a, b) => b[2] - a[2]);

  // へび座 (Ser) は頭部・尾部の2つに分かれ、同じ id が2回現れるので出現順で対応させる
  const linesById = Map.groupBy(lines.features, (f) => String(f.id));
  const seen = new Map<string, number>();

  const constellations: Constellation[] = names.features.map((f) => {
    const id = String(f.id);
    const nth = seen.get(id) ?? 0;
    seen.set(id, nth + 1);
    const parts = linesById.get(id) ?? [];
    const label = toRaDec(f.geometry.coordinates);
    let stars = members.get(id) ?? [];
    if (parts.length > 1) {
      // へび座の星は、ラベル位置が近いほうの部分に振り分ける
      const labels = names.features
        .filter((g) => String(g.id) === id)
        .map((g) => toRaDec(g.geometry.coordinates));
      stars = stars.filter((s) => nearestIndex(s.position, labels) === nth);
    }
    const lineCoords = (parts[nth]?.geometry.coordinates ?? []).map((line) => line.map(toRaDec));
    const decs = [...stars.map((s) => s.dec), ...lineCoords.flat().map(([, d]) => d)];
    return {
      id: parts.length > 1 ? `${id}${nth + 1}` : id,
      name: f.properties.name,
      ja:
        parts.length > 1 ? `${f.properties.ja}（${nth === 0 ? "頭部" : "尾部"}）` : f.properties.ja,
      en: f.properties.en,
      genitive: f.properties.gen,
      rank: Number(f.properties.rank),
      brightest: stars
        .toSorted((a, b) => a.mag - b.mag)
        .slice(0, 3)
        .map(({ ja, name, desig, mag }) => ({ ja, name, desig, mag })),
      decRange: [Math.min(...decs), Math.max(...decs)],
      label,
      lines: lineCoords,
    };
  });

  // 名前ラベル用の星。属格は星座名データから引く（へび座は頭部・尾部とも "Serpentis"）
  const genitives = new Map(names.features.map((f) => [String(f.id), f.properties.gen]));
  const namedStars: NamedStar[] = stars.features
    .filter((f) => f.properties.mag <= NAME_MAG_LIMIT)
    .flatMap((f): NamedStar[] => {
      const info = starNames[String(f.id)];
      const genitive = info && genitives.get(info.c);
      // 元データには符号が欠けて "undefined3" になっている星がある（エリダヌス座υ³）
      const desig = info?.desig.includes("undefined") ? "" : info?.desig;
      if (!info || !genitive || !(desig || info.name)) return [];
      const [ra, dec] = toRaDec(f.geometry.coordinates);
      return [
        {
          ja: info.ja ?? "",
          name: info.name,
          desig,
          mag: round(f.properties.mag, 2),
          ra,
          dec,
          genitive,
        },
      ];
    })
    .sort((a, b) => a.mag - b.mag);

  const starCatalog: StarCatalog = { magLimit: MAG_LIMIT, stars: starRecords };
  const constellationCatalog: ConstellationCatalog = { constellations };
  const namedStarCatalog: NamedStarCatalog = { magLimit: NAME_MAG_LIMIT, stars: namedStars };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "stars.json"), JSON.stringify(starCatalog));
  await writeFile(path.join(OUT_DIR, "constellations.json"), JSON.stringify(constellationCatalog));
  await writeFile(path.join(OUT_DIR, "starnames.json"), JSON.stringify(namedStarCatalog));

  console.log(
    `✓ stars: ${starRecords.length}, constellations: ${constellations.length}, named stars: ${namedStars.length} → ${OUT_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
