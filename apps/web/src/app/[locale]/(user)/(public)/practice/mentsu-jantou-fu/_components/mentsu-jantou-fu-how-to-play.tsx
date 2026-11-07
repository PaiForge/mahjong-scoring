"use client";

import { useTranslations } from "next-intl";
import { Hai } from "@pai-forge/mahjong-react-ui";
import { QuestionPrompt } from "../../_components/question-prompt";
import { TehaiDisplay } from "../../_components/tehai-display";
import {
  DEMO_FU_CONTEXT,
  DEMO_FU_TEHAI,
} from "@mahjong-scoring/features/board/demo-tehai";
import { FU_OPTIONS } from "@mahjong-scoring/features/practice/fu-options";
import {
  MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT,
  MENTSU_JANTOU_FU_DEMO_ITEMS,
} from "@mahjong-scoring/features/practice/mentsu-jantou-fu/demo-items";

/**
 * 面子と雀頭の符計算の「問題方式」ビジュアルデモ
 * 面子・雀頭符 遊び方デモ
 *
 * 実際の出題盤面（手牌の提示と要素ごとの符入力）を、出題時（未回答）のまま
 * 静的に再現する。各行の体裁は盤面の
 * {@link import("./fu-item-row").FuItemRow} の未入力時に合わせる。
 *
 * 和了牌の枠も盤面と同じ判定（{@link findAgariHighlight}）から出す。デモは
 * 押せない静的な再現なので行の markup は持たせているが、どの牌に枠が付くかを
 * ここで別に決めると盤面と食い違う。
 *
 * 回答行は 5 要素すべてを並べると 700px 近くになり、説明ページの本題である
 * 開始ボタンが画面外へ押し出される。3 要素目の途中で高さを切り、下端を
 * 背景へ溶かして「まだ続く」ことだけを見せる。
 */
export function MentsuJantouFuHowToPlay() {
  const t = useTranslations("mentsuJantouFu");

  return (
    <div className="space-y-4">
      <TehaiDisplay tehai={DEMO_FU_TEHAI} context={DEMO_FU_CONTEXT} />

      <QuestionPrompt>{t("questionPrompt")}</QuestionPrompt>

      {/* 要素ごとの符入力（未入力の状態）。3 要素目の途中で切って背景へ溶かす。
          切る位置（max-h）は 2 要素分 + 3 要素目の牌が見える高さで、マスクの
          不透明部分（78% = 250px）はちょうど 2 要素目の下端で終わる */}
      <div className="max-h-80 overflow-hidden [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]">
        <div className="space-y-2">
          {MENTSU_JANTOU_FU_DEMO_ITEMS.map((item) => (
            <div
              key={item.id}
              className="space-y-2.5 rounded-panel border border-panel bg-white p-3"
            >
              <div className="flex gap-0.5">
                {item.tiles.map((tile, j) => (
                  <Hai
                    key={j}
                    hai={tile}
                    size="sm"
                    highlighted={
                      MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT?.itemId ===
                        item.id &&
                      MENTSU_JANTOU_FU_DEMO_AGARI_HIGHLIGHT.tileIndex === j
                    }
                  />
                ))}
              </div>

              <div className="grid grid-cols-6 gap-1.5">
                {FU_OPTIONS.map((fu) => (
                  <div
                    key={fu}
                    className="rounded-lg border border-surface-200 bg-white py-2.5 text-center text-sm font-bold text-surface-600"
                  >
                    {fu}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
