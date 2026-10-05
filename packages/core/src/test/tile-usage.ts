import { expect } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 牌の枚数上限の検証ヘルパー
 * 牌枚数検証
 *
 * 同じ牌種は 4 枚しか存在しない。手牌の中はブランド型の入口
 * （`validateTehai14`）が守るが、ドラ表示牌は手牌の外なので誰も見ていない。
 * 出題を「盤面に見えている牌の集合」として渡し、5 枚目が現れないことを見る。
 *
 * このモジュールはテスト専用。
 */
export function expectHaiUsageWithinLimit(
  hais: readonly HaiKindId[],
  label: string,
): void {
  const counts = new Map<HaiKindId, number>();
  for (const hai of hais) counts.set(hai, (counts.get(hai) ?? 0) + 1);

  for (const [kind, count] of counts) {
    expect(count, `${label}: 牌種 ${kind}`).toBeLessThanOrEqual(4);
  }
}

/** {@link expectAgariHaiNotKantsuKind} が見る出題の形（手牌の副露と和了牌） */
interface QuestionWithExposed {
  readonly tehai: {
    readonly exposed: readonly {
      readonly type: MentsuType;
      readonly hais: readonly HaiKindId[];
    }[];
  };
  readonly context: { readonly agariHai: HaiKindId };
}

/**
 * 和了牌が槓子（カン）の牌種と一致しないことの検証ヘルパー
 * 槓子和了牌検証
 *
 * 槓子は同じ牌4枚を束縛するため5枚目が存在せず、その牌では和了できない
 * （例: 7筒アンカンなのに和了牌が7筒、という不正な問題を防ぐ）。一方、
 * 暗刻＋チー等で同一牌種が手牌に4枚あっても和了は合法なので、「4枚あるか」
 * ではなく「カンの牌種か」で判定する。
 *
 * このモジュールはテスト専用。
 */
export function expectAgariHaiNotKantsuKind(
  questions: readonly QuestionWithExposed[],
): void {
  for (const q of questions) {
    for (const m of q.tehai.exposed) {
      if (m.type === MentsuType.Kantsu) {
        expect(q.context.agariHai).not.toBe(m.hais[0]);
      }
    }
  }
}
