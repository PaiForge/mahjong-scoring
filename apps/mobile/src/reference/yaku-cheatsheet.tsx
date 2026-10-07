import { useCallback, useRef, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  YAKU_HAN_ENTRIES,
  groupYakuHanEntriesByMenzenHan,
  isKuisagariEntry,
  parseHais,
  parseTehai,
  type YakuHanEntry,
} from "@mahjong-scoring/core";
import {
  YAKU_EXAMPLES,
  hasYakuCheatsheetEntry,
  type YakuExampleHand,
  type YakuExampleSet,
} from "@mahjong-scoring/features/yaku/examples";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import { yakuHanLabel } from "@mahjong-scoring/features/yaku/yaku-han-label";

import { TehaiHand } from "../board/tehai-hand";
import { AccordionCard } from "../components/accordion-card";
import { Chip } from "../components/chip";
import { useScrollIntoView } from "../components/scroll-into-view";
import { SectionTitle } from "../components/section-title";
import { colors } from "../lib/theme";

/** 早見表に載せる役（除外役・例未定義を除く）を門前翻数ごとにまとめる */
function groupByMenzenHan() {
  return groupYakuHanEntriesByMenzenHan(
    YAKU_HAN_ENTRIES.filter((entry) => hasYakuCheatsheetEntry(entry.name)),
  );
}

/**
 * 役の早見表（翻数別の一覧。web の `YakuCheatsheet`）
 * 役チートシート
 *
 * 役名・翻数は core の `YAKU_HAN_ENTRIES` を単一ソースとする。翻数は節の
 * 見出しで示し、鳴きの扱いはカード右端に添える（門前限定役は「門前限定」の
 * 印、食い下がり役は「鳴きN翻」。無表示は鳴いても翻数が変わらない役）。
 * カードを開くと出題盤面と同じ `TehaiHand` で手牌の例を見せる。
 *
 * 役一覧の画面と、和了形の点数計算の答え合わせから開くシートで共有する。広告は
 * 役一覧の画面だけが渡し、翻数のまとまりの末尾に間隔を広げながら置く
 * （位置は `adIndexAfterGroup`。web と同じ）。
 */
export function YakuCheatsheet({
  markedYakuNames,
  focusedYakuName,
  ads = [],
}: {
  /**
   * 「今見ている手で成立している役」として印を付ける役名。答え合わせから
   * 開いたときに、正解だった役へ視線を誘導する
   */
  readonly markedYakuNames?: readonly string[];
  /** 表示直後に開いて、そこまでスクロールする役名 */
  readonly focusedYakuName?: string;
  /** まとまりの間に置く広告（描画済み。並び順どおり） */
  readonly ads?: readonly ReactNode[];
}) {
  const t = useTranslations("reference.yaku");

  // 開いた役が置かれたら一度だけ中央へ寄せる
  const scrollIntoView = useScrollIntoView();
  const focusRef = useRef<View>(null);
  const hasScrolled = useRef(false);
  const handleFocusLayout = useCallback(() => {
    if (hasScrolled.current) return;
    hasScrolled.current = true;
    scrollIntoView(focusRef.current);
  }, [scrollIntoView]);

  const nakiLabel = (entry: YakuHanEntry) => {
    // 門前限定は成立可否の制約なので印で強調し、食い下がりは翻数の補足
    // として控えめな文字で出す
    if (entry.nakiHan === undefined) {
      return <Chip tone="amber">{t("menzenOnly")}</Chip>;
    }
    if (isKuisagariEntry(entry)) {
      return (
        <Text style={styles.nakiHan}>
          {t("nakiHan", { count: entry.nakiHan })}
        </Text>
      );
    }
    return undefined;
  };

  return (
    <View style={styles.root}>
      {groupByMenzenHan().map(({ han, entries }, groupIndex) => {
        const adIndex = adIndexAfterGroup(groupIndex);
        const ad = adIndex === undefined ? undefined : ads[adIndex];
        return (
          <View key={han} style={styles.group}>
            <SectionTitle>{yakuHanLabel(han, t)}</SectionTitle>
            <View style={styles.cards}>
              {entries.map((entry) => {
                const isFocused = entry.name === focusedYakuName;
                const card = (
                  <AccordionCard
                    key={entry.name}
                    defaultOpen={isFocused}
                    title={
                      <View style={styles.title}>
                        <Text style={styles.name}>{entry.name}</Text>
                        {markedYakuNames?.includes(entry.name) === true && (
                          <Chip tone="primary">{t("inThisHand")}</Chip>
                        )}
                      </View>
                    }
                    trailing={nakiLabel(entry)}
                  >
                    <YakuExampleList examples={YAKU_EXAMPLES[entry.name]} />
                  </AccordionCard>
                );
                return isFocused ? (
                  <View
                    key={entry.name}
                    ref={focusRef}
                    onLayout={handleFocusLayout}
                    collapsable={false}
                  >
                    {card}
                  </View>
                ) : (
                  card
                );
              })}
              {ad}
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** 例示手牌 1 つ。見出す相手がない例（形も牌も 1 通り）はラベルを持たない */
function YakuExample({
  hand,
  label,
}: {
  readonly hand: YakuExampleHand;
  readonly label?: string;
}) {
  const t = useTranslations("common");
  const tehai = parseTehai(hand.mpsz);
  if (!tehai) return undefined;
  const { agari } = hand;

  return (
    <View style={styles.example}>
      {label !== undefined && <Text style={styles.label}>{label}</Text>}
      <TehaiHand
        tehai={tehai}
        agariHai={agari && parseHais(agari.hai)[0]}
        agariLabel={agari && (agari.type === "tsumo" ? t("tsumo") : t("ron"))}
        agariLabelTone="light"
      />
    </View>
  );
}

/**
 * 役の例示手牌の一覧（web の `YakuExampleList`）
 * 役例示手牌
 *
 * 鳴いて成立する役は門前形と副露形を並べ、役牌のように複数の牌で示す役は
 * 牌ごとにその対を並べる。ラベルは「牌・形」を 1 行に畳む。
 */
function YakuExampleList({
  examples,
}: {
  readonly examples: readonly YakuExampleSet[] | undefined;
}) {
  const t = useTranslations("reference.yaku");
  if (examples === undefined) return undefined;

  /** 与えられた見出しを 1 行に畳む。1 つも無ければラベル自体を出さない */
  const label = (...segments: readonly (string | undefined)[]) => {
    const parts = segments.filter((segment) => segment !== undefined);
    return parts.length === 0
      ? undefined
      : parts.join(t("exampleLabelSeparator"));
  };

  return (
    <View style={styles.examples}>
      {examples.map((example) => (
        <View key={example.variant ?? example.menzen.mpsz} style={styles.set}>
          <YakuExample
            hand={example.menzen}
            label={label(
              example.variant,
              // 副露形と並ぶときだけ「門前」と断る
              example.naki === undefined ? undefined : t("exampleMenzen"),
            )}
          />
          {example.naki !== undefined && (
            <YakuExample
              hand={example.naki}
              label={label(example.variant, t("exampleNaki"))}
            />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 32,
  },
  group: {
    gap: 12,
  },
  cards: {
    gap: 8,
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    flexShrink: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.surface900,
  },
  nakiHan: {
    fontSize: 13,
    color: colors.surface500,
  },
  examples: {
    gap: 16,
  },
  set: {
    gap: 12,
  },
  example: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: colors.surface400,
  },
});
