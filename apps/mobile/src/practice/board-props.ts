/**
 * 練習盤面が共通で受け取る props
 * 練習盤面props
 *
 * web の `practice-board-props.ts` と同じ契約。チャレンジ・トレーニングの
 * セッションから盤面へ渡される状態と回答ハンドラで、各盤面はこれを
 * extends して固有の props だけを足す。
 */
export interface PracticeBoardProps {
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback: boolean;
  /**
   * 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined）
   *
   * 回答そのものから色を決められない盤面（点数を選んで答えるもの）が受け取る。
   */
  readonly lastAnswerCorrect?: boolean;
  /** カウントダウン中か（チャレンジのみ。トレーニングでは false） */
  readonly isCountingDown?: boolean;
  /** トレーニングモードか（チャレンジでは未指定） */
  readonly isTraining?: boolean;
  /** 回答処理。正誤と次問題へ進むコールバックを渡す */
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 結果画面で問題別の内訳を出す練習の盤面 props
 * 記録付き練習盤面props
 */
export interface RecordingPracticeBoardProps<
  TResult,
> extends PracticeBoardProps {
  /** 回答結果の記録（チャレンジの結果画面用。トレーニングでは省略） */
  readonly onRecordResult?: (result: TResult) => void;
  /**
   * 出題した問題の届け出（チャレンジの結果画面用。トレーニングでは省略）
   *
   * 問題を出すたびに、その問題を「回答なし」で組んだ結果を渡す。答える前に
   * 制限時間が来たとき、時間切れの問題として一覧の末尾に残す。
   */
  readonly onPresentQuestion?: (unanswered: TResult) => void;
}
