import {
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewInstance,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  Stack,
  usePathname,
  useNavigation,
  useRoute,
  useRouter,
} from "expo-router";
import { HeaderHeightContext } from "expo-router/react-navigation";
import { useTranslations } from "use-intl";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useCloseModal } from "../hooks/use-open-from-modal";
import { backFallbackHref } from "../lib/back-fallback";
import { MODAL_ROUTE_NAMES } from "../lib/modal-routes";
import {
  HEADER_LARGE_TITLE_STYLE,
  HEADER_TITLE_STYLE,
} from "../lib/stack-options";
import { colors } from "../lib/theme";
import {
  HeaderActionContext,
  HeaderButton,
  type HeaderAction,
  type HeaderActionRegistry,
} from "./header-action";
import { ScrollIntoViewProvider, type ScrollInsets } from "./scroll-into-view";

/**
 * 本文の上の余白
 *
 * ヘッダーの直下に付けたい子（盤面の帯）が、この値ぶん上へ食い込んで打ち消す
 * （`TehaiDisplay` の `flushTop`）
 */
export const SCREEN_CONTENT_PADDING_TOP = 20;

/** 本文の下の余白（下端の safe area・タブバーのぶんは OS が inset で足す） */
const CONTENT_PADDING_BOTTOM = 32;

interface ScreenProps {
  /**
   * 見出し（OS のヘッダーに出す）。省略するとヘッダーを出さない
   *
   * タブの入口では大きな見出し（iOS の large title。スクロールで畳まれる）、
   * それ以外は中央の小さな見出し。タブの入口でも `stickyHeaderIndices` を
   * 渡した画面（点数表）は中央の小さな見出しにする（理由は同 prop）。
   */
  readonly title?: string;
  /**
   * ヘッダー右の操作（ヘルプの「?」等）
   *
   * 中身は本文の木の中に大きさ 0 で描き、その中の `HeaderIconButton` が登録した
   * ボタンだけをヘッダーに出す（`header-action.tsx`）。ヘッダーの要素は
   * ナビゲーターが描くので、ここに直接描くとシートの開閉の状態と画面の中の
   * Context を失うため。
   */
  readonly titleAction?: ReactNode;
  /** ヘッダー左に戻る（または ×）を出す。出し方は {@link Screen} の表 */
  readonly back?: boolean;
  /**
   * 戻るボタンの動作の上書き
   *
   * 既定は OS の戻る（下に画面が無ければ入口へ置き換える）。解答中の画面の
   * ように「戻る = 終了」で確認を挟むときや、戻る先を説明画面に固定したいときに
   * 渡す。渡すと OS の戻るを隠して自前のボタンを出し、その画面の端からの
   * スワイプも切る（スワイプは `onBack` を通らず、確認や行き先を飛ばすため）。
   */
  readonly onBack?: () => void;
  /**
   * 戻るボタンの形。`close`（×）は、戻るのではなく「今の流れを閉じる」画面
   * （チャレンジ・トレーニング・訓練の盤面・モーダル）に使う
   */
  readonly backIcon?: "chevron" | "close";
  readonly children: ReactNode;
  readonly contentStyle?: StyleProp<ViewStyle>;
  /**
   * スクロールしても上端に追従させる子の位置（`ScrollView` の同名 prop）。
   * 数えるのは `children` に直接並べた要素
   *
   * 渡した画面はヘッダーを透けさせず、白地の帯にする。透けるヘッダーの下に
   * 本文を潜らせる自動の inset を、RN の追従する子は知らず、ヘッダーの裏に
   * 貼り付いて隠れるため。
   *
   * 渡した画面は、タブの入口でも大きな見出し（large title）を使わず、中央の
   * 小さな見出しにする。iOS 26 では透けないヘッダー（ナビゲーションバーが
   * translucent でない）に large title を載せると、スクロールで畳んだあと
   * 小さな見出しが描かれず、ヘッダーが空白になる（大きな見出しの要素は
   * バーの中に残るが見えない。iPhone 17 Pro / iOS 26.5 の Release ビルドで確認）。
   *
   * 採らなかった案:
   * - 透けないヘッダーの地の色を塗らない（`backgroundColor: "transparent"`。
   *   react-navigation が large title の既定にしている値）— 試したが空白は直らない。
   *   地の色ではなく、透けないバーと large title の組み合わせで起きる
   * - `transparent` を指定しない（react-navigation は large title のとき
   *   バーを translucent にする）— 本文がバーの下に潜り、追従する子が
   *   ヘッダーの裏に貼り付く。上の決まりに反する
   */
  readonly stickyHeaderIndices?: readonly number[];
  /** 本文の `ScrollView`。呼び出し側が先頭へ戻すとき等に使う */
  readonly ref?: Ref<ScrollViewInstance>;
}

/** ここで使う navigation の形（expo-router の `useNavigation` の戻り値の一部） */
interface ScreenNavigation {
  getState(): NavigatorStateLike | undefined;
  getParent(): ScreenNavigation | undefined;
}

interface NavigatorStateLike {
  readonly type?: string;
  readonly index: number;
  readonly routes: readonly {
    readonly key: string;
    readonly name: string;
    readonly state?: { readonly routes: readonly { readonly key: string }[] };
  }[];
}

/** 画面がスタックのどこにいるか（ヘッダー左の出し方を決める） */
interface ScreenPlacement {
  /** 同じスタックに下の画面がある（OS の戻るで戻れる） */
  readonly hasBelow: boolean;
  /** タブの入口（タブごとのスタックの先頭） */
  readonly isTabEntry: boolean;
  /** モーダルのグループ（`(session)` 等）の中のスタックの先頭 */
  readonly isModalGroupHead: boolean;
}

/**
 * 画面の位置を navigation の状態から読む
 *
 * タブの入口かどうかは今の URL（`useSegments`）ではなく、この画面の親が
 * タブの navigator かで決める。URL は表に出ている画面のものなので、タブの上に
 * 詳細を積んだ間、裏のタブの画面まで「タブの外」と読んで見出しを描き直し、
 * 戻る途中で見出しが跳ねる。
 */
function usePlacement(): ScreenPlacement {
  const navigation = useNavigation<ScreenNavigation>();
  const route = useRoute();
  const state = navigation.getState();
  const position = state?.routes.findIndex((r) => r.key === route.key) ?? -1;
  const parentState = navigation.getParent()?.getState();
  const isTabEntry = parentState?.type === "tab";
  // 親（ルートのスタック）でこの navigator を持つ画面。入れ子の状態がまだ
  // 親に載っていない最初の描画では、親の今の画面とみなす
  const groupRoute =
    parentState?.routes.find(
      (r) => r.state?.routes.some((child) => child.key === route.key) === true,
    ) ?? parentState?.routes[parentState.index];
  return {
    hasBelow: position > 0,
    isTabEntry,
    isModalGroupHead:
      position <= 0 &&
      groupRoute !== undefined &&
      MODAL_ROUTE_NAMES.has(groupRoute.name),
  };
}

/** ヘッダー左に出すもの */
type LeftButton =
  | { readonly kind: "none" }
  | { readonly kind: "os" }
  | { readonly kind: "back" | "close"; readonly onPress: () => void };

/**
 * 画面の枠
 * コンテンツ枠
 *
 * 見出し・戻る・右の操作は OS のヘッダー（ネイティブスタックのヘッダー）に
 * 載せ、本文は白地でスクロールする。全画面で使い、余白と地の色をそろえる。
 * iOS ではヘッダーが透け（iOS 26 以降は Liquid Glass）、本文はその下へ潜る。
 * 本文の `ScrollView` を画面の直下に置き（間に view を挟まない）、
 * `contentInsetAdjustmentBehavior="automatic"` で OS にヘッダー・タブバー・
 * 下端の safe area のぶんの inset を付けさせる（手で足すと大きな見出しが
 * スクロールで畳まれず、タブバーもスクロールで縮まない）。Android はヘッダーを
 * 透けさせず（本文を潜らせる inset が付かない）、タブの外の画面だけ下端の
 * safe area を足す（タブの中は NativeTabs が受け持つ）。
 *
 * props は自前のヘッダーを持っていた頃と同じ形を保つ（呼び出しが多く、
 * 画面ごとに `Stack.*` を書くと余白・戻り先・testID の決まりが散るため）。
 * ヘッダー左は次のとおり:
 *
 * | 渡し方 | ヘッダー左 |
 * | --- | --- |
 * | `back` 無し | 何も出さない（OS の戻るも隠す） |
 * | `back`、`onBack` 無し、同じスタックに下の画面がある | OS 標準の戻る（スワイプ・長押しで履歴） |
 * | `back`、`onBack` 無し、下の画面が無い、モーダルのグループの先頭 | ×（`screen-close`）→ モーダルを閉じる（`useCloseModal`） |
 * | `back`、`onBack` 無し、下の画面が無い、それ以外 | `<`（`screen-back`）→ 入口へ置き換える |
 * | `back` + `onBack`（`backIcon` が chevron） | `<`（`screen-back`）→ `onBack`。スワイプを切る |
 * | `backIcon="close"` | ×（`screen-close`）→ `onBack`、無ければモーダルを閉じる |
 *
 * 下の画面が無いのはディープリンクや再起動で直接開いたとき。入口は
 * {@link backFallbackHref}（レッスンならレッスンの目次）。
 */
export function Screen({
  title,
  titleAction,
  back = false,
  onBack,
  backIcon = "chevron",
  children,
  contentStyle,
  stickyHeaderIndices,
  ref,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const closeModal = useCloseModal();
  const t = useTranslations("nav");
  const { hasBelow, isTabEntry, isModalGroupHead } = usePlacement();

  const hasHeader = title !== undefined;
  const opaqueHeader = stickyHeaderIndices !== undefined;
  const transparentHeader = hasHeader && !opaqueHeader && Platform.OS === "ios";
  // 透けないヘッダーには大きな見出しを載せない（stickyHeaderIndices の TSDoc）
  const largeTitle = isTabEntry && !opaqueHeader;

  // 子孫が「ここを見せて」と頼めるよう、本文の枠を手元でも持つ
  const scrollRef = useRef<ScrollViewInstance>(null);
  const viewportHeight = useRef(0);
  const scrollY = useRef<number | undefined>(undefined);
  // 透けるヘッダーの下に潜る高さ。iOS の自動の inset と同じ量（ヘッダーの
  // 高さ・下端の safe area）を、見せたい要素の位置合わせに使う
  const headerHeight = use(HeaderHeightContext) ?? 0;
  const scrollInsets = useRef<ScrollInsets>({ top: 0, bottom: 0 });
  const insetTop =
    Platform.OS !== "ios"
      ? 0
      : transparentHeader
        ? headerHeight
        : hasHeader
          ? 0
          : insets.top;
  const insetBottom = Platform.OS === "ios" ? insets.bottom : 0;
  useLayoutEffect(() => {
    scrollInsets.current = { top: insetTop, bottom: insetBottom };
  }, [insetTop, insetBottom]);
  const setScrollRef = useCallback(
    (node: ScrollViewInstance | null) => {
      scrollRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref != null) ref.current = node;
    },
    [ref],
  );

  // ヘッダー左。押したときの関数は ref で持ち、ヘッダーの要素は形が
  // 変わったときだけ作り直す（呼び出し側の再描画のたびにヘッダーを描き直さない）
  const fallback = backFallbackHref(pathname);
  const left = resolveLeftButton({
    back,
    backIcon,
    onBack,
    hasBelow,
    isModalGroupHead,
    closeModal: () => closeModal(fallback),
    replaceWithFallback: () => router.replace(fallback),
  });
  const leftPress = useRef<() => void>(noop);
  const leftOnPress =
    left.kind === "back" || left.kind === "close" ? left.onPress : noop;
  useLayoutEffect(() => {
    leftPress.current = leftOnPress;
  });
  const leftKind = left.kind;
  const leftLabel = leftKind === "close" ? t("close") : t("back");
  const leftElement = useMemo(
    () =>
      leftKind === "back" || leftKind === "close" ? (
        <HeaderButton
          action={{
            label: leftLabel,
            testID: leftKind === "close" ? "screen-close" : "screen-back",
            icon: leftKind === "close" ? "close" : "chevronLeft",
            onPress: () => leftPress.current(),
          }}
        />
      ) : undefined,
    [leftKind, leftLabel],
  );

  // ヘッダー右（`HeaderIconButton` が登録する）
  const [actions, setActions] = useState<ReadonlyMap<string, HeaderAction>>(
    () => new Map(),
  );
  const registry = useMemo<HeaderActionRegistry>(
    () => ({
      set: (id, action) => setActions((prev) => new Map(prev).set(id, action)),
      remove: (id) =>
        setActions((prev) => {
          if (!prev.has(id)) return prev;
          const next = new Map(prev);
          next.delete(id);
          return next;
        }),
    }),
    [],
  );
  const rightElements = useMemo(
    () =>
      [...actions].map(([id, action]) => (
        <Stack.Toolbar.View key={id}>
          <HeaderButton action={action} />
        </Stack.Toolbar.View>
      )),
    [actions],
  );

  // スワイプで戻ると onBack（確認・行き先の固定）を通らないので切る
  const blocksSwipe = back && onBack !== undefined;

  return (
    <>
      {blocksSwipe && <Stack.Screen options={NO_SWIPE_OPTIONS} />}
      {hasHeader ? (
        <>
          <Stack.Title
            large={largeTitle}
            style={HEADER_TITLE_STYLE}
            largeStyle={HEADER_LARGE_TITLE_STYLE}
          >
            {title}
          </Stack.Title>
          {transparentHeader ? (
            <Stack.Header transparent />
          ) : (
            <Stack.Header transparent={false} style={OPAQUE_HEADER_STYLE} />
          )}
          <Stack.Screen.BackButton
            hidden={leftKind !== "os"}
            displayMode="minimal"
            withMenu
          />
          {leftElement !== undefined && (
            <Stack.Toolbar placement="left">
              <Stack.Toolbar.View>{leftElement}</Stack.Toolbar.View>
            </Stack.Toolbar>
          )}
          {rightElements.length > 0 && (
            <Stack.Toolbar placement="right">{rightElements}</Stack.Toolbar>
          )}
        </>
      ) : (
        <Stack.Header hidden />
      )}
      <HeaderActionContext value={registry}>
        <ScrollIntoViewProvider
          scrollRef={scrollRef}
          viewportHeight={viewportHeight}
          scrollY={scrollY}
          insets={scrollInsets}
        >
          <ScrollView
            ref={setScrollRef}
            onLayout={(e) => {
              viewportHeight.current = e.nativeEvent.layout.height;
            }}
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            style={styles.body}
            contentInsetAdjustmentBehavior="automatic"
            contentContainerStyle={[
              styles.content,
              {
                paddingTop:
                  SCREEN_CONTENT_PADDING_TOP +
                  (Platform.OS !== "ios" && !hasHeader ? insets.top : 0),
                paddingBottom:
                  CONTENT_PADDING_BOTTOM +
                  (Platform.OS !== "ios" && !isTabEntry ? insets.bottom : 0),
              },
              contentStyle,
            ]}
            keyboardShouldPersistTaps="handled"
            // 入力欄（ログイン・登録等）がキーボードに隠れないよう、iOS で
            // キーボードの高さぶん本文の下を空けてスクロールできるようにする
            automaticallyAdjustKeyboardInsets
            stickyHeaderIndices={
              stickyHeaderIndices === undefined
                ? undefined
                : [...stickyHeaderIndices]
            }
          >
            {children}
            {titleAction !== undefined && (
              // 右の操作の中身（シート等）。大きさ 0 で本文の最後に置く
              // （絶対配置なので gap にも `stickyHeaderIndices` の数え方にも入らない）
              <View style={styles.titleActionHost} collapsable={false}>
                {titleAction}
              </View>
            )}
          </ScrollView>
        </ScrollIntoViewProvider>
      </HeaderActionContext>
    </>
  );
}

/**
 * ヘッダー左の出し方を決める（{@link Screen} の表）
 */
function resolveLeftButton({
  back,
  backIcon,
  onBack,
  hasBelow,
  isModalGroupHead,
  closeModal,
  replaceWithFallback,
}: {
  readonly back: boolean;
  readonly backIcon: "chevron" | "close";
  readonly onBack: (() => void) | undefined;
  readonly hasBelow: boolean;
  readonly isModalGroupHead: boolean;
  readonly closeModal: () => void;
  readonly replaceWithFallback: () => void;
}): LeftButton {
  if (!back) return { kind: "none" };
  if (backIcon === "close") {
    return { kind: "close", onPress: onBack ?? closeModal };
  }
  if (onBack !== undefined) return { kind: "back", onPress: onBack };
  if (hasBelow) return { kind: "os" };
  if (isModalGroupHead) return { kind: "close", onPress: closeModal };
  return { kind: "back", onPress: replaceWithFallback };
}

function noop() {}

const NO_SWIPE_OPTIONS = { gestureEnabled: false } as const;

const OPAQUE_HEADER_STYLE = { backgroundColor: colors.card } as const;

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: colors.card,
  },
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
  titleActionHost: {
    position: "absolute",
    width: 0,
    height: 0,
  },
});
