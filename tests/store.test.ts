import { beforeEach, describe, expect, it } from "vitest";

import { useSkyStore } from "@/store/useSkyStore";

const initial = useSkyStore.getState();
const state = () => useSkyStore.getState();

describe("選択モード", () => {
  beforeEach(() => useSkyStore.setState(initial, true));

  it("モードを切り替えると選択が外れる", () => {
    state().select("Ori");
    state().setPickMode("star");
    expect(state()).toMatchObject({ pickMode: "star", selectedId: null, selectedStarId: null });
  });
  it("星を選ぶと星座の選択は外れる", () => {
    state().select("Ori");
    state().selectStar("27989");
    expect(state()).toMatchObject({ selectedId: null, selectedStarId: "27989" });
  });
  it("星のカードから星座を開くと、星座モードに切り替わる", () => {
    state().setPickMode("star");
    state().selectStar("27989");
    state().select("Ori");
    expect(state()).toMatchObject({
      pickMode: "constellation",
      selectedId: "Ori",
      selectedStarId: null,
    });
  });
  it("検索で星を選ぶと星モードで選択し、カメラを動かす", () => {
    state().focusOn({ kind: "star", id: "27989", ra: 88.8, dec: 7.4, mag: 0.45 });
    expect(state()).toMatchObject({
      pickMode: "star",
      selectedStarId: "27989",
      selectedId: null,
      focusToken: initial.focusToken + 1,
    });
  });
  it("検索で星座を選ぶと星座モードで選択する", () => {
    state().setPickMode("star");
    state().focusOn({ kind: "constellation", id: "Ori", ra: 84, dec: 13 });
    expect(state()).toMatchObject({
      pickMode: "constellation",
      selectedId: "Ori",
      selectedStarId: null,
    });
  });
  it("clearSelection で星・星座とも外れる", () => {
    state().selectStar("27989");
    state().clearSelection();
    expect(state()).toMatchObject({ selectedId: null, selectedStarId: null, focus: null });
  });
});
