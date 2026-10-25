"use client";

import { useSkyStore } from "@/store/useSkyStore";

export function LoadingScreen() {
  const ready = useSkyStore((s) => s.ready);

  return (
    <div
      aria-hidden={ready}
      className={`bg-void absolute inset-0 z-30 grid place-items-center transition-opacity duration-700 ${
        ready ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="text-center">
        <div className="border-pink border-t-cyan mx-auto size-16 animate-spin rounded-full border-2 shadow-[var(--glow-pink)]" />
        <p className="font-display text-cyber mt-4 text-sm tracking-[0.4em]">LOADING STARS</p>
      </div>
    </div>
  );
}
