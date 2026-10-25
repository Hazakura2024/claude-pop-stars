# POP★STARS — 天球儀

実際の恒星（6等級まで・約5,000個）と88星座を、ネオンカラーの3D天球儀で眺めるWebアプリです。

- **Globe モード**: 天球儀を外から眺める（本物の天球儀と同じく星座は左右反転）
- **Planetarium モード**: 天球の中心から見上げる（実際の夜空と同じ向き）
- ドラッグで回転、ホイール／ピンチでズーム（Planetarium ではホイールで画角を変更）
- 星座線・星座名（日本語／ラテン語）・赤経赤緯グリッド・黄道の表示切替

## セットアップ

Node.js 20 以上と pnpm が必要です。

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

## スクリプト

| コマンド         | 内容                                                       |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | 開発サーバー                                               |
| `pnpm build`     | 本番ビルド                                                 |
| `pnpm start`     | 本番サーバー                                               |
| `pnpm lint`      | ESLint                                                     |
| `pnpm typecheck` | TypeScript の型チェック                                    |
| `pnpm test`      | Vitest（座標変換などのユニットテスト）                     |
| `pnpm format`    | Prettier で整形                                            |
| `pnpm data`      | 星データを取得し直して `public/data/` を再生成（通常不要） |

## 技術スタック

| 用途           | ライブラリ                                           |
| -------------- | ---------------------------------------------------- |
| フレームワーク | Next.js 16（App Router）+ TypeScript                 |
| 3D             | three / @react-three/fiber / @react-three/drei       |
| エフェクト     | @react-three/postprocessing（Bloom・色収差・ノイズ） |
| 状態管理       | Zustand                                              |
| スタイル       | Tailwind CSS v4 + CSS 変数のデザイントークン         |
| 品質           | ESLint / Prettier / Vitest                           |

## ディレクトリ構成

```
src/
├─ app/                 # ルーティング・レイアウト・グローバルCSS
├─ components/
│  ├─ SkyApp.tsx        # 画面全体の組み立て
│  ├─ scene/            # 3D（R3F）コンポーネント
│  └─ ui/               # 2D の UI（ヘッダー・操作パネルなど）
├─ hooks/useSkyData.ts  # 星データの読み込み
├─ lib/astro/           # 天文計算（座標変換・等級→見た目）
├─ lib/theme.ts         # 3D 用カラーパレット
├─ store/useSkyStore.ts # UI 状態（Zustand）
├─ styles/tokens.css    # デザイントークン
└─ types/astro.ts       # 型定義
scripts/build-star-data.ts  # 星データの変換スクリプト
public/data/                # 変換済みの星データ（JSON）
tests/                      # ユニットテスト
docs/                       # 設計ドキュメント
```

## ドキュメント

- [docs/architecture.md](docs/architecture.md) — 構成とデータの流れ
- [docs/data.md](docs/data.md) — 星データの出典・形式・座標系
- [docs/design.md](docs/design.md) — 配色・フォント・演出

## クレジット

星・星座データ: [d3-celestial](https://github.com/ofrohn/d3-celestial)（© Olaf Frohn, BSD-3-Clause）
