"use client";

import { Suspense, useEffect } from "react";

import { useSkyData } from "@/hooks/useSkyData";
import {
  bestViewing,
  bvToRgb,
  bvColorName,
  bvToTemperature,
  formatDec,
  formatRa,
  starLabel,
  VISIBILITY_LABEL,
  visibilityFrom,
} from "@/lib/astro";
import { useSkyStore } from "@/store/useSkyStore";

/** 略符（例: "Ser1" → "Ser"） */
function abbreviation(id: string): string {
  return id.replace(/\d+$/, "");
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] gap-2 py-1.5">
      <dt className="font-pixel text-pink text-[11px] tracking-[0.2em]">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

/** 星座・星のカードに共通の枠（閉じるボタン・見出し） */
function CardFrame({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  const clearSelection = useSkyStore((s) => s.clearSelection);
  return (
    <section
      aria-labelledby="info-card-title"
      className="neon-panel relative max-h-[60dvh] overflow-y-auto p-5"
    >
      <button
        type="button"
        onClick={clearSelection}
        aria-label="閉じる"
        className="border-pink/60 text-pink hover:bg-pink hover:text-void absolute top-3 right-4 grid size-7 place-items-center border text-sm transition-colors"
      >
        ✕
      </button>

      <p className="font-pixel text-cyan text-[11px] tracking-[0.3em]">{eyebrow}</p>
      <h2 id="info-card-title" className="text-sunset mt-1 pr-8 text-3xl font-bold">
        {title}
      </h2>
      {subtitle && (
        <p className="font-display text-ink-dim mt-0.5 text-xs tracking-widest">{subtitle}</p>
      )}

      <dl className="border-pink/30 mt-4 border-t pt-2">{children}</dl>
    </section>
  );
}

/** 見頃・東京からの見え方・位置の3行（星座と星で共通） */
function SkyRows({
  ra,
  dec,
  decRange,
  noun,
}: {
  ra: number;
  dec: number;
  decRange: [number, number];
  noun: string;
}) {
  const viewing = bestViewing(ra);
  const visibility = visibilityFrom(decRange);
  return (
    <>
      <Row label="見頃">
        {viewing.month}月{viewing.period}
        <span className="text-ink-dim">
          （20時ごろ南中・{viewing.season}の{noun}）
        </span>
      </Row>
      <Row label="東京から">
        <span className={visibility === "never" ? "text-ink-dim" : "text-mint"}>
          {/* 星は1点なので「全体が」は付けない */}
          {noun === "星" && visibility === "full" ? "見える" : VISIBILITY_LABEL[visibility]}
        </span>
      </Row>
      <Row label="位置">
        赤経 {formatRa(ra)} ／ 赤緯 {formatDec(dec)}
      </Row>
    </>
  );
}

function ConstellationCard({ id }: { id: string }) {
  const { constellations } = useSkyData();
  const c = constellations.constellations.find((v) => v.id === id);
  if (!c) return null;

  return (
    <CardFrame
      eyebrow={`CONSTELLATION / ${abbreviation(c.id)}`}
      title={c.ja}
      subtitle={
        <>
          {c.name}
          {c.en !== c.name && <span className="text-ink-dim/70"> — {c.en}</span>}
        </>
      }
    >
      <SkyRows ra={c.label[0]} dec={c.label[1]} decRange={c.decRange} noun="星座" />
      <Row label="明るい星">
        <ol className="space-y-1">
          {c.brightest.map((star) => {
            const { main, sub } = starLabel(star, c.genitive);
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
    </CardFrame>
  );
}

function StarCard({ id }: { id: string }) {
  const { starNames, constellations } = useSkyData();
  const select = useSkyStore((s) => s.select);
  const star = starNames.stars.find((s) => s.id === id);
  if (!star) return null;

  const { main, sub } = starLabel(star, star.genitive);
  const constellation = constellations.constellations.find((c) => c.id === star.con);
  const { bv } = star;
  const color =
    bv === null
      ? null
      : `rgb(${bvToRgb(bv)
          .map((v) => Math.round(v * 255))
          .join(" ")})`;

  return (
    <CardFrame
      eyebrow={`STAR / HIP ${star.id}`}
      title={main}
      // 日本語名を見出しにしたときは、英語の固有名を添える
      subtitle={star.ja && star.name && star.name !== main ? star.name : undefined}
    >
      {sub && <Row label="符号">{sub}</Row>}
      <Row label="等級">
        <span className="font-pixel text-yellow">{star.mag.toFixed(2)}等</span>
      </Row>
      {bv !== null && color && (
        <Row label="色">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block size-3 rounded-full"
              style={{
                background: color,
                boxShadow: `0 0 8px ${color}`,
              }}
            />
            {bvColorName(bv)}
            <span className="text-ink-dim">
              （表面温度 約{(Math.round(bvToTemperature(bv) / 100) * 100).toLocaleString()} K）
            </span>
          </span>
        </Row>
      )}
      {constellation && (
        <Row label="星座">
          <button
            type="button"
            onClick={() => select(constellation.id)}
            className="text-cyan decoration-cyan/50 hover:decoration-cyan underline underline-offset-4"
          >
            {constellation.ja} →
          </button>
        </Row>
      )}
      <SkyRows ra={star.ra} dec={star.dec} decRange={[star.dec, star.dec]} noun="星" />
    </CardFrame>
  );
}

/** 選択中の星座または星の情報カード。Esc で閉じる */
export function InfoCard() {
  const selectedId = useSkyStore((s) => s.selectedId);
  const selectedStarId = useSkyStore((s) => s.selectedStarId);
  const clearSelection = useSkyStore((s) => s.clearSelection);
  const open = selectedId !== null || selectedStarId !== null;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, clearSelection]);

  if (!open) return null;

  return (
    <div className="absolute inset-x-4 bottom-16 z-20 sm:right-auto sm:bottom-14 sm:left-6 sm:w-[22rem]">
      <Suspense fallback={null}>
        {selectedStarId && <StarCard id={selectedStarId} />}
        {selectedId && <ConstellationCard id={selectedId} />}
      </Suspense>
    </div>
  );
}
