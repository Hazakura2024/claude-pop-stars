import { create } from "zustand";

/** outside: 天球儀として外から見る / inside: 天球の中心から見るプラネタリウム */
export type ViewMode = "outside" | "inside";
export type LabelLang = "ja" | "en";

export interface Layers {
  constellations: boolean;
  labels: boolean;
  grid: boolean;
  ecliptic: boolean;
}

interface SkyState {
  viewMode: ViewMode;
  layers: Layers;
  labelLang: LabelLang;
  autoRotate: boolean;
  /** 値が変わるとカメラを初期位置へ戻す */
  resetToken: number;
  /** 星データの読み込みが完了したか */
  ready: boolean;

  setViewMode: (mode: ViewMode) => void;
  toggleLayer: (key: keyof Layers) => void;
  setLabelLang: (lang: LabelLang) => void;
  toggleAutoRotate: () => void;
  resetView: () => void;
  setReady: (ready: boolean) => void;
}

export const useSkyStore = create<SkyState>()((set) => ({
  viewMode: "outside",
  layers: { constellations: true, labels: true, grid: true, ecliptic: true },
  labelLang: "ja",
  autoRotate: true,
  resetToken: 0,
  ready: false,

  setViewMode: (viewMode) => set((s) => ({ viewMode, resetToken: s.resetToken + 1 })),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLabelLang: (labelLang) => set({ labelLang }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  setReady: (ready) => set({ ready }),
}));
