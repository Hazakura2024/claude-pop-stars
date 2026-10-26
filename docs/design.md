# デザイン

## コンセプト

**「80年代シティポップの夕焼け × サイバーパンクのネオン」**

深い藍色から紫の夜空に、彩度の高いピンク・シアン・イエローを光らせる。参考にした雰囲気は、ネオンの MV、Astroneer のポップな宇宙、シティポップのジャケットのグラデーション。

## カラーパレット

CSS は `src/styles/tokens.css`、3D は `src/lib/theme.ts` で定義している。**色を変えるときは両方を揃えること。**

| トークン  | 値        | 主な用途                       |
| --------- | --------- | ------------------------------ |
| `void`    | `#07021a` | 背景（宇宙）                   |
| `night`   | `#120634` | 天球の地の色                   |
| `pink`    | `#ff2e88` | 星座線・アクセント・ボタン     |
| `cyan`    | `#00f0ff` | 天の赤道・選択中の状態・見出し |
| `yellow`  | `#ffe600` | 黄道・子午環・トグルのつまみ   |
| `violet`  | `#8a2bff` | 赤経赤緯グリッド・地平環       |
| `orange`  | `#ff7a1a` | タイトルのグラデーション       |
| `ink`     | `#f4ecff` | 本文の文字                     |
| `ink-dim` | `#b9a8e6` | 補足の文字                     |

グラデーション:

- `--grad-sunset`: pink → orange → yellow（タイトル）
- `--grad-cyber`: cyan → violet → pink（ローディング）

Tailwind からは `bg-pink`、`text-cyan`、`border-yellow/70` のように使える（`globals.css` の `@theme`）。

## フォント

| 用途               | フォント            | Tailwind       |
| ------------------ | ------------------- | -------------- |
| 見出し・ボタン     | Orbitron            | `font-display` |
| ラベル・ステータス | DotGothic16         | `font-pixel`   |
| 本文・星座名       | Zen Kaku Gothic New | `font-sans`    |

`next/font/google` で読み込む。和文グリフの無い欧文フォントには、Zen Kaku Gothic New をフォールバックとして指定している。

## 演出

| 演出               | 実装                                                                     |
| ------------------ | ------------------------------------------------------------------------ |
| ネオンの発光       | Bloom（`Effects.tsx`）＋ `toneMapped={false}` の発光色                   |
| 天球の縁の光       | フレネル効果のシェーダー（`Globe.tsx`）。上はシアン、下はピンク          |
| 色ずれ・ノイズ     | ChromaticAberration / Noise / Vignette                                   |
| 夕焼けの光だまり   | `.fx-haze`（放射状グラデーションをスクリーン合成）                       |
| ブラウン管の走査線 | `.fx-scanlines`                                                          |
| レトロなグリッド床 | `.fx-floor`（遠近をつけた格子）                                          |
| タイトルのグリッチ | `.glitch`（色ずれした残像をときどきずらす）                              |
| 角を切ったパネル   | `.neon-panel`（`clip-path`）                                             |
| 星の名前           | `.star-label`。情報カードの「明るい星」と同じ、太字の名前＋淡い符号の2段 |

`prefers-reduced-motion` が有効な環境では、グリッチのアニメーションを止める。
