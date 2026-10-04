import type { HaiKindId, Kazehai } from "@mahjong-scoring/core";

/**
 * レッスンの確認問題の型
 * レッスン確認問題
 *
 * @description
 * レッスンごとの問題と選択肢を、表示（web の `LessonView`）から切り離して
 * 持つための型。レッスンは章ごとに問う内容が違う（点数・ツモの支払い・
 * 翻数）が、進行（説明 → 問題 → できたことの確認）は共通なので、違いは
 * この型の値として表し、進行の部品は 1 つで済ませる。
 *
 * 文言は持たない。条件文・ヒント・解説は辞書
 * （`lessons.<messageKey>.condition` / `questions.<key>.{hint,explanation}`）に
 * あり、ここに置くのは辞書に差し込む値と正解だけ。点数や翻数は core の
 * データから導き、各レッスンのファイルに数字を直書きしない。
 */

/**
 * 選択肢 1 つ
 * レッスン選択肢
 *
 * - `points`: 点数（ロン）
 * - `koTsumo`: 子のツモの支払い（子ひとり / 親）
 * - `oyaTsumo`: 親のツモの支払い（オール）
 * - `han`: 翻数
 * - `yakuman`: 役満（翻数の選択肢の最上位）
 * - `fu`: 符
 */
export type LessonChoice =
  | { readonly kind: "points"; readonly points: number }
  | {
      readonly kind: "koTsumo";
      readonly fromKo: number;
      readonly fromOya: number;
    }
  | { readonly kind: "oyaTsumo"; readonly all: number }
  | { readonly kind: "han"; readonly han: number }
  | { readonly kind: "yakuman" }
  | { readonly kind: "fu"; readonly fu: number };

/**
 * 問題の条件（辞書の `condition` に差し込む値）
 * レッスン条件
 *
 * - `tier`: 翻数と点数の帯（満貫・跳満 …）。帯の名前は `scoreTable.<tierKey>`
 * - `yaku`: 役名と、門前か鳴きか
 * - `jantou`: 雀頭の牌と、場風・自風（牌は条件文の下に並べて見せる）
 */
export type LessonPrompt =
  | { readonly kind: "tier"; readonly tierKey: string; readonly han: number }
  | { readonly kind: "yaku"; readonly yaku: string; readonly naki: boolean }
  | {
      readonly kind: "jantou";
      readonly tile: HaiKindId;
      readonly bakaze: Kazehai;
      readonly jikaze: Kazehai;
    };

/**
 * 確認問題 1 問
 * レッスン問題
 */
export interface LessonQuestion {
  /** ヒント・解説の辞書キー（`lessons.<messageKey>.questions.<key>`） */
  readonly key: string;
  readonly prompt: LessonPrompt;
  /** 正解の選択肢（`choices` のどれかと {@link isSameChoice} で一致する） */
  readonly answer: LessonChoice;
}

/**
 * 1 レッスン分の確認問題
 * レッスン確認問題一式
 *
 * 選択肢は全問で共通（表の 1 列をそのまま並べる）。問ごとに選択肢を変えると、
 * 説明で見た表と選択肢の並びが一致しなくなる。
 */
export interface LessonQuiz {
  /** 出題順 */
  readonly questions: readonly LessonQuestion[];
  /** 選択肢（表示順） */
  readonly choices: readonly LessonChoice[];
}

/**
 * 選択肢を識別する文字列を返す
 * 選択肢キー
 *
 * React の key と正誤判定に使う。同じ値の選択肢は同じキーになる。
 */
export function choiceKey(choice: LessonChoice): string {
  switch (choice.kind) {
    case "points":
      return `points:${choice.points}`;
    case "koTsumo":
      return `koTsumo:${choice.fromKo}/${choice.fromOya}`;
    case "oyaTsumo":
      return `oyaTsumo:${choice.all}`;
    case "han":
      return `han:${choice.han}`;
    case "yakuman":
      return "yakuman";
    case "fu":
      return `fu:${choice.fu}`;
  }
}

/** 2 つの選択肢が同じ値か */
export function isSameChoice(a: LessonChoice, b: LessonChoice): boolean {
  return choiceKey(a) === choiceKey(b);
}
