import type {
  AgariContext,
  HaiKindId,
  KazeContext,
  RuleConfig,
  Tehai,
} from "@mahjong-scoring/core";

/**
 * 出題盤面の手牌表示に必要なコンテキスト情報
 * 出題コンテキスト
 *
 * core の {@link AgariContext} に表示上の任意項目を足したもの。
 * リーチ表示とドラ表示はそれを持たない練習からも使われるため任意。
 * 和了牌とツモ・ロンの別も任意で、聴牌形（待ち別点数計算）のように
 * まだ和了していない手牌を出すときは省く。
 *
 * ドラは常に「表示牌」で受け取る。表示牌のまま出すか、ドラそのものへ
 * 読み替えて出すかは表示設定で決まる。
 *
 * 盤面コンポーネントではなくここに置くのは、結果の保存形式
 * （`score-question-result`）がこの形を復元するため。ドメインの型が
 * 描画コンポーネントに依存しないよう、データの形だけをアプリ横断で持つ。
 */
export type TehaiContext = KazeContext &
  Partial<AgariContext> & {
    readonly isRiichi?: boolean;
    readonly doraMarkers?: readonly HaiKindId[];
    /** 裏ドラ表示牌。リーチしている出題でのみ表示する */
    readonly uraDoraMarkers?: readonly HaiKindId[];
    /**
     * 採点に使ったルール設定。面子分解の候補を正解と同じ設定で評価する
     * ために出題から引き継ぐ。保存を始める前の結果データには無い
     */
    readonly ruleConfig?: RuleConfig;
  };

/**
 * 手牌表示に必要な出題データの表示専用サブセット
 * 出題表示データ
 *
 * 盤面のコンテキスト（{@link TehaiContext}）に手牌を足した平坦な形。
 * `ScoreQuestion` はこの型を構造的に満たすためそのまま渡せる。別型に
 * している理由は結果ページでの再表示: sessionStorage から復元した出題は
 * ブランド型（Tehai14）と正解データ（answer）を持たないが、描画には
 * どちらも不要なため、描画が実際に読む形だけをここで要求する。
 */
export interface ScoreQuestionDisplayData extends TehaiContext {
  /** 和了牌。点数計算の出題は和了形なので必須（盤面の型では任意） */
  readonly agariHai: HaiKindId;
  /** ツモ和了かどうか。同上 */
  readonly isTsumo: boolean;
  /** 手牌（和了牌を含む。純手牌 + 副露） */
  readonly tehai: Pick<Tehai, "closed" | "exposed">;
  /** ドラ表示牌。点数計算の出題では必須 */
  readonly doraMarkers: readonly HaiKindId[];
}
