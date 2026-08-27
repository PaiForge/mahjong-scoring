/**
 * sharp に画像を渡すときのコンストラクタオプションと、その裏にあるピクセル予算。
 * sharpデコードオプション
 *
 * blindfold-chess から移植。あちらは 4 つのアップロード経路が同じ指定を手書きし、
 * ピクセル上限の呼び名まで 3 通りに分かれていた。「一部の呼び出しだけが渡す
 * ハードニング」はハードニングではない、というのが向こうで得た結論。
 */

/**
 * libvips にデコードさせる画像の面積上限（幅 × 高さ）。
 * 最大デコードピクセル数
 *
 * 圧縮爆弾への防御。極端に圧縮の効く巨大寸法の画像はバイト数の上限を素通りし、
 * 展開すると GB 級のメモリを要求する。バイト数の検査だけでは防げない。
 */
export const MAX_DECODE_PIXELS = 50_000_000;

/**
 * すべての `sharp(input, ...)` に渡す入力オプション。
 * sharp入力オプション
 *
 * `failOn: "error"` は壊れた入力を早期に弾く。libvips に部分デコードを
 * 救済させると、不正なアップロードではなく「静かに壊れた画像」が保存される。
 *
 * `pages: 1` は先頭フレームだけをデコードする。これが無いとアニメーション
 * WebP / GIF は フレーム数 × 幅 × 高さ のメモリを食い、下のピクセル予算が
 * 「合計」ではなく「1 フレームあたり」の予算に落ちてしまう。
 */
export const SHARP_INPUT_OPTIONS = { failOn: "error", pages: 1 } as const;

/**
 * {@link SHARP_INPUT_OPTIONS} にピクセル予算を足したもの。
 * バッファをそのままデコード（`.rotate()` / `.resize()` / `.toBuffer()`）する
 * 呼び出しはこちらを使う。
 * sharpデコードオプション
 */
export const SHARP_DECODE_OPTIONS = {
  ...SHARP_INPUT_OPTIONS,
  limitInputPixels: MAX_DECODE_PIXELS,
} as const;
