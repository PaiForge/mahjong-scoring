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
  /**
   * 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined）
   *
   * 正誤を自分で判定できる盤面（選択肢と正解を持つ符・翻・役）は受け取らなくてよい。
   * 点数を select で答える盤面のように、回答そのものからは色を決められない
   * ものが受け取る。
   */
  readonly lastAnswerCorrect?: boolean;
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
   * 制限時間が来たとき、セッションがこれを時間切れの問題として一覧の末尾に
   * 残す。答えたら `onRecordResult` が上書きするので、盤面は取り消しを
   * 気にしなくてよい。各アプリの `usePresentQuestion` で出題状態に結び付ける
   */
  readonly onPresentQuestion?: (unanswered: TResult) => void;
}

/**
 * チャレンジ盤面の描画に渡される状態
 * チャレンジ盤面引数
 */
export interface ChallengeBoardArgs<TResult> extends PracticeBoardProps {
  /** チャレンジではカウントダウンが必ずあるため必須 */
  readonly isCountingDown: boolean;
  readonly lastAnswerCorrect: boolean | undefined;
  /** 問題結果の記録（レジストリで `hasProblemList` の練習のみ終了時に保存される） */
  readonly recordResult: (result: TResult) => void;
  /**
   * 出題中の問題の届け出（時間切れで答えられなかった問題を結果に残すため）。
   * 盤面の `onPresentQuestion` にそのまま渡す
   */
  readonly presentQuestion: (unanswered: TResult) => void;
}

/**
 * トレーニング盤面の描画に渡される状態
 * トレーニング盤面引数
 */
export interface TrainingBoardArgs extends PracticeBoardProps {
  /** トレーニングビューからの描画なので常に true */
  readonly isTraining: true;
  readonly lastAnswerCorrect: boolean | undefined;
}
