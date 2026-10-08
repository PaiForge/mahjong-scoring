import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { AnswerOutcome } from "@mahjong-scoring/features/results/result-schemas";

import { AccordionCard } from "../../components/accordion-card";
import { useScrollIntoView } from "../../components/scroll-into-view";
import { colors } from "../../lib/theme";
import { JudgementMark } from "./judgement-mark";
import { useRegisterMistakeReveal } from "./mistake-reveal";

interface ProblemListAccordionProps<T> {
  readonly results: readonly T[];
  /** `<namespace>.result.*` を引く辞書の名前空間 */
  readonly translationNamespace: string;
  readonly outcome: (result: T) => AnswerOutcome;
  /** 見出しに添える 1 行の要約（文字列） */
  readonly renderSummary?: (result: T, index: number) => string | undefined;
  readonly renderDetail: (result: T, index: number) => ReactNode;
}

/**
 * 問題別の結果一覧（web の `ProblemListAccordion`）
 * 問題別結果一覧
 *
 * 1 問 1 枚の開閉カード。見出しに番号・要約・正誤を出し、開くと内訳を見せる。
 *
 * 「結果」節の不正解の数（{@link import("./mistake-reveal").MistakeRevealProvider}
 * 経由）から呼ばれると、間違えた問題（不正解と時間切れ）をすべて開き、その
 * 先頭の見出しを画面の上端へ送る（web と同じ）。各問は既定で閉じているので、
 * 開かずに送ると閉じたカードの列に着地するだけで、どれを読めばよいかが
 * 分からない。中央ではなく上端に合わせるのは、開いた内訳が長いと中央寄せでは
 * 見出しが画面の上に切れるため。開いた後も各カードは押して閉じられる。
 */
export function ProblemListAccordion<T>({
  results,
  translationNamespace,
  outcome: outcomeOf,
  renderSummary,
  renderDetail,
}: ProblemListAccordionProps<T>) {
  const tResult = useTranslations(`${translationNamespace}.result`);
  const tCommon = useTranslations("common");
  const scrollIntoView = useScrollIntoView();
  const cardRefs = useRef(new Map<number, View>());
  const [openIndexes, setOpenIndexes] = useState<ReadonlySet<number>>(
    () => new Set(),
  );
  // 開いた後のスクロール先。開いた中身の配置が済んでから測るため state で運ぶ
  // （同じ問題へもう一度送れるよう、押すたびに新しいオブジェクトにする）
  const [scrollTarget, setScrollTarget] = useState<{ index: number }>();

  // 依存配列に載せるため、配列ではなく文字列で持つ
  const missedKey = results
    .flatMap((result, index) =>
      outcomeOf(result) === AnswerOutcome.Correct ? [] : [index],
    )
    .join(",");

  const reveal = useCallback(() => {
    const indexes = missedKey.split(",").map(Number);
    setOpenIndexes((prev) => new Set([...prev, ...indexes]));
    setScrollTarget({ index: indexes[0] ?? 0 });
  }, [missedKey]);
  useRegisterMistakeReveal(missedKey === "" ? undefined : reveal);

  useEffect(() => {
    if (scrollTarget === undefined) return;
    // 開いたカードの中身が配置され、スクロール枠の中身の高さが伸びてから
    // 送る（先に送ると Android は伸びる前の高さで止める）
    const frame = requestAnimationFrame(() => {
      scrollIntoView(cardRefs.current.get(scrollTarget.index) ?? null, {
        block: "start",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [scrollIntoView, scrollTarget]);

  if (results.length === 0) return undefined;

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{tResult("problemDetails")}</Text>
      <View style={styles.list}>
        {results.map((result, index) => {
          const outcome = outcomeOf(result);
          const summary = renderSummary?.(result, index);
          return (
            <View
              key={index}
              ref={(node) => {
                if (node === null) cardRefs.current.delete(index);
                else cardRefs.current.set(index, node);
              }}
              collapsable={false}
            >
              <AccordionCard
                open={openIndexes.has(index)}
                onOpenChange={(open) =>
                  setOpenIndexes((prev) => {
                    const next = new Set(prev);
                    if (open) next.add(index);
                    else next.delete(index);
                    return next;
                  })
                }
                title={
                  <View style={styles.title}>
                    <Text style={styles.number}>No.{index + 1}</Text>
                    {summary !== undefined && (
                      <Text style={styles.summary} numberOfLines={1}>
                        {summary}
                      </Text>
                    )}
                  </View>
                }
                trailing={
                  outcome === AnswerOutcome.TimeUp ? (
                    <Text style={styles.timeUp}>{tCommon("timeUp")}</Text>
                  ) : (
                    <>
                      <JudgementMark verdict={outcome} size={14} />
                      <Text
                        style={[
                          styles.verdict,
                          {
                            color:
                              outcome === AnswerOutcome.Correct
                                ? colors.success
                                : colors.destructive,
                          },
                        ]}
                      >
                        {outcome === AnswerOutcome.Correct
                          ? tResult("correct")
                          : tResult("incorrect")}
                      </Text>
                    </>
                  )
                }
              >
                {renderDetail(result, index)}
              </AccordionCard>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 8,
  },
  heading: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface500,
  },
  list: {
    gap: 8,
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  number: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface900,
  },
  summary: {
    fontSize: 14,
    color: colors.surface500,
    flexShrink: 1,
  },
  timeUp: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.surface500,
  },
  verdict: {
    fontSize: 14,
    fontWeight: "500",
  },
});
