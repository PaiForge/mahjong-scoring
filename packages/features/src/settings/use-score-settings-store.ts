import type { ScoreRange } from "@mahjong-scoring/core";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { SettingsStoreOptions } from "./settings-store-options";

/** 点数計算系の練習の設定（和了形の点数計算・聴牌形の点数計算で共通の項目） */
export interface ScoreSettingsState {
  /** 役も回答するかどうか */
  requireYaku: boolean;
  setRequireYaku: (enabled: boolean) => void;
  /**
   * 翻数と符も回答するかどうか。実戦では点数だけを申告するため、既定では
   * 点数だけを答える。5翻以上の答え方（`exactHan`）と満貫以上の符
   * （`requireFuForMangan`）は、これが有効なときだけ意味を持つ
   */
  requireHanFu: boolean;
  setRequireHanFu: (enabled: boolean) => void;
  /** 5翻以上も翻数で回答するかどうか（既定では満貫・跳満…の区分で回答する） */
  exactHan: boolean;
  setExactHan: (enabled: boolean) => void;
  /** 満貫以上でも符を入力するかどうか */
  requireFuForMangan: boolean;
  setRequireFuForMangan: (enabled: boolean) => void;
  /** 出題する点数範囲 */
  targetScoreRanges: ScoreRange[];
  setTargetScoreRanges: (ranges: ScoreRange[]) => void;
  /** 出題する役（日本語役名、空 = 絞り込みなし） */
  targetYaku: string[];
  setTargetYaku: (yaku: string[]) => void;
  /**
   * 回答時間を計測するかどうか（Pro の拡張機能）。
   * 保存はするが、Pro でなければ設定画面が play へ渡さない
   */
  measureTime: boolean;
  setMeasureTime: (enabled: boolean) => void;
  /** 親を出題に含めるかどうか */
  includeParent: boolean;
  setIncludeParent: (enabled: boolean) => void;
  /** 子を出題に含めるかどうか */
  includeChild: boolean;
  setIncludeChild: (enabled: boolean) => void;
}

/**
 * 点数計算系の練習の設定ストアを作る（永続化あり）
 * 点数練習設定ストア生成
 *
 * 和了形の点数計算と聴牌形の点数計算は同じ設定項目を持つが、片方で変えた
 * 設定がもう片方に及ばないよう、練習ごとに別の保存名で持つ。
 *
 * @design 保存値の版は持たず、移行もしない
 * persist の `version` と `migrate` は使わない（他の端末ローカル設定ストアと
 * 同じ。方針は {@link SettingsStoreOptions} を参照）。項目を足すときは既定値を
 * 書くだけでよく、保存値に無い項目は浅いマージが既定値で補う。項目の意味や
 * 型を変えるときは項目のキー名か保存名を変え、古い保存値は読まずに捨てる。
 * `version` を上げて `migrate` を書き始めないこと — 移行の分岐は読む人に
 * 「どの版の値が来るか」を考えさせ、項目を足すたびに「版を上げるべきか」の
 * 判断を生む。
 *
 * 以前はこのストアだけが `version: 2` と `migrate`（点数帯の表記の変換と
 * 「自動で次へ」の廃止）を持っていた。利用者がいないうちに外したので、
 * その頃に保存した端末（開発者の端末）では、保存値の版が合わず既定値で始まる。
 * zustand は `migrate` の無い版違いの保存値を書き戻さないため、設定を一度
 * 書き込むまでは読み込みのたびに console.error（"State loaded from storage
 * couldn't be migrated …"）が出る。どれかの設定を切り替えるか保存名のキーを
 * 消せば止まる。
 *
 * @param name - 保存名（web では localStorage のキー）
 * @param options - 保存先
 */
export function createScoreSettingsStore(
  name: string,
  { storage }: SettingsStoreOptions,
) {
  return create<ScoreSettingsState>()(
    persist(
      (set) => ({
        requireYaku: false,
        setRequireYaku: (requireYaku) => set({ requireYaku }),
        requireHanFu: false,
        setRequireHanFu: (requireHanFu) => set({ requireHanFu }),
        exactHan: false,
        setExactHan: (exactHan) => set({ exactHan }),
        requireFuForMangan: false,
        setRequireFuForMangan: (requireFuForMangan) =>
          set({ requireFuForMangan }),
        targetScoreRanges: ["nonMangan", "manganPlus"],
        setTargetScoreRanges: (targetScoreRanges) => set({ targetScoreRanges }),
        targetYaku: [],
        setTargetYaku: (targetYaku) => set({ targetYaku }),
        measureTime: false,
        setMeasureTime: (measureTime) => set({ measureTime }),
        includeParent: true,
        setIncludeParent: (includeParent) => set({ includeParent }),
        includeChild: true,
        setIncludeChild: (includeChild) => set({ includeChild }),
      }),
      {
        name,
        storage: createJSONStorage(storage),
      },
    ),
  );
}
