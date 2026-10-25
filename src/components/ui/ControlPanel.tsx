"use client";

import { useState } from "react";

import { type LabelLang, type Layers, useSkyStore, type ViewMode } from "@/store/useSkyStore";

import { SegmentedControl } from "./SegmentedControl";
import { Toggle } from "./Toggle";

const LAYER_LABELS: Record<keyof Layers, string> = {
  constellations: "星座線",
  labels: "星座名",
  grid: "赤経・赤緯グリッド",
  ecliptic: "黄道",
};

const VIEW_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "outside", label: "Globe" },
  { value: "inside", label: "Planetarium" },
];

const LANG_OPTIONS: { value: LabelLang; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "en", label: "Latin" },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-pixel text-pink mt-4 mb-2 text-[11px] tracking-[0.25em] first:mt-0">
      {children}
    </h2>
  );
}

export function ControlPanel() {
  // null = 未操作。PC では開き、スマホでは閉じた状態を CSS で出し分ける（SSR とずれないように）
  const [open, setOpen] = useState<boolean | null>(null);
  const s = useSkyStore();

  return (
    <aside className="absolute top-4 right-4 z-20 w-64 sm:top-6 sm:right-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !(v ?? window.matchMedia("(min-width: 640px)").matches))}
        aria-expanded={open ?? undefined}
        aria-controls="control-panel"
        className="bg-pink font-display text-void ml-auto block px-3 py-1 text-[11px] font-bold tracking-[0.2em] shadow-[var(--glow-pink)]"
      >
        {open === null ? (
          <>
            <span className="sm:hidden">CONTROL ☰</span>
            <span className="hidden sm:inline">CLOSE ✕</span>
          </>
        ) : open ? (
          "CLOSE ✕"
        ) : (
          "CONTROL ☰"
        )}
      </button>

      <div
        id="control-panel"
        className={`neon-panel mt-2 p-4 ${open === null ? "hidden sm:block" : open ? "block" : "hidden"}`}
      >
        <SectionTitle>VIEW MODE</SectionTitle>
        <SegmentedControl
          label="視点"
          value={s.viewMode}
          options={VIEW_OPTIONS}
          onChange={s.setViewMode}
        />
        <p className="text-ink-dim mt-1.5 text-[11px] leading-relaxed">
          {s.viewMode === "outside"
            ? "外から見る天球儀。星座は左右反転して見えます。"
            : "中心から見上げる空。実際の夜空と同じ向きです。"}
        </p>

        <SectionTitle>LAYERS</SectionTitle>
        {(Object.keys(LAYER_LABELS) as (keyof Layers)[]).map((key) => (
          <Toggle
            key={key}
            label={LAYER_LABELS[key]}
            checked={s.layers[key]}
            onChange={() => s.toggleLayer(key)}
          />
        ))}

        <SectionTitle>LABEL</SectionTitle>
        <SegmentedControl
          label="ラベル言語"
          value={s.labelLang}
          options={LANG_OPTIONS}
          onChange={s.setLabelLang}
        />

        <SectionTitle>MOTION</SectionTitle>
        <Toggle label="自動回転" checked={s.autoRotate} onChange={s.toggleAutoRotate} />
        <button
          type="button"
          onClick={s.resetView}
          className="border-yellow/70 font-display text-yellow hover:bg-yellow hover:text-void mt-3 w-full border py-1.5 text-[11px] font-bold tracking-[0.25em] transition-colors"
        >
          RESET VIEW
        </button>
      </div>
    </aside>
  );
}
