import { create } from "zustand";

/** outside: 天球儀として外から見る / inside: 天球の中心から見るプラネタリウム */
export type ViewMode = "outside" | "inside";
export type LabelLang = "ja" | "en";

export interface Layers {
  constellations: boolean;
  labels: boolean;
  /** 拡大したときの星の名前 */
  starNames: boolean;
  grid: boolean;
  ecliptic: boolean;
}

/** 検索で選んだ注目先。カメラをここへ向け、星なら目印を付ける */
export interface FocusTarget {
  kind: "star" | "constellation";
  /** 星なら HIP 番号、星座なら星座の id */
  id: string;
  ra: number;
  dec: number;
  /** 星の等級（名前が表示される拡大率を決める） */
  mag?: number;
  /** あわせて選択する星座の id */
  constellationId: string;
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
  focus: FocusTarget | null;
  /** 値が変わるとカメラを focus へ移動させる（同じ星を選び直したときも動かすため） */
  focusToken: number;

  setViewMode: (mode: ViewMode) => void;
  toggleLayer: (key: keyof Layers) => void;
  setLabelLang: (lang: LabelLang) => void;
  toggleAutoRotate: () => void;
  resetView: () => void;
  setReady: (ready: boolean) => void;
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  focusOn: (target: FocusTarget) => void;
}

export const useSkyStore = create<SkyState>()((set) => ({
  viewMode: "outside",
  layers: { constellations: true, labels: true, starNames: true, grid: true, ecliptic: true },
  labelLang: "ja",
  autoRotate: true,
  resetToken: 0,
  ready: false,
  selectedId: null,
  hoveredId: null,
  focus: null,
  focusToken: 0,

  setViewMode: (viewMode) => set((s) => ({ viewMode, resetToken: s.resetToken + 1 })),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLabelLang: (labelLang) => set({ labelLang }),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  setReady: (ready) => set({ ready }),
  // 星座を選び直したり選択を外したりしたら、検索の目印も外す
  select: (selectedId) => set({ selectedId, focus: null }),
  hover: (hoveredId) => set((s) => (s.hoveredId === hoveredId ? s : { hoveredId })),
  focusOn: (focus) =>
    set((s) => ({ focus, selectedId: focus.constellationId, focusToken: s.focusToken + 1 })),
}));
