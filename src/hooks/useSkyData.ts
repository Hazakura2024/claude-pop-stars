import { use } from "react";

import type { ConstellationCatalog, NamedStarCatalog, StarCatalog } from "@/types/astro";

export interface SkyData {
  stars: StarCatalog;
  constellations: ConstellationCatalog;
  starNames: NamedStarCatalog;
}

let cache: Promise<SkyData> | undefined;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return (await res.json()) as T;
}

function loadSkyData(): Promise<SkyData> {
  cache ??= Promise.all([
    fetchJson<StarCatalog>("/data/stars.json"),
    fetchJson<ConstellationCatalog>("/data/constellations.json"),
    fetchJson<NamedStarCatalog>("/data/starnames.json"),
  ]).then(([stars, constellations, starNames]) => ({ stars, constellations, starNames }));
  return cache;
}

/** 星データを読み込む。読み込み中は最寄りの <Suspense> がフォールバックを表示する */
export function useSkyData(): SkyData {
  return use(loadSkyData());
}
