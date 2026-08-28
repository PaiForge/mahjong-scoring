import { YAKUHAI_ENTRY_NAME } from "@mahjong-scoring/core";

/**
 * 役チートシート用の例示手牌（Extended MSPZ 記法）
 *
 * 役名は @mahjong-scoring/core の YAKU_HAN_ENTRIES と一致させる。
 * Extended MSPZ: 純手牌 `123m`、副露 `[123m]`（チー/ポン/大明槓）、暗槓 `(1111z)`。
 * 字牌(z): 1=東 2=南 3=西 4=北 5=白 6=發 7=中
 *
 * 立直・門前清自摸和は「手牌の形」を持たない状況役のためチートシートから除外する。
 *
 * 役例示手牌
 */

/**
 * 1役分の例示手牌
 *
 * 鳴いて成立する役は門前形と副露形を必ず対で持つ。どちらか片方だけだと、
 * 載っている形がその役の唯一の形なのか、たまたま選ばれた一例なのかが
 * カードごとに変わってしまう（同じ役牌でも發は副露形・白は門前形という
 * 不揃いが実際に生まれていた）。門前限定役は副露形が存在しないので
 * `naki` を持たない。この対応が `YAKU_HAN_ENTRIES` の `nakiHan` の
 * 有無と一致することはテストで担保する。
 *
 * 門前形と副露形は、同じ手牌の1面子を副露に置き換えた最小対にする。
 * 別々の手牌にすると読者は14枚を読み直すことになり、鳴きと無関係な差分まで
 * 意味があるように見えてしまう。同じ手なら目が副露のブロックだけに向く。
 *
 * 役例示手牌セット
 */
export interface YakuExampleSet {
  /**
   * この例が示す牌の名前
   *
   * 役牌のように1つの役を複数の牌で示す役だけが持つ。例が1つしかない役は
   * 見出す相手がいないので持たない。役名（`YAKU_EXAMPLES` のキー）と同じく
   * 日本語のドメイン語彙をそのまま値にする。
   */
  readonly variant?: string;
  /** 門前形（Extended MSPZ 記法） */
  readonly menzen: string;
  /**
   * 門前形でロンした牌（MSPZ 記法で1枚）
   *
   * 並びだけではその役として読めない門前形だけが持つ。対々和・混老頭の門前形は
   * 4つとも暗刻なので静止した並びとしては四暗刻と区別できず、平和も待ちの形が
   * 分からなければ平和と確定しない。どちらも並びではなく和了牌で決まるので、
   * 出題盤面と同じくロン牌を一番右に開示する。副露形は明刻が入るぶん並びだけで
   * 確定するため持たない。
   */
  readonly menzenRonHai?: string;
  /** 副露形（Extended MSPZ 記法）。門前限定役は持たない。 */
  readonly naki?: string;
}

/** チートシートに載せない役（状況役） */
export const YAKU_CHEATSHEET_EXCLUDED: ReadonlySet<string> = new Set([
  "立直",
  "門前清自摸和",
]);

export const YAKU_EXAMPLES: Readonly<
  Record<string, readonly YakuExampleSet[]>
> = {
  // --- 1翻 ---
  // 両面待ちのロンでないと平和にならないので和了牌まで示す
  平和: [{ menzen: "234m567m234p678p55s", menzenRonHai: "6p" }],
  一盃口: [{ menzen: "234m234m567p789s11z" }],
  断么九: [
    {
      menzen: "234m567m234p678s55p",
      naki: "234m234p678s55p[567m]",
    },
  ],
  // 三元牌はどれも同じ扱いなので、牌だけを差し替えた同じ手で並べる
  役牌: [
    {
      variant: "白",
      menzen: "234m567m234p99s555z",
      naki: "234m567m234p99s[555z]",
    },
    {
      variant: "發",
      menzen: "234m567m234p99s666z",
      naki: "234m567m234p99s[666z]",
    },
    {
      variant: "中",
      menzen: "234m567m234p99s777z",
      naki: "234m567m234p99s[777z]",
    },
  ],
  // --- 2翻 ---
  三色同順: [
    {
      menzen: "234m234p234s678m55z",
      naki: "234m234p678m55z[234s]",
    },
  ],
  一気通貫: [
    {
      menzen: "123456789m22p333s",
      naki: "123456m22p333s[789m]",
    },
  ],
  混全帯么九: [
    {
      menzen: "123m123p123s789m11z",
      naki: "123p123s789m11z[123m]",
    },
  ],
  七対子: [{ menzen: "1188m2299p3377s11z" }],
  // 副露形は明刻を2つにして三暗刻との複合を避けた形
  対々和: [
    {
      menzen: "111m555p999s333z22m",
      // シャンポン待ちをロンして1つが明刻にならないと四暗刻になる
      menzenRonHai: "1m",
      naki: "111m555p22m[999s][333z]",
    },
  ],
  三暗刻: [
    {
      menzen: "111m333m555p789s77z",
      naki: "111m333m555p77z[789s]",
    },
  ],
  三色同刻: [
    {
      menzen: "333m333p333s678m11z",
      naki: "333m333p678m11z[333s]",
    },
  ],
  三槓子: [
    {
      menzen: "234s11z(1111m)(5555p)(9999s)",
      naki: "234s11z(1111m)(5555p)[9999s]",
    },
  ],
  小三元: [
    {
      menzen: "234m234p555z666z77z",
      naki: "234m234p666z77z[555z]",
    },
  ],
  混老頭: [
    {
      menzen: "111m999m111p999p11z",
      // 対々和と同じく、ロンで1つが明刻にならないと四暗刻になる
      menzenRonHai: "1m",
      naki: "111m999m111p11z[999p]",
    },
  ],
  // --- 3翻 ---
  混一色: [
    {
      menzen: "123m456m789m99m111z",
      naki: "123m456m99m111z[789m]",
    },
  ],
  純全帯么九: [
    {
      menzen: "123m789m123p789s11s",
      naki: "789m123p789s11s[123m]",
    },
  ],
  二盃口: [{ menzen: "112233m112233p55s" }],
  // --- 6翻 ---
  // 111m…999m を含む形は九蓮宝燈になってしまうため避けた形
  清一色: [
    {
      menzen: "234m345m456m789m22m",
      naki: "234m345m456m22m[789m]",
    },
  ],
  // --- 役満 ---
  国士無双: [{ menzen: "119m19p19s1234567z" }],
  四暗刻: [{ menzen: "111m555m999p333s22z" }],
  九蓮宝燈: [{ menzen: "11123455678999m" }],
  大三元: [
    {
      menzen: "234m555z666z777z11p",
      naki: "234m555z666z11p[777z]",
    },
  ],
  // 風牌を3種に留めて小四喜・大四喜との複合を避けた形
  字一色: [
    {
      menzen: "111z222z333z555z66z",
      naki: "111z222z555z66z[333z]",
    },
  ],
  小四喜: [
    {
      menzen: "234m111z222z333z44z",
      naki: "234m111z222z44z[333z]",
    },
  ],
  // 雀頭を数牌にして字一色との複合を避けた形
  大四喜: [
    {
      menzen: "111z222z333z444z11m",
      naki: "111z222z333z11m[444z]",
    },
  ],
  清老頭: [
    {
      menzen: "111m999m111p999p11s",
      naki: "111m999m111p11s[999p]",
    },
  ],
  緑一色: [
    {
      menzen: "234s234s666s888s66z",
      naki: "234s234s666s66z[888s]",
    },
  ],
  四槓子: [
    {
      menzen: "55z(1111m)(2222p)(3333s)(4444z)",
      naki: "55z(1111m)(2222p)(3333s)[4444z]",
    },
  ],
};

/**
 * 役一覧（早見表）に載る役かどうか
 * 早見表掲載判定
 *
 * 状況役（除外役）と例示手牌が未定義の役は載らない。教本側から
 * 「リンクを張ってよい役か」を判定するのにも使う。
 */
export function hasYakuCheatsheetEntry(yakuName: string): boolean {
  return (
    !YAKU_CHEATSHEET_EXCLUDED.has(yakuName) &&
    YAKU_EXAMPLES[yakuName] !== undefined
  );
}

/**
 * 点数計算が返す役名を早見表の項目名に解決する
 * 早見表項目解決
 *
 * 「役牌 白」のように牌まで含んだ役名は「役牌」のカードへ寄せる。
 * 早見表に載らない役（状況役）は undefined を返す。
 */
export function resolveYakuCheatsheetName(
  yakuName: string,
): string | undefined {
  if (hasYakuCheatsheetEntry(yakuName)) return yakuName;
  if (
    yakuName.startsWith(YAKUHAI_ENTRY_NAME) &&
    hasYakuCheatsheetEntry(YAKUHAI_ENTRY_NAME)
  ) {
    return YAKUHAI_ENTRY_NAME;
  }
  return undefined;
}
