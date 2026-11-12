import {
  use,
  useImperativeHandle,
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
  Text,
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
  HEADER_TAB_TITLE_STYLE,
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
   * タブの入口ではヘッダーの行の左端に一回り大きく出し、それ以外は中央の
   * 小さな見出し（出し分けの理由は {@link Screen}「見出しの位置」）。
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
   */
  readonly stickyHeaderIndices?: readonly number[];
  /** 本文を先頭へ戻す操作（{@link ScreenHandle}） */
  readonly ref?: Ref<ScreenHandle>;
}

/**
 * 画面の外から本文を動かす操作
 *
 * 本文の `ScrollView` そのものは渡さない。先頭の位置は `Screen` が決めた
 * ヘッダーの出し方で変わり（透けるヘッダーの下に潜る画面では 0 ではなく
 * `-上の inset`）、呼び出し側が `scrollTo({ y: 0 })` と書くと 1 行目が
 * ヘッダーの裏で止まるため。
 */
export interface ScreenHandle {
  /**
   * 本文を先頭へ戻す（動きは付けない）。盤面が表示を切り替えたとき
   * （回答・答え合わせ・次の問題）や、同じ画面のまま中身を差し替えたときに呼ぶ
   */
  scrollToTop(): void;
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
 *
 * 見出しの位置:
 *
 * タブの入口（ヘッダー左に何も出さない画面）は、見出しをヘッダーの行の左端に
 * 一回り大きく（{@link HEADER_TAB_TITLE_STYLE}）出す。奥の画面は中央の小さな
 * 見出し。「左寄せ = タブの入口、中央 = 奥の画面」で階層を見分けさせる。
 * 国内で見慣れた形（LINE のタブの見出し）に寄せたもので、見出しと右の操作が
 * 同じ行に並ぶので、右にボタンを足しても段が増えない。
 *
 * iOS のナビゲーションバーは見出しを左に寄せられないので、OS の見出しを空にし、
 * ヘッダー左の要素（`Stack.Toolbar placement="left"`）に文字を置く。iOS 26 以降は
 * ヘッダーの要素に OS がガラスの面を付けるので、`hidesSharedBackground` で消す
 * （見出しはボタンではない）。Android のヘッダーはもともと左寄せなので、OS の
 * 見出しの文字の大きさだけを変える。
 *
 * 却下: iOS の large title（ヘッダーの下の段に 34pt。スクロールで畳まれる）—
 * 以前はこれだった。見出しが本文より目立ち、右のボタンが見出しと別の段に浮く。
 * 透けないヘッダー（`stickyHeaderIndices` を渡した画面）と組み合わせると iOS 26 で
 * 畳んだあとヘッダーが空白になり、点数表だけ中央の小さな見出しにしていた。
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

  // 子孫が「ここを見せて」と頼めるよう、本文の枠を手元でも持つ
  const scrollRef = useRef<ScrollViewInstance>(null);
  const viewportHeight = useRef(0);
  const contentHeight = useRef(0);
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
  useImperativeHandle(
    ref,
    () => ({
      scrollToTop: () => {
        scrollRef.current?.scrollTo({
          y: -scrollInsets.current.top,
          animated: false,
        });
      },
    }),
    [],
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
  // タブの入口の見出し（Screen の TSDoc「見出しの位置」）。iOS はヘッダー左の
  // 要素として描き、OS の見出しは空のままにする
  const tabTitle = isTabEntry && leftKind === "none";
  const tabTitleInToolbar = tabTitle && Platform.OS === "ios";
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
            style={tabTitle ? HEADER_TAB_TITLE_STYLE : HEADER_TITLE_STYLE}
          >
            {tabTitleInToolbar ? "" : title}
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
          {tabTitleInToolbar && (
            <Stack.Toolbar placement="left">
              <Stack.Toolbar.View hidesSharedBackground>
                <Text
                  accessibilityRole="header"
                  numberOfLines={1}
                  // OS のヘッダーの見出しは文字サイズの設定に追従しない
                  allowFontScaling={false}
                  style={styles.tabTitle}
                >
                  {title}
                </Text>
              </Stack.Toolbar.View>
            </Stack.Toolbar>
          )}
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
          contentHeight={contentHeight}
          scrollY={scrollY}
          insets={scrollInsets}
        >
          <ScrollView
            ref={scrollRef}
            onLayout={(e) => {
              viewportHeight.current = e.nativeEvent.layout.height;
            }}
            onScroll={(e) => {
              scrollY.current = e.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
            onContentSizeChange={(_width, height) => {
              contentHeight.current = height;
            }}
            style={styles.body}
            contentInsetAdjustmentBehavior="automatic"
            // iOS の `scrollTo` は、行き先を「手で渡した contentInset」の範囲に
            // 丸める。OS が自動で足した inset（上の行）はその範囲に入らないので、
            // 丸めたままだと先頭（`-上の inset`）へ送っても 0 で止まり、本文の頭が
            // 透けるヘッダーの裏に潜る（RN 0.88 の `RCTScrollViewComponentView` の
            // `scrollTo:y:animated:`）。丸めを切り、範囲は送る側で守る —
            // 先頭は `scrollToTop`、下端は `ScrollIntoViewProvider` の `contentHeight`
            scrollToOverflowEnabled
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
  tabTitle: {
    ...HEADER_TAB_TITLE_STYLE,
    // OS はヘッダーの要素を画面の端から 20pt に置く。本文の左端（16pt。
    // `content` の paddingHorizontal）に揃える
    marginLeft: -4,
  },
  titleActionHost: {
    position: "absolute",
    width: 0,
    height: 0,
  },
});
