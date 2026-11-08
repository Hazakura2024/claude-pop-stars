/**
 * 画面上のラベルの重なりを避ける。優先度の高い順に置いていき、
 * 既定の位置（星の下）が空いていなければ上・右・左・斜めへずらす。どこにも置けなければ隠す。
 */
export interface LabelBox {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** 配置したいラベル。(x, y) は星の画面座標、offset は星からラベルまでの間隔（px） */
export interface LabelRequest {
  x: number;
  y: number;
  width: number;
  height: number;
  offset: number;
  /** 前のフレームで使った候補。下が空いていなければ次にこれを試し、ラベルが跳ね回らないようにする */
  previous?: number;
}

/** 決まった位置。(dx, dy) は星から見たラベル中心のずれ、align は2段の文字のそろえ方 */
export interface LabelPlacement {
  candidate: number;
  dx: number;
  dy: number;
  align: "center" | "start" | "end";
}

type Candidate = (r: LabelRequest) => Omit<LabelPlacement, "candidate">;

/** 置く場所の候補（先頭ほど優先）。下 → 上 → 右 → 左 → 斜め */
const CANDIDATES: Candidate[] = [
  ({ height, offset }) => ({ dx: 0, dy: height / 2 + offset, align: "center" }),
  ({ height, offset }) => ({ dx: 0, dy: -(height / 2 + offset), align: "center" }),
  ({ width, offset }) => ({ dx: width / 2 + offset, dy: 0, align: "start" }),
  ({ width, offset }) => ({ dx: -(width / 2 + offset), dy: 0, align: "end" }),
  ({ width, height, offset }) => ({
    dx: width / 2 + offset / 2,
    dy: height / 2 + offset / 2,
    align: "start",
  }),
  ({ width, height, offset }) => ({
    dx: -(width / 2 + offset / 2),
    dy: height / 2 + offset / 2,
    align: "end",
  }),
  ({ width, height, offset }) => ({
    dx: width / 2 + offset / 2,
    dy: -(height / 2 + offset / 2),
    align: "start",
  }),
  ({ width, height, offset }) => ({
    dx: -(width / 2 + offset / 2),
    dy: -(height / 2 + offset / 2),
    align: "end",
  }),
];

/** ラベルどうしの最低限の隙間（px） */
const GAP = 2;

function overlaps(a: LabelBox, b: LabelBox): boolean {
  return (
    a.left < b.left + b.width + GAP &&
    b.left < a.left + a.width + GAP &&
    a.top < b.top + b.height + GAP &&
    b.top < a.top + a.height + GAP
  );
}

function boxAt(r: LabelRequest, p: Omit<LabelPlacement, "candidate">): LabelBox {
  return {
    left: r.x + p.dx - r.width / 2,
    top: r.y + p.dy - r.height / 2,
    width: r.width,
    height: r.height,
  };
}

/**
 * requests は優先度の高い順（null は画面に出ないラベルで、場所を取らない）。
 * それぞれの置き場所を返す。置けなければ null。
 */
export function placeLabels(requests: (LabelRequest | null)[]): (LabelPlacement | null)[] {
  const placed: LabelBox[] = [];
  return requests.map((r) => {
    if (!r) return null;
    // 既定の位置（下）→ 前のフレームの位置 → 残りの候補の順に試す
    const order = CANDIDATES.map((_, i) => i);
    if (r.previous !== undefined && r.previous > 1) {
      order.splice(r.previous, 1);
      order.splice(1, 0, r.previous);
    }
    for (const candidate of order) {
      const p = CANDIDATES[candidate](r);
      const box = boxAt(r, p);
      if (placed.some((q) => overlaps(q, box))) continue;
      placed.push(box);
      return { candidate, ...p };
    }
    return null;
  });
}
