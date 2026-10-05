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
  /**
   * 役を成立させる面子が暗刻（暗子）に限られるか。
   *
   * 三暗刻がこれにあたる。`nakiHan` を持つので手に副露があっても役は成立し
   * 翻数も変わらないが、暗刻 3 つ自体は鳴いて作れない（副露してよいのは
   * 残り 1 面子だけ）。「鳴くと成立しない」（`nakiHan` を持たない門前限定役）
   * とは別の事実なのでフィールドを分けている。
   *
   * この区別を `nakiHan` を落とすことで表現してはいけない。この一覧は
   * 練習の出題だけでなく教本の翻数表（`learn/yaku`）と早見表
   * （`reference/yaku`）も引いており、落とすと「三暗刻は鳴くと成立しない」
   * という誤りが 3 箇所に出る。
   */
  readonly requiresConcealedMelds?: boolean;
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
  /** 正解の翻数（役満は 13） */
  readonly correctHan: number;
}
