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

/** クリックで選ぶ対象 */
export type PickMode = "constellation" | "star";

/** 検索で選んだ注目先。カメラをここへ向ける */
export interface FocusTarget {
  kind: "star" | "constellation";
  /** 星なら HIP 番号、星座なら星座の id */
  id: string;
  ra: number;
  dec: number;
  /** 星の等級（名前が表示される拡大率を決める） */
  mag?: number;
}

export interface StarLabelParts {
  /** バイエル符号など（例: "β Ceti"） */
  designation: boolean;
  magnitude: boolean;
}

interface SkyState {
  viewMode: ViewMode;
  layers: Layers;
  labelLang: LabelLang;
  /** 星の名前の2段目に出す項目 */
  starLabelParts: StarLabelParts;
  autoRotate: boolean;
  /** 値が変わるとカメラを初期位置へ戻す */
  resetToken: number;
  /** 星データの読み込みが完了したか */
  ready: boolean;
  pickMode: PickMode;
  /** 情報カードを表示中の星座 */
  selectedId: string | null;
  /** ポインターが乗っている星座 */
  hoveredId: string | null;
  /** 情報カードを表示中の星（HIP 番号） */
  selectedStarId: string | null;
  /** ポインターが乗っている星（HIP 番号） */
  hoveredStarId: string | null;
  focus: FocusTarget | null;
  /** 値が変わるとカメラを focus へ移動させる（同じ星を選び直したときも動かすため） */
  focusToken: number;

  setViewMode: (mode: ViewMode) => void;
  toggleLayer: (key: keyof Layers) => void;
  setLabelLang: (lang: LabelLang) => void;
  toggleStarLabelPart: (key: keyof StarLabelParts) => void;
  toggleAutoRotate: () => void;
  resetView: () => void;
  setReady: (ready: boolean) => void;
  setPickMode: (mode: PickMode) => void;
  /** 星座を選ぶ（星の選択は外れる）。星モードからでも星座モードに切り替えて開く */
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  selectStar: (id: string | null) => void;
  hoverStar: (id: string | null) => void;
  /** 星・星座の選択をすべて外す */
  clearSelection: () => void;
  /** 検索で選んだ星・星座へカメラを向け、そのモードに切り替えて選択する */
  focusOn: (target: FocusTarget) => void;
}

export const useSkyStore = create<SkyState>()((set) => ({
  viewMode: "outside",
  layers: { constellations: true, labels: true, starNames: true, grid: true, ecliptic: true },
  labelLang: "ja",
  starLabelParts: { designation: true, magnitude: true },
  autoRotate: true,
  resetToken: 0,
  ready: false,
  pickMode: "constellation",
  selectedId: null,
  hoveredId: null,
  selectedStarId: null,
  hoveredStarId: null,
  focus: null,
  focusToken: 0,

  setViewMode: (viewMode) => set((s) => ({ viewMode, resetToken: s.resetToken + 1 })),
  toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
  setLabelLang: (labelLang) => set({ labelLang }),
  toggleStarLabelPart: (key) =>
    set((s) => ({ starLabelParts: { ...s.starLabelParts, [key]: !s.starLabelParts[key] } })),
  toggleAutoRotate: () => set((s) => ({ autoRotate: !s.autoRotate })),
  resetView: () => set((s) => ({ resetToken: s.resetToken + 1 })),
  setReady: (ready) => set({ ready }),
  // モードを切り替えたら、選択とホバーはすべて外す
  setPickMode: (pickMode) =>
    set({
      pickMode,
      selectedId: null,
      hoveredId: null,
      selectedStarId: null,
      hoveredStarId: null,
      focus: null,
    }),
  select: (selectedId) =>
    set(
      selectedId
        ? {
            selectedId,
            selectedStarId: null,
            focus: null,
            pickMode: "constellation",
            hoveredStarId: null,
          }
        : { selectedId: null, selectedStarId: null, focus: null },
    ),
  hover: (hoveredId) => set((s) => (s.hoveredId === hoveredId ? s : { hoveredId })),
  selectStar: (selectedStarId) => set({ selectedStarId, selectedId: null, focus: null }),
  hoverStar: (hoveredStarId) =>
    set((s) => (s.hoveredStarId === hoveredStarId ? s : { hoveredStarId })),
  clearSelection: () => set({ selectedId: null, selectedStarId: null, focus: null }),
  focusOn: (focus) =>
    set((s) => ({
      focus,
      focusToken: s.focusToken + 1,
      pickMode: focus.kind,
      selectedId: focus.kind === "constellation" ? focus.id : null,
      selectedStarId: focus.kind === "star" ? focus.id : null,
      hoveredId: null,
      hoveredStarId: null,
    })),
}));
