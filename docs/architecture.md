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
   │  │   └─ ConstellationLabels             … 星座名（drei <Html>）
   │  ├─ CameraRig                           … OrbitControls・視点切替
   │  └─ Effects                             … ポストプロセス
   ├─ 画面効果のオーバーレイ（グリッド床・光だまり・走査線）
   └─ Header / ControlPanel / StatusBar / LoadingScreen
```

- Three.js は `window` と WebGL を必要とするので、`CelestialCanvas` は `next/dynamic` の `ssr: false` で読み込む。`ssr: false` はクライアントコンポーネントの中でしか使えないため、`SkyApp` に `"use client"` を付けている。
- ページ自体は静的にプリレンダリングされ、UI の外枠はすぐ表示される。

## 状態管理

`src/store/useSkyStore.ts`（Zustand）で UI と 3D シーンが状態を共有する。

| 状態         | 内容                                                |
| ------------ | --------------------------------------------------- |
| `viewMode`   | `"outside"`（天球儀）/ `"inside"`（プラネタリウム） |
| `layers`     | 星座線・星座名・グリッド・黄道の表示 ON/OFF         |
| `labelLang`  | 星座名の言語（`ja` / `en`）                         |
| `autoRotate` | 自動回転                                            |
| `resetToken` | 値が変わるたびに `CameraRig` がカメラを初期化       |
| `ready`      | 星データの読み込みが済んだか（ローディング画面用）  |

## データの読み込み

`useSkyData()` は `/data/stars.json` と `/data/constellations.json` を取得し、その Promise を React 19 の `use()` で読む。Promise はモジュール内にキャッシュするので、取得は一度だけ。読み込み中は Canvas 内の `<Suspense>` で待ち、終わったら `ready` を立ててローディング画面を消す。

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
- **発光**: 色を `toneMapped={false}` で出し、Bloom で光らせる。

## テスト

`tests/astro.test.ts` で座標変換・黄道変換・等級／色指数の変換を確認する。3D の見た目はブラウザで確認する。
