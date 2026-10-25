"use client";

import { Suspense, useEffect } from "react";

import { useSkyData } from "@/hooks/useSkyData";
import { bestViewing, formatDec, formatRa, VISIBILITY_LABEL, visibilityFrom } from "@/lib/astro";
import { useSkyStore } from "@/store/useSkyStore";
import type { Constellation, NotableStar } from "@/types/astro";

/** 略符（例: "Ser1" → "Ser"） */
function abbreviation(id: string): string {
  return id.replace(/\d+$/, "");
}

function starLabel(star: NotableStar, c: Constellation): { main: string; sub: string } {
  const designation = `${star.desig} ${c.genitive}`.trim();
  if (star.ja) return { main: star.ja, sub: designation };
  if (star.name) return { main: star.name, sub: designation };
  return { main: designation, sub: "" };
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 py-1.5">
      <dt className="font-pixel text-pink text-[11px] tracking-[0.2em]">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function CardBody({ id }: { id: string }) {
  const { constellations } = useSkyData();
  const select = useSkyStore((s) => s.select);
  const c = constellations.constellations.find((v) => v.id === id);
  if (!c) return null;

  const viewing = bestViewing(c.label[0]);
  const visibility = visibilityFrom(c.decRange);

  return (
    <section
      aria-labelledby="info-card-title"
      className="neon-panel relative max-h-[60dvh] overflow-y-auto p-5"
    >
      <button
        type="button"
        onClick={() => select(null)}
        aria-label="閉じる"
        className="border-pink/60 text-pink hover:bg-pink hover:text-void absolute top-3 right-4 grid size-7 place-items-center border text-sm transition-colors"
      >
        ✕
      </button>

      <p className="font-pixel text-cyan text-[11px] tracking-[0.3em]">
        CONSTELLATION / {abbreviation(c.id)}
      </p>
      <h2 id="info-card-title" className="text-sunset mt-1 pr-8 text-3xl font-bold">
        {c.ja}
      </h2>
      <p className="font-display text-ink-dim mt-0.5 text-xs tracking-widest">
        {c.name}
        {c.en !== c.name && <span className="text-ink-dim/70"> — {c.en}</span>}
      </p>

      <dl className="border-pink/30 mt-4 border-t pt-2">
        <Row label="見頃">
          {viewing.month}月{viewing.period}
          <span className="text-ink-dim">（20時ごろ南中・{viewing.season}の星座）</span>
        </Row>
        <Row label="東京から">
          <span className={visibility === "never" ? "text-ink-dim" : "text-mint"}>
            {VISIBILITY_LABEL[visibility]}
          </span>
        </Row>
        <Row label="位置">
          赤経 {formatRa(c.label[0])} ／ 赤緯 {formatDec(c.label[1])}
        </Row>
        <Row label="明るい星">
          <ol className="space-y-1">
            {c.brightest.map((star) => {
              const { main, sub } = starLabel(star, c);
              return (
                <li key={`${star.desig}-${star.mag}`} className="flex items-baseline gap-2">
                  <span className="font-bold">{main}</span>
                  {sub && <span className="text-ink-dim text-xs">{sub}</span>}
                  <span className="font-pixel text-yellow ml-auto text-xs">
                    {star.mag.toFixed(2)}等
                  </span>
                </li>
              );
            })}
          </ol>
        </Row>
      </dl>
    </section>
  );
}

/** 選択中の星座の情報カード。Esc で閉じる */
export function InfoCard() {
  const selectedId = useSkyStore((s) => s.selectedId);
  const select = useSkyStore((s) => s.select);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") select(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, select]);

  if (!selectedId) return null;

  return (
    <div className="absolute inset-x-4 bottom-16 z-20 sm:right-auto sm:bottom-14 sm:left-6 sm:w-[22rem]">
      <Suspense fallback={null}>
        <CardBody id={selectedId} />
      </Suspense>
    </div>
  );
}
