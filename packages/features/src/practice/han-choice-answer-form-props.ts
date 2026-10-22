/**
 * 翻数を選択肢から答えるフォーム（`HanChoiceAnswerForm`）の props（web とアプリで共有）
 * 翻数選択フォームprops
 *
 * 列数の指定だけが platform で違う（web は Tailwind のクラス、アプリは数）ので、
 * ここには持たず各アプリが extends で足す。
 */
export interface HanChoiceAnswerFormBaseProps {
  /** 表示する翻数の選択肢 */
  readonly options: readonly number[];
  /** 正解の翻数 */
  readonly correctHan: number;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  /** フィードバック表示中かどうか */
  readonly showFeedback: boolean;
  readonly onSubmit: (han: number) => void;
  readonly disabled?: boolean;
  /** `selectHan` キーを持つ翻訳名前空間（例: "yakuHanChallenge"） */
  readonly translationNamespace: string;
  /**
   * 選択肢の表示ラベル。翻訳関数を受け取り、役満などの特別表記を各練習が決める。
   */
  readonly renderLabel: (
    han: number,
    t: (key: string, values?: Record<string, number>) => string,
  ) => string;
}
