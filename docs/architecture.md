# アーキテクチャ

## 全体像

```
app/page.tsx (Server Component)
└─ SkyApp (Client)
   ├─ CelestialCanvas ← next/dynamic({ ssr: false })
   │  ├─ <Suspense> Sky
   │  │   ├─ Globe / Armillary / Starfield   … Globe モードのみ
   │  │   ├─ Stars                           … 恒星（Points + 自作シェーダー）
   │  │   ├─ CelestialGrid / Ecliptic        … 赤経赤緯グリッド・黄道
   │  │   ├─ ConstellationLines              … 星座線
   │  │   ├─ ConstellationHighlight          … 選択中（黄）・ホバー中（シアン）の星座線
   │  │   ├─ ConstellationLabels             … 星座名（drei <Html>）
   │  │   ├─ StarLabels                      … 拡大時の星の名前（drei <Html>）
   │  │   └─ ConstellationPicker             … クリック・ホバーの判定（透明な球）
   │  ├─ CameraRig                           … OrbitControls・視点切替
   │  └─ Effects                             … ポストプロセス
   ├─ 画面効果のオーバーレイ（グリッド床・光だまり・走査線）
   └─ Header / ControlPanel / StatusBar / InfoCard / LoadingScreen
```

- Three.js は `window` と WebGL を必要とするので、`CelestialCanvas` は `next/dynamic` の `ssr: false` で読み込む。`ssr: false` はクライアントコンポーネントの中でしか使えないため、`SkyApp` に `"use client"` を付けている。
- ページ自体は静的にプリレンダリングされ、UI の外枠はすぐ表示される。

## 状態管理

`src/store/useSkyStore.ts`（Zustand）で UI と 3D シーンが状態を共有する。

| 状態         | 内容                                                  |
| ------------ | ----------------------------------------------------- |
| `viewMode`   | `"outside"`（天球儀）/ `"inside"`（プラネタリウム）   |
| `layers`     | 星座線・星座名・星の名前・グリッド・黄道の表示 ON/OFF |
| `labelLang`  | 星座名の言語（`ja` / `en`）                           |
| `autoRotate` | 自動回転                                              |
| `resetToken` | 値が変わるたびに `CameraRig` がカメラを初期化         |
| `ready`      | 星データの読み込みが済んだか（ローディング画面用）    |
| `selectedId` | 情報カードを表示中の星座（選択中は自動回転を止める）  |
| `hoveredId`  | ポインターが乗っている星座                            |

## データの読み込み

`useSkyData()` は `/data/stars.json`・`/data/constellations.json`・`/data/starnames.json` を取得し、その Promise を React 19 の `use()` で読む。Promise はモジュール内にキャッシュするので、取得は一度だけ。読み込み中は Canvas 内の `<Suspense>` で待ち、終わったら `ready` を立ててローディング画面を消す。

## 視点モード

| モード  | カメラ                                   | ドラッグ                           | ズーム            |
| ------- | ---------------------------------------- | ---------------------------------- | ----------------- |
| outside | 半径 28 前後の位置から原点を見る         | 天球の周りを回る                   | 距離（14〜60）    |
| inside  | 原点のすぐ後ろ（0.01）から原点越しに見る | 向きを反転して「空をつかむ」操作感 | 画角（20°〜100°） |

- Globe モードでは `Globe`（不透明な球）が深度を書き込み、裏側の星や線を隠す。球は表面だけを描画するので、内側からは見えずプラネタリウムの邪魔をしない。
- 縦長の画面では天球儀がはみ出さないよう、カメラの距離を画面の縦横比に合わせて伸ばす。
- 現状、Planetarium モードのピンチズームには対応していない（ホイールのみ）。

## 描画の工夫

- **恒星**: 約5,000個を 1 つの `THREE.Points` にまとめ、ドローコールは 1 回。サイズ・色・瞬きの位相は頂点属性で渡し、フラグメントシェーダーで中心の芯とグローを描く。加算合成。
- **星座線**: すべての線分を drei `<Line segments>`（Line2）1 本にまとめる。太さをピクセル単位で指定できる。
  - 星と星を直線（弦）で結ぶと、中ほどが球の内側に沈む。中点の半径は `R·cos(θ/2)` で、θ が約 11.5° を超えると、裏側を隠す球（半径 `0.995R`）に隠れてしまう。そこで `arcSegments()` で 2° 以下の間隔に分け、大円に沿わせている（約 740 本 → 約 2,400 本）。クリック判定も同じ弧を使う。
- **発光**: 色を `toneMapped={false}` で出し、Bloom で光らせる。

## 星座の選択と情報カード

1. `ConstellationPicker` は天球と同じ半径の透明な球（色も深度も書き込まない）で、R3F のポインターイベントを受け取る。
2. 当たった点を単位ベクトルにし、`pickConstellation()`（`src/lib/astro/picking.ts`）で、星座線の線分とラベル位置のうちいちばん近い星座を探す。
3. 判定の距離は画面上のピクセル数で決め（マウス 18px、タッチ 28px）、カメラの距離と画角から天球上の角度に換算する。画面の大きさやズームに関係なく、同じ感覚で選べる。
4. `e.delta`（押してから離すまでの移動量）が 5px を超えたらドラッグとみなし、選択しない。
5. 選んだ星座は `selectedId` に入り、`InfoCard` が表示する。見頃と見え方は `src/lib/astro/visibility.ts` で計算する。
   - **見頃**: 20時ごろに南中する時期。0時の恒星時が 9/21 に 0h で、1か月に 2h 進むことから赤経で求める
   - **東京から**: 星座の赤緯の範囲と北緯 35.7° から、沈まない／全体が見える／一部だけ見える／見えない、を判定する
6. カードは ✕ ボタンか Esc キーで閉じる。星座のない場所をクリックしても閉じる。

星座名と星の名前のラベル（drei `<Html>`）は `pointer-events: none` にして、クリックやドラッグを妨げないようにしている。`center` を指定した `<Html>` では `pointerEvents` プロップが効かないので、`style` で指定する。

## テスト

- `tests/astro.test.ts`: 座標変換・黄道変換・等級／色指数の変換
- `tests/constellation.test.ts`: 見頃・見え方の判定、赤経赤緯の表示形式、クリック位置からの星座の判定

3D の見た目はブラウザで確認する。

## 星の名前（拡大時）

`StarLabels` は毎フレーム「画面の 1px が天球上で何度にあたるか」（`degreesPerPixel`）を求め、`starLabelMagLimit` で表示する星の等級の上限を決める（`src/lib/astro/stars.ts`）。Globe ではカメラの距離、Planetarium では画角で値が変わる。

| 1px あたりの角度 | 表示する星 |
| ---------------- | ---------- |
| 0.06° より大きい | なし       |
| 0.06° 以下       | 2等まで    |
| 0.045° 以下      | 3等まで    |
| 0.03° 以下       | 4等まで    |

上限が変わったときだけ state を更新するので、ズーム中に毎フレーム再レンダーすることはない。表示名は情報カードと同じ `starLabel` で作る。
