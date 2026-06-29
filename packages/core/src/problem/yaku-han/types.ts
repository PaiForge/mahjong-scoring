/**
 * 役翻数練習の役エントリ
 * 役名と門前・鳴き時の翻数を保持する
 * 役翻数エントリ
 */
export interface YakuHanEntry {
  /** 役名（日本語表示名） */
  readonly name: string;
  /** 門前時の翻数（役満は 13） */
  readonly menzenHan: number;
  /**
   * 鳴き（副露）時の翻数。
   * undefined の場合は門前限定役（鳴くと成立しない）であることを表す。
   * menzenHan と異なる値の場合は食い下がり役。
   */
  readonly nakiHan?: number;
}

/**
 * 役翻数練習の問題
 * 役名と門前/鳴きの状態を提示し、翻数を答えさせる
 * 役翻数問題
 */
export interface YakuHanQuestion {
  /** 出題する役名（日本語表示名） */
  readonly yakuName: string;
  /** true: 門前、false: 鳴き（副露） */
  readonly isMenzen: boolean;
  /**
   * 鳴ける役かどうか。
   * false（門前限定役）の場合、門前/鳴きの状態提示は意味を持たないため UI 側はラベルを出さない。
   */
  readonly canNaki: boolean;
  /** 正解の翻数（役満は 13） */
  readonly correctHan: number;
}
