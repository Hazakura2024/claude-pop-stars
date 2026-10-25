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
  RaDec,
  StarCatalog,
  StarRecord,
} from "../src/types/astro";

const SOURCE = "https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data";
const OUT_DIR = path.resolve(import.meta.dirname, "../public/data");
const MAG_LIMIT = 6;

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
type NameFeature = Feature<{ coordinates: Position }, { name: string; ja: string; rank: string }>;

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

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}

async function main() {
  const [stars, lines, names] = await Promise.all([
    fetchJson<FeatureCollection<StarFeature["geometry"], StarFeature["properties"]>>(
      "stars.6.json",
    ),
    fetchJson<FeatureCollection<LineFeature["geometry"], LineFeature["properties"]>>(
      "constellations.lines.json",
    ),
    fetchJson<FeatureCollection<NameFeature["geometry"], NameFeature["properties"]>>(
      "constellations.json",
    ),
  ]);

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
    return {
      id: parts.length > 1 ? `${id}${nth + 1}` : id,
      name: f.properties.name,
      ja:
        parts.length > 1 ? `${f.properties.ja}（${nth === 0 ? "頭部" : "尾部"}）` : f.properties.ja,
      rank: Number(f.properties.rank),
      label: toRaDec(f.geometry.coordinates),
      lines: (parts[nth]?.geometry.coordinates ?? []).map((line) => line.map(toRaDec)),
    };
  });

  const starCatalog: StarCatalog = { magLimit: MAG_LIMIT, stars: starRecords };
  const constellationCatalog: ConstellationCatalog = { constellations };

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, "stars.json"), JSON.stringify(starCatalog));
  await writeFile(path.join(OUT_DIR, "constellations.json"), JSON.stringify(constellationCatalog));

  console.log(
    `✓ stars: ${starRecords.length}, constellations: ${constellations.length} → ${OUT_DIR}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
