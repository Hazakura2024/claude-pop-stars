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
  /** 情報カードを表示中の星座 */
  selectedId: string | null;
  /** ポインターが乗っている星座 */
  hoveredId: string | null;

  setViewMode: (mode: ViewMode) => void;
  toggleLayer: (key: keyof Layers) => void;
  setLabelLang: (lang: LabelLang) => void;
  toggleAutoRotate: () => void;
  resetView: () => void;
  setReady: (ready: boolean) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
}

export const useSkyStore = create<SkyState>()((set) => ({
  viewMode: "outside",
  layers: { constellations: true, labels: true, grid: true, ecliptic: true },
  labelLang: "ja",
  autoRotate: true,
  resetToken: 0,
  ready: false,
  selectedId: null,
  hoveredId: null,

  setViewMode: (viewMode) => set((s) => ({ viewMode, resetToken: s.resetToken + 1 })),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLabelLang: (labelLang) => set({ labelLang }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  setReady: (ready) => set({ ready }),
  select: (selectedId) => set({ selectedId }),
  hover: (hoveredId) => set((s) => (s.hoveredId === hoveredId ? s : { hoveredId })),
}));
