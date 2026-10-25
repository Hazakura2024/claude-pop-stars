"use client";

import { useSkyStore } from "@/store/useSkyStore";

export function StatusBar() {
  const viewMode = useSkyStore((s) => s.viewMode);

  return (
    <footer className="font-pixel text-ink-dim pointer-events-none absolute right-0 bottom-0 left-0 z-10 flex flex-wrap items-end justify-between gap-2 p-4 text-[11px] sm:p-6">
      <div className="flex gap-4">
        <span>
          <span className="text-cyan">MODE</span> {viewMode === "outside" ? "GLOBE" : "PLANETARIUM"}
        </span>
        <span>
          <span className="text-cyan">STARS</span> ≤ 6.0 mag
        </span>
        <span>
          <span className="text-cyan">EPOCH</span> J2000
        </span>
      </div>
      <span className="pointer-events-auto">
        Data:{" "}
        <a
          href="https://github.com/ofrohn/d3-celestial"
          target="_blank"
          rel="noreferrer"
          className="decoration-pink/60 hover:text-pink underline"
        >
          d3-celestial
        </a>{" "}
        (BSD-3-Clause)
      </span>
    </footer>
  );
}
