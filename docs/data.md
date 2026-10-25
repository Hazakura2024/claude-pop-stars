# 星データ

## 出典

[d3-celestial](https://github.com/ofrohn/d3-celestial) の `data/` を使う（BSD-3-Clause, © Olaf Frohn）。

| 元ファイル                  | 内容                                                 |
| --------------------------- | ---------------------------------------------------- |
| `stars.6.json`              | 6等級までの恒星（Hipparcos）。位置・等級・B-V 色指数 |
| `constellations.lines.json` | 星座線                                               |
| `constellations.json`       | 星座名（多言語。日本語名を含む）とラベル位置         |

## 生成

```bash
pnpm data
```

`scripts/build-star-data.ts` が上の 3 ファイルを取得し、必要な項目だけを残して `public/data/` に書き出す。生成したファイルはリポジトリに含めているので、普段は実行しなくてよい。

- GeoJSON の経度（-180〜180）を赤経（0〜360°）に直す
- 恒星は暗い順に並べる（明るい星を後から描くと、加算合成で埋もれにくい）
- へび座は頭部（`Ser1`）と尾部（`Ser2`）に分かれている

## 形式

### `public/data/stars.json`

<!-- prettier-ignore -->
```jsonc
{
  "magLimit": 6,
  "stars": [
    // [赤経(度), 赤緯(度), 視等級, B-V色指数]
    [101.2872, -16.7161, -1.44, 0.009]
  ]
}
```

### `public/data/constellations.json`

<!-- prettier-ignore -->
```jsonc
{
  "constellations": [
    {
      "id": "Ori",       // IAU 略符
      "name": "Orion",   // ラテン語名
      "ja": "オリオン座",
      "rank": 1,         // 1=主要 〜 3=マイナー（ラベルの大きさに反映）
      "label": [84, 13], // ラベル位置 [赤経, 赤緯]
      "lines": [[[88.79, 7.41], [81.28, 6.35]]] // 折れ線の配列
    }
  ]
}
```

型は `src/types/astro.ts` にある。

## 座標系

赤道座標（J2000）を、半径 `GLOBE_RADIUS`（= 10）の球面上の点に変換する（`src/lib/astro/coordinates.ts`）。

```
x =  r·cos(δ)·cos(α)
y =  r·sin(δ)          … +Y が天の北極
z = -r·cos(δ)·sin(α)
```

この向きにすると、

- 天球の **内側** から見たとき、東が左に来る → 実際の夜空と同じ
- 天球の **外側** から見たとき、左右が反転する → 本物の天球儀と同じ

黄道は黄経を赤道座標に変換して描く（黄道傾斜角 23.4393°）。

## 見た目への変換

`src/lib/astro/photometry.ts`

- **大きさ**: 等級が小さい（明るい）ほど大きく描く。2〜24px
- **明るさ**: 0.4〜1.6 倍。1 を超えた分は Bloom で光る
- **色**: B-V 色指数 → 有効温度（Ballesteros 2012）→ RGB（Tanner Helland の近似）。ポップに見せるため彩度を 1.6 倍にしている
