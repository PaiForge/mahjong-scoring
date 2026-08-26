/**
 * 練習盤面が共通で受け取る props
 * 練習盤面props
 *
 * チャレンジ・トレーニングのセッション（{@link ChallengeBoardArgs} /
 * {@link TrainingBoardArgs}）から盤面へ渡される状態と回答ハンドラ。
 * 各盤面はこれを extends して、出題条件など固有の props だけを足すこと。
 */
export interface PracticeBoardProps {
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback: boolean;
  /** カウントダウン中か（チャレンジのみ。トレーニングでは false） */
  readonly isCountingDown?: boolean;
  /**
   * トレーニングモードか（チャレンジでは未指定）
   *
   * 送信ボタンの語のように、同じ操作でも二つのモードで意味が変わる文言の出し分けに使う。
   * トレーニングは回答後に正解を読ませるが、チャレンジは押した瞬間に次問題へ進む。
   */
  readonly isTraining?: boolean;
  /** 回答処理。正誤と次問題へ進むコールバックを渡す */
  readonly onAnswer: (correct: boolean, onNext: () => void) => void;
}

/**
 * 結果ページで問題別の内訳を出す練習の盤面 props
 * 記録付き練習盤面props
 */
export interface RecordingPracticeBoardProps<
  TResult,
> extends PracticeBoardProps {
  /** 回答結果の記録（チャレンジの結果ページ用。トレーニングでは省略） */
  readonly onRecordResult?: (result: TResult) => void;
}
