import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import { glossaryTermPreview } from "@mahjong-scoring/features/glossary/views";
import { PREFERENCES_PATH } from "@mahjong-scoring/features/routes";

import { InfoModal } from "../components/info-modal";
import { TextLink } from "../components/text-link";
import { linkStyles } from "../lib/link-styles";
import { colors } from "../lib/theme";
import { MentsuSet, TileSet } from "../lessons/components/tile-row";

/** 7 枚以上並べる例は 1 段小さい牌にする（シートの幅に収めるため） */
const MANY_TILES_THRESHOLD = 7;

/** slug の用語のシートを開く。未知の slug なら何もしない */
type OpenTerm = (slug: string) => void;

const TermSheetContext = createContext<OpenTerm | undefined>(undefined);

/**
 * 最寄りの用語シートを開く関数
 *
 * プロバイダの外では undefined（用語は押せない地の文になる）。
 */
export function useOpenTerm(): OpenTerm | undefined {
  return useContext(TermSheetContext);
}

/**
 * 本文の用語リンクが共有する 1 枚のシート（web の `GlossaryTermModalProvider`）
 * 用語シート
 *
 * 用語を押すと、ページを離れずにその語の読み・定義・例示を下からのシートで
 * 見せ、用語の画面へ進める。読んでいる途中で語の意味を確かめる読者を、
 * 画面の移動でレッスンから引き剥がさないため。
 *
 * 用語リンクを切る設定への導線もここに置く。リンクが邪魔だと感じるのは
 * たいてい意図せずシートが開いた瞬間で、設定を自分から見に行く読者しか
 * 辿り着けない状態では、いちばん困っている人に届かないため（web と同じ）。
 */
export function TermSheetProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const t = useTranslations("glossary");
  const router = useRouter();
  const [activeSlug, setActiveSlug] = useState<string | undefined>(undefined);
  const active =
    activeSlug === undefined
      ? undefined
      : glossaryTermPreview(activeSlug, (key) => t(key));
  const close = () => setActiveSlug(undefined);

  const openTerm = useMemo<OpenTerm>(
    () => (slug) => {
      setActiveSlug(slug);
    },
    [],
  );

  // 移動する前に閉じる（開いたままだと戻ったときにシートが残る）
  const go = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <TermSheetContext.Provider value={openTerm}>
      {children}
      <InfoModal
        isOpen={active !== undefined}
        onClose={close}
        title={active?.term ?? ""}
        closeLabel={t("closeLabel")}
        footnote={
          // 主役は語の意味なので、「用語ページを見る」と同じ強さで並べない
          <TextLink onPress={() => go(PREFERENCES_PATH)}>
            {t("turnOffTermLinks")}
          </TextLink>
        }
      >
        {active !== undefined && (
          <View style={styles.body}>
            <Text style={styles.reading}>{active.reading}</Text>
            <Text style={styles.definition}>{active.definition}</Text>
            {active.example !== undefined && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {"mentsu" in active.example ? (
                  <MentsuSet mentsu={active.example.mentsu} />
                ) : (
                  <TileSet
                    tiles={active.example.tiles}
                    size={
                      active.example.tiles.length >= MANY_TILES_THRESHOLD
                        ? "xs"
                        : "sm"
                    }
                  />
                )}
              </ScrollView>
            )}
            {active.example?.caption !== undefined && (
              <Text style={styles.caption}>{active.example.caption}</Text>
            )}
            <Text
              onPress={() => go(active.href)}
              accessibilityRole="link"
              style={[styles.details, linkStyles.textButton]}
            >
              {t("viewDetails")}
            </Text>
          </View>
        )}
      </InfoModal>
    </TermSheetContext.Provider>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 12,
  },
  reading: {
    fontSize: 13,
    color: colors.surface400,
  },
  definition: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface700,
  },
  caption: {
    fontSize: 13,
    color: colors.surface500,
  },
  details: {
    fontSize: 15,
  },
});
