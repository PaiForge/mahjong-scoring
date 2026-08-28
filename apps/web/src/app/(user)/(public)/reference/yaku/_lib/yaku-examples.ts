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

/** 和了の仕方 */
export interface YakuExampleAgari {
  readonly type: "ron" | "tsumo";
  /** 和了牌（MSPZ 記法で1枚） */
  readonly hai: string;
}

/**
 * 例示手牌1つ
 *
 * 役例示手牌
 */
export interface YakuExampleHand {
  /** 手牌（Extended MSPZ 記法） */
  readonly mspz: string;
  /**
   * 和了の仕方
   *
   * 牌の並びだけではその役として読めない例だけが持つ。刻子や待ちが絡む役は
   * 同じ並びでも和了牌で結論が変わる。三暗刻は刻子をロンで完成させると明刻に
   * なって役ごと消え、対々和・混老頭の門前形は逆に刻子をロンしないと四暗刻に
   * なり、四暗刻はツモ（か単騎ロン）でないと三暗刻＋対々和にしかならない。
   * 平和も両面待ちでなければ平和にならない。
   *
   * 出題盤面と同じく、和了牌を一番右に開示してツモ・ロンの別を添える。
   */
  readonly agari?: YakuExampleAgari;
}

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
  /** 門前形 */
  readonly menzen: YakuExampleHand;
  /** 副露形。門前限定役は持たない。 */
  readonly naki?: YakuExampleHand;
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
  平和: [
    {
      // 両面待ちの和了でないと平和にならない
      menzen: {
        mspz: "234m567m234p678p55s",
        agari: { type: "ron", hai: "6p" },
      },
    },
  ],
  一盃口: [{ menzen: { mspz: "234m234m567p789s11z" } }],
  断么九: [
    {
      menzen: { mspz: "234m567m234p678s55p" },
      naki: { mspz: "234m234p678s55p[567m]" },
    },
  ],
  // 三元牌はどれも同じ扱いなので、牌だけを差し替えた同じ手で並べる
  役牌: [
    {
      variant: "白",
      menzen: { mspz: "234m567m234p99s555z" },
      naki: { mspz: "234m567m234p99s[555z]" },
    },
    {
      variant: "發",
      menzen: { mspz: "234m567m234p99s666z" },
      naki: { mspz: "234m567m234p99s[666z]" },
    },
    {
      variant: "中",
      menzen: { mspz: "234m567m234p99s777z" },
      naki: { mspz: "234m567m234p99s[777z]" },
    },
  ],
  // --- 2翻 ---
  三色同順: [
    {
      menzen: { mspz: "234m234p234s678m55z" },
      naki: { mspz: "234m234p678m55z[234s]" },
    },
  ],
  一気通貫: [
    {
      menzen: { mspz: "123456789m22p333s" },
      naki: { mspz: "123456m22p333s[789m]" },
    },
  ],
  混全帯么九: [
    {
      menzen: { mspz: "123m123p123s789m11z" },
      naki: { mspz: "123p123s789m11z[123m]" },
    },
  ],
  七対子: [{ menzen: { mspz: "1188m2299p3377s11z" } }],
  対々和: [
    {
      // シャンポン待ちをロンして1つが明刻にならないと四暗刻になる
      menzen: {
        mspz: "111m555p999s333z22m",
        agari: { type: "ron", hai: "1m" },
      },
      // 明刻を2つにして三暗刻との複合を避けた形
      naki: { mspz: "111m555p22m[999s][333z]" },
    },
  ],
  三暗刻: [
    {
      // 刻子をロンで完成させるとその刻子が明刻になり、暗刻が2つに減る
      menzen: {
        mspz: "111m333m555p789s77z",
        agari: { type: "ron", hai: "8s" },
      },
      // 副露形で暗刻を3つ保てるのは、雀頭の単騎待ちで和了る形だけ
      naki: {
        mspz: "111m333m555p77z[789s]",
        agari: { type: "ron", hai: "7z" },
      },
    },
  ],
  三色同刻: [
    {
      menzen: { mspz: "333m333p333s678m11z" },
      naki: { mspz: "333m333p678m11z[333s]" },
    },
  ],
  三槓子: [
    {
      menzen: { mspz: "234s11z(1111m)(5555p)(9999s)" },
      naki: { mspz: "234s11z(1111m)(5555p)[9999s]" },
    },
  ],
  小三元: [
    {
      menzen: { mspz: "234m234p555z666z77z" },
      naki: { mspz: "234m234p666z77z[555z]" },
    },
  ],
  混老頭: [
    {
      // 対々和と同じく、ロンで1つが明刻にならないと四暗刻になる
      menzen: {
        mspz: "111m999m111p999p11z",
        agari: { type: "ron", hai: "1m" },
      },
      naki: { mspz: "111m999m111p11z[999p]" },
    },
  ],
  // --- 3翻 ---
  混一色: [
    {
      menzen: { mspz: "123m456m789m99m111z" },
      naki: { mspz: "123m456m99m111z[789m]" },
    },
  ],
  純全帯么九: [
    {
      menzen: { mspz: "123m789m123p789s11s" },
      naki: { mspz: "789m123p789s11s[123m]" },
    },
  ],
  二盃口: [{ menzen: { mspz: "112233m112233p55s" } }],
  // --- 6翻 ---
  // 111m…999m を含む形は九蓮宝燈になってしまうため避けた形
  清一色: [
    {
      menzen: { mspz: "234m345m456m789m22m" },
      naki: { mspz: "234m345m456m22m[789m]" },
    },
  ],
  // --- 役満 ---
  国士無双: [{ menzen: { mspz: "119m19p19s1234567z" } }],
  四暗刻: [
    {
      // ロンで刻子を完成させると明刻になり、三暗刻＋対々和にしかならない
      menzen: {
        mspz: "111m555m999p333s22z",
        agari: { type: "tsumo", hai: "1m" },
      },
    },
  ],
  九蓮宝燈: [{ menzen: { mspz: "11123455678999m" } }],
  大三元: [
    {
      menzen: { mspz: "234m555z666z777z11p" },
      naki: { mspz: "234m555z666z11p[777z]" },
    },
  ],
  // 風牌を3種に留めて小四喜・大四喜との複合を避けた形
  字一色: [
    {
      menzen: { mspz: "111z222z333z555z66z" },
      naki: { mspz: "111z222z555z66z[333z]" },
    },
  ],
  小四喜: [
    {
      menzen: { mspz: "234m111z222z333z44z" },
      naki: { mspz: "234m111z222z44z[333z]" },
    },
  ],
  // 雀頭を数牌にして字一色との複合を避けた形
  大四喜: [
    {
      menzen: { mspz: "111z222z333z444z11m" },
      naki: { mspz: "111z222z333z11m[444z]" },
    },
  ],
  清老頭: [
    {
      menzen: { mspz: "111m999m111p999p11s" },
      naki: { mspz: "111m999m111p11s[999p]" },
    },
  ],
  緑一色: [
    {
      menzen: { mspz: "234s234s666s888s66z" },
      naki: { mspz: "234s234s666s66z[888s]" },
    },
  ],
  四槓子: [
    {
      menzen: { mspz: "55z(1111m)(2222p)(3333s)(4444z)" },
      naki: { mspz: "55z(1111m)(2222p)(3333s)[4444z]" },
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
