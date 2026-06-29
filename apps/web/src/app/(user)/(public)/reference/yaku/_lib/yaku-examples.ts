/**
 * 役チートシート用の例示手牌（Extended MSPZ 記法）
 *
 * 役名は @mahjong-scoring/core の YAKU_HAN_ENTRIES と一致させる。
 * Extended MSPZ: 純手牌 `123m`、副露 `[123m]`（チー/ポン/大明槓）、暗槓 `(1111z)`。
 * 字牌(z): 1=東 2=南 3=西 4=北 5=白 6=發 7=中
 *
 * 役牌は複数パターン、食い下がり役は門前形と鳴き形の両方を載せる。
 * 立直・門前清自摸和は「手牌の形」を持たない状況役のためチートシートから除外する。
 *
 * 役例示手牌
 */
export interface YakuExample {
  /** 例のラベル（門前/鳴き、白/發/中 など）。単一例の場合は省略可。 */
  readonly label?: string;
  /** Extended MSPZ 記法の手牌 */
  readonly mspz: string;
}

/** チートシートに載せない役（状況役） */
export const YAKU_CHEATSHEET_EXCLUDED: ReadonlySet<string> = new Set([
  "立直",
  "門前清自摸和",
]);

export const YAKU_EXAMPLES: Readonly<Record<string, readonly YakuExample[]>> = {
  // --- 1翻 ---
  平和: [{ mspz: "234m567m234p678p55s" }],
  一盃口: [{ mspz: "234m234m567p789s11z" }],
  断么九: [{ mspz: "234m567m234p678s55p" }],
  役牌: [
    { label: "白", mspz: "234m567m234p99s555z" },
    { label: "發（ポン）", mspz: "234m567m234p99s[666z]" },
    { label: "中", mspz: "234m567m234p99s777z" },
  ],
  // --- 2翻（食い下がりは門前/鳴きの両方）---
  三色同順: [
    { label: "門前", mspz: "234m234p234s678m55z" },
    { label: "鳴き", mspz: "234m234p678m55z[234s]" },
  ],
  一気通貫: [
    { label: "門前", mspz: "123456789m22p333s" },
    { label: "鳴き", mspz: "123456m22p333s[789m]" },
  ],
  混全帯么九: [
    { label: "門前", mspz: "123m123p123s789m11z" },
    { label: "鳴き", mspz: "123p123s789m11z[123m]" },
  ],
  七対子: [{ mspz: "1188m2299p3377s11z" }],
  対々和: [{ mspz: "111m555p999s333z22m" }],
  三暗刻: [{ mspz: "111m333m555p789s77z" }],
  三色同刻: [{ mspz: "333m333p333s678m11z" }],
  三槓子: [{ mspz: "234s11z(1111m)(5555p)(9999s)" }],
  小三元: [{ mspz: "234m234p555z666z77z" }],
  混老頭: [{ mspz: "111m999m111p999p11z" }],
  // --- 3翻 ---
  混一色: [
    { label: "門前", mspz: "123m456m789m99m111z" },
    { label: "鳴き", mspz: "123m456m99m111z[789m]" },
  ],
  純全帯么九: [
    { label: "門前", mspz: "123m789m123p789s11s" },
    { label: "鳴き", mspz: "789m123p789s11s[123m]" },
  ],
  二盃口: [{ mspz: "112233m112233p55s" }],
  // --- 6翻 ---
  清一色: [
    { label: "門前", mspz: "111m234m567m789m99m" },
    { label: "鳴き", mspz: "111m234m567m99m[789m]" },
  ],
  // --- 役満 ---
  国士無双: [{ mspz: "119m19p19s1234567z" }],
  四暗刻: [{ mspz: "111m555m999p333s22z" }],
  九蓮宝燈: [{ mspz: "11123455678999m" }],
  大三元: [{ mspz: "234m555z666z777z11p" }],
  字一色: [{ mspz: "111z222z333z444z55z" }],
  小四喜: [{ mspz: "234m111z222z333z44z" }],
  清老頭: [{ mspz: "111m999m111p999p11s" }],
  緑一色: [{ mspz: "234s234s666s888s66z" }],
  四槓子: [{ mspz: "55z(1111m)(2222p)(3333s)(4444z)" }],
};
