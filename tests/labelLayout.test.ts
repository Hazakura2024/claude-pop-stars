import { describe, expect, it } from "vitest";

import { placeLabels } from "@/lib/labelLayout";

const label = (x: number, y: number, previous?: number) => ({
  x,
  y,
  width: 60,
  height: 30,
  offset: 5,
  previous,
});
const candidates = (r: ReturnType<typeof placeLabels>) => r.map((p) => p?.candidate ?? null);

describe("placeLabels", () => {
  it("重ならなければ星の下（候補0）", () => {
    expect(candidates(placeLabels([label(0, 0), label(200, 0)]))).toEqual([0, 0]);
  });
  it("下が埋まっていれば上へずらす", () => {
    const [, p] = placeLabels([label(0, 0), label(10, 5)]);
    expect(p).toMatchObject({ candidate: 1, dx: 0, dy: -20 });
  });
  it("上下とも埋まっていれば横へずらす", () => {
    // 2つ目の星は1つ目のラベルの右端あたりにあり、自分の上下どちらも1つ目のラベルにかかる
    const r = placeLabels([label(0, 0), label(50, 20)]);
    expect(candidates(r)).toEqual([0, 2]);
  });
  it("どこにも置けなければ null", () => {
    const crowd = [label(0, 0), ...Array.from({ length: 12 }, () => label(0, 0))];
    expect(placeLabels(crowd).at(-1)).toBeNull();
  });
  it("下が埋まっているときは、前のフレームの位置を優先する", () => {
    // 前は右（候補2）だったので、上（候補1）が空いていても右に置く
    const [, p] = placeLabels([label(0, 0), label(40, 5, 2)]);
    expect(p?.candidate).toBe(2);
  });
  it("画面に出ないラベル（null）は場所を取らない", () => {
    expect(candidates(placeLabels([null, label(0, 0)]))).toEqual([null, 0]);
  });
});
