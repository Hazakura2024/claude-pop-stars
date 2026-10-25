"use client";

import dynamic from "next/dynamic";

import { ControlPanel } from "@/components/ui/ControlPanel";
import { Header } from "@/components/ui/Header";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { StatusBar } from "@/components/ui/StatusBar";

// Three.js は window/WebGL に依存するのでサーバーではレンダリングしない
const CelestialCanvas = dynamic(() => import("@/components/scene/CelestialCanvas"), {
  ssr: false,
});

export function SkyApp() {
  return (
    <main className="bg-void relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0">
        <CelestialCanvas />
      </div>

      {/* 画面効果（3D の上にスクリーン合成で重ねる） */}
      <div
        aria-hidden
        className="fx-floor pointer-events-none absolute inset-x-[-50%] bottom-0 h-[38%] mix-blend-screen"
      />
      <div aria-hidden className="fx-haze pointer-events-none absolute inset-0" />
      <div aria-hidden className="fx-scanlines pointer-events-none absolute inset-0 opacity-60" />

      <Header />
      <ControlPanel />
      <StatusBar />
      <LoadingScreen />
    </main>
  );
}
