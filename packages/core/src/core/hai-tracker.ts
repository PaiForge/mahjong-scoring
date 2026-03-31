import { ok, err, type Result } from "neverthrow";
import type { HaiKindId } from "@pai-forge/riichi-mahjong";

/**
 * 牌使用状況を管理するトラッカー
 * 手牌生成時に各牌種の使用枚数（最大4枚）を追跡する
 * 牌使用状況管理
 */
export class HaiUsageTracker {
  private readonly usage: number[] = Array.from({ length: 34 }, () => 0);

  /**
   * 指定枚数の使用が可能かどうかを判定する
   * 使用可否判定
   */
  canUse(kindId: HaiKindId, count: number = 1): boolean {
    return this.usage[kindId] + count <= 4;
  }

  /**
   * 指定枚数を使用済みとして記録する
   * 牌使用登録
   *
   * @returns 使用登録に成功した場合 Ok(undefined)、上限超過の場合 Err(string)
   */
  use(kindId: HaiKindId, count: number = 1): Result<void, string> {
    if (!this.canUse(kindId, count)) {
      return err(`牌種ID ${kindId} の使用枚数が上限を超えています (残り: ${4 - this.usage[kindId]}, 要求: ${count})`);
    }
    this.usage[kindId] += count;
    return ok(undefined);
  }
}
