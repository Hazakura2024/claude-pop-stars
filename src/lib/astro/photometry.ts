/**
 * 等級・色指数から見た目（大きさ・色）を決める。
 */

/** 等級 → 点のピクセルサイズ。明るい（等級が小さい）ほど大きい */
export function magnitudeToSize(mag: number, magLimit = 6): number {
  const t = Math.min(Math.max((magLimit - mag) / (magLimit + 1.5), 0), 1);
  return 2 + t ** 1.5 * 22;
}

/** 等級 → 明るさ係数（0.4〜1.6）。1 を超える分は Bloom で光る */
export function magnitudeToIntensity(mag: number, magLimit = 6): number {
  const t = Math.min(Math.max((magLimit - mag) / (magLimit + 1.5), 0), 1);
  return 0.4 + 1.2 * t;
}

/** B-V 色指数 → 有効温度 (K)。Ballesteros (2012) */
export function bvToTemperature(bv: number): number {
  const b = Math.min(Math.max(bv, -0.4), 2.0);
  return 4600 * (1 / (0.92 * b + 1.7) + 1 / (0.92 * b + 0.62));
}

/**
 * 温度 → RGB (0〜1)。Tanner Helland の近似式。
 * 実際の星の色は淡いので、ポップな見た目のために彩度を少し持ち上げる。
 */
export function temperatureToRgb(kelvin: number, saturation = 1.6): [number, number, number] {
  const t = kelvin / 100;
  let r: number;
  let g: number;
  let b: number;

  if (t <= 66) {
    r = 255;
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
    b = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  } else {
    r = 329.698727446 * (t - 60) ** -0.1332047592;
    g = 288.1221695283 * (t - 60) ** -0.0755148492;
    b = 255;
  }

  const rgb = [r, g, b].map((v) => Math.min(Math.max(v, 0), 255) / 255);
  const lum = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  const [sr, sg, sb] = rgb.map((v) => Math.min(Math.max(lum + (v - lum) * saturation, 0), 1));
  return [sr, sg, sb];
}

export function bvToRgb(bv: number): [number, number, number] {
  return temperatureToRgb(bvToTemperature(bv));
}
