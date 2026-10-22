import { isOya } from "@mahjong-scoring/core";
import type {
  ScoreQuestion,
  ScoreTableQuestion,
  ScoreTableUserAnswer,
} from "@mahjong-scoring/core";

import type { ScoreOptionRange } from "./get-available-scores";

/**
 * 点数回答フォームが答える対象（親子・ツモロン・翻数）
 * 点数回答の対象
 *
 * 点数の選択肢はこの 3 つから絞る。点数表早引きの問題
 * （{@link ScoreTableQuestion}）はこの形をそのまま持つ。
 */
export interface ScoreAnswerTarget {
  /** 親かどうか */
  readonly isOya: boolean;
  /** ツモかどうか */
  readonly isTsumo: boolean;
  /** 翻数 */
  readonly han: number;
}

/**
 * 手牌から点数を答える問題（{@link ScoreQuestion}）の回答対象を取り出す
 *
 * 親子は自風（東なら親）から、翻数は正解から導く。点数計算チャレンジ・
 * 昇級試験の回答フォームが、出題から `isOya` / `isTsumo` / `han` を組む
 * ために使う。
 */
export function scoreAnswerTargetOf(
  question: ScoreQuestion,
): ScoreAnswerTarget {
  return {
    isOya: isOya(question.jikaze),
    isTsumo: question.isTsumo,
    han: question.answer.han,
  };
}

/**
 * 点数系練習共通の回答フォームの props（web とアプリで共有）
 * 点数回答フォームprops
 *
 * 点数のみを選択欄（web は select、アプリはピッカー）で回答する。翻・符・
 * 親子・ツモロンの判定は呼び出し元が行い、{@link ScoreAnswerTarget} で渡す。
 * 子ツモは表示設定（`settings/ko-tsumo-input.ts`）に従い、「300/500」の
 * ような組の 1 つの欄か、「子から / 親から」の 2 つの欄で答える。
 *
 * 回答直後は選択欄自身の枠と地の色で正誤を返す。選択肢を 1 つずつ染め
 * 分けられない代わりに、押した欄がそのまま答えになる。正解の点数は出さない —
 * 答え合わせは結果ページの問題別フィードバック一覧の役目で、トレーニングでは
 * 各アプリの `RevealedScoreAnswer` が別に出す。
 *
 * @remarks
 * 問題が変わったときの入力リセットは、呼び出し元が `key` に問題の識別子を
 * 渡して再マウントさせることで行う（`useEffect` での state リセットはしない）。
 */
export interface ScoreAnswerFormProps extends ScoreAnswerTarget {
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** i18n の翻訳ネームスペース */
  readonly translationNamespace: string;
  /**
   * 正誤フィードバック表示中か（セッションから受け取る）。
   * 回答した選択欄の枠と地を正誤の色にする。
   */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /**
   * 点数の選択肢をこの範囲に固定する（省略時は翻数から絞る）。
   * 出題が範囲を固定している練習（昇級試験）が渡す。
   */
  readonly scoreRange?: ScoreOptionRange;
  /**
   * 選択完了時に自動送信する（「回答する」ボタンを押さずに送信扱いにする）。
   * 単一選択・子ツモの組の欄は値が選ばれた時点、子ツモの分割入力は
   * 2 つとも選ばれた時点で送信する。
   * 有効時は送信ボタンを表示しない。
   * 選択即送信
   *
   * 点数を選択欄で答える盤面（点数表早引き・点数即答・昇級試験）は
   * すべて有効にしている。選択欄は 1 つの値しか持てず、選び直しもボタンを
   * 押す前に済むため、確定のボタンが「同じ答えをもう一度言う」だけの
   * 1 タップになる。制限時間の中ではその 1 タップがそのまま持ち時間を削り、
   * 画面によってボタンの有無が変わると同じ選択欄の回答なのに作法が変わる。
   * 子ツモの分割入力（表示設定）は「子から / 親から」の 2 つが揃うまで
   * 送信しないので、1 つ目は 2 つ目を選ぶ前なら直せる。
   *
   * 想定する操作はスマホのタップと、デスクトップでもマウス・タッチパッド。
   * web のキーボード操作（Windows / Linux の Chrome では閉じた select に
   * 矢印キーを押すと開かずに値が変わり、最初の 1 回で送信される）と
   * スクリーンリーダー（選択肢を読み上げながら辿る操作が同じく送信になる。
   * WCAG 3.2.2 の観点で望ましくない）は、現時点では意図的にケアしていない。
   * 対応するなら `keydown` で矢印キー由来の変更を送信対象から外す形になる。
   * iOS Safari のピッカーは実機で確認済みで、選び終えた値で 1 回送信される。
   */
  readonly autoSubmit?: boolean;
  /**
   * ダブル役満を採用したルールでの出題か。採用時はダブル役満の点数
   * （子64000点等）を選択肢に足す。端末のルール設定で選択肢が変わっては
   * ならない出題（昇級試験）は渡さない（既定 false）。
   */
  readonly allowDoubleYakuman?: boolean;
  /**
   * 選択肢を端末のルール設定（切り上げ満貫・ダブル役満）に依らない集合に
   * 固定する（既定 false）。
   * ルール固定
   *
   * 記録が残るチャレンジと昇級試験が立てる。設定で選択肢の個数が変わると
   * 同じ土俵の中で有利不利が出るため（`challenge/rule-boundary.ts` 参照）。
   * true のとき `allowDoubleYakuman` は無視され、切り上げ満貫も無効として
   * 絞り込む。
   */
  readonly fixedRules?: boolean;
}

/**
 * 点数計算チャレンジ共通の回答フォームの props（web とアプリで共有）
 * 点数計算チャレンジ回答フォームprops
 *
 * 親子・ツモロンの別は出題（`question`）から導く
 * （{@link scoreAnswerTargetOf}）ので、呼び出し側は渡さない。
 */
export interface ScoreChallengeAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答・無回答の正解開示中は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /** i18n の翻訳ネームスペース（例: "scoreCalculationChallenge"） */
  readonly translationNamespace: string;
  /** 選択肢を絞る点数帯。出題条件と揃える。省略時は絞らない */
  readonly scoreRange?: ScoreOptionRange;
  /**
   * トレーニングモードか（チャレンジでは未指定）。
   * トレーニングだけが端末のルール設定で選択肢を変える
   */
  readonly isTraining?: boolean;
}

/**
 * 昇級試験（点数計算）共通の回答フォームの props（web とアプリで共有）
 * 昇級試験回答フォームprops
 *
 * 選択肢は必ず `scoreRange` で固定する（点数帯に絞る試験は帯を、絞らない
 * 試験は `"all"` を渡す）。翻数から絞ると選択肢の個数がそのまま翻数の
 * ヒントになり、さらに切り上げ満貫が効く境界（30符4翻など）では端末
 * ローカルのルール設定で選択肢が受験者ごとに変わってしまう。合格ラインは
 * 全受験者に同じ 1 本なので、選択肢は端末設定に依存してはならない
 * （フォームは `fixedRules` を立てる）。
 * 例外は表示設定の子ツモの入力方式（組の 1 つの欄か、子から / 親からの
 * 2 つか）で、これはルール設定ではなく答え方の形なので試験でも従う。入力
 * 方式による難易度差を許容する判断は `settings/ko-tsumo-input.ts` に書いた。
 */
export interface ScoreExamAnswerFormProps {
  readonly question: ScoreQuestion;
  /** フォームリセット用のインデックス（問題が変わるたびにインクリメントされる） */
  readonly questionIndex: number;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** 正誤フィードバック表示中か（セッションから受け取る） */
  readonly showFeedback?: boolean;
  /** 直前の回答が正解だったか（未回答は undefined） */
  readonly lastAnswerCorrect?: boolean;
  /** i18n の翻訳ネームスペース（例: "manganExamChallenge"） */
  readonly translationNamespace: string;
  /** 選択肢を固定する範囲。出題条件と揃える */
  readonly scoreRange: ScoreOptionRange;
}

/**
 * 点数表早引き練習の回答フォームの props（web とアプリで共有）
 * 点数表回答フォームprops
 *
 * 翻・符は問題文として表示されるため入力不要。問題（{@link ScoreTableQuestion}）
 * は親子・ツモロン・翻数をそのまま持つので、導出なしでフォームへ渡せる。
 */
export interface ScoreTableAnswerFormProps {
  readonly question: ScoreTableQuestion;
  readonly onSubmit: (answer: ScoreTableUserAnswer) => void;
  readonly disabled?: boolean;
  /** トレーニングモードか。トレーニングだけが端末のルール設定で選択肢を変える */
  readonly isTraining?: boolean;
}
