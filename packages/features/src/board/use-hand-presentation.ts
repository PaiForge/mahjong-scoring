import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { PlanBenefit } from "../billing/plans";
import type { DisplaySettingsHydrationStatus } from "../settings/use-display-settings-store";
import type { TileOrderMode } from "../settings/tile-order";
import type { TileOrientationMode } from "../settings/tile-orientation";
import type { SplitTehai } from "./agari-hai";
import {
  buildHandPresentation,
  DEFAULT_HAND_PRESENTATION_SETTINGS,
  resolveHandPresentationSettings,
  type HandPresentation,
  type HandPresentationSettings,
  type HandPresentationSnapshot,
} from "./hand-presentation";

/**
 * 見せ方を決めるまでに待つ上限（ms）
 *
 * 設定の復元・認証・特典の取得を合わせた期限で、準備を始めた最初のクライアントの
 * effect から数える。状態が変わっても延ばさない。ネットワークの速さの保証では
 * なく、練習を始めるまでに待たせてよい時間の製品上の上限。
 */
export const HAND_PRESENTATION_DEADLINE_MS = 3000;

/**
 * 準備に渡す認証の状態
 * 手牌表示用認証状態
 *
 * アプリの `unavailable`（接続先の無いビルド）は `signedOut` に寄せて渡す。
 * ユーザー ID が無いことだけで未ログインと決めない — 読み込み中は `loading`。
 */
export type HandPresentationAuth =
  | { readonly kind: "loading" }
  | { readonly kind: "signedOut" }
  | { readonly kind: "signedIn"; readonly userId: string };

/** 特典の取得結果。取得できなかった理由は区別しない */
export type HandPresentationBenefitsResult =
  | { readonly ok: true; readonly benefits: readonly PlanBenefit[] }
  | { readonly ok: false };

/**
 * そのユーザーの特典を読む関数
 *
 * 呼び出し側で参照を安定させる（モジュールの関数かメモ化した関数）。
 * reject しても準備側が受け止めて取得不能として扱う。
 */
export type HandPresentationBenefitsFetcher = (
  userId: string,
) => Promise<HandPresentationBenefitsResult>;

/** 準備の入力 */
export interface HandPresentationInputs {
  /**
   * Pro の見せ方（上下ランダム・理牌しない）を扱うプラットフォームか
   *
   * false（Android）なら設定も認証も待たずに既定（`upright` + `sorted`）で確定する。
   */
  readonly supported: boolean;
  /**
   * 表示設定の復元状態
   *
   * web はクライアントの準備（ハイドレーション）が済むまで `pending` を渡す。
   * サーバー描画とハイドレーション中の一時的な既定値を保存値と取り違えないため。
   */
  readonly settingsStatus: DisplaySettingsHydrationStatus;
  /** 保存した向きの希望（復元済みのときだけ意味を持つ） */
  readonly savedOrientation: TileOrientationMode;
  /**
   * 保存した並べ方の希望（復元済みのときだけ意味を持つ）
   *
   * 向きとまとめたオブジェクトにしない — effect の依存を参照の変わらない
   * プリミティブに保つため。
   */
  readonly savedOrder: TileOrderMode;
  readonly auth: HandPresentationAuth;
  readonly fetchBenefits: HandPresentationBenefitsFetcher;
}

/**
 * 既定の見せ方に落とした理由
 *
 * 落とすときは向きも並べ方も既定（`upright` + `sorted`）にし、案内は 1 つだけ出す。
 * どちらも同じ特典で決まるので、片方だけ確かめられる状況は無い。
 *
 * - `settingsFailed` — 表示設定を読めなかった（希望は不明）
 * - `settingsTimeout` — 表示設定の読み込みが期限までに終わらなかった（希望は不明）
 * - `authTimeout` — Pro の見せ方を希望しているが、ログイン状態が期限までに分からなかった
 * - `benefitsUnavailable` — Pro の見せ方を希望しているが、特典を読めなかった
 * - `benefitsTimeout` — Pro の見せ方を希望しているが、特典の取得が期限までに終わらなかった
 */
export type HandPresentationFallbackReason =
  | "settingsFailed"
  | "settingsTimeout"
  | "authTimeout"
  | "benefitsUnavailable"
  | "benefitsTimeout";

/** 準備の状態 */
export type HandPresentationPreparation =
  | { readonly status: "pending" }
  | {
      readonly status: "ready";
      readonly snapshot: HandPresentationSnapshot;
      /** 確かめられずに既定へ落としたときだけ持つ。案内を出す */
      readonly fallbackReason: HandPresentationFallbackReason | undefined;
    };

/**
 * 実行環境で共通の種
 *
 * 初めて見せ方を確定するクライアントの effect で 1 度だけ採り、以後は同じ値を
 * 使う。web ではドキュメント、アプリでは JS ランタイムの間だけ生き、再読み込み・
 * 再起動で作り直す。Provider のアンマウントでは消さない（同じ環境で練習を
 * 開き直しても同じ手は同じ配置になる）。サーバーでは effect が走らないので
 * 採らず、利用者をまたぐ乱数の状態を持たない。未初期化は undefined（0 も有効な種）。
 */
let runtimeSeed: number | undefined;

/** 実行環境の種を返す。未初期化なら採る（effect の中からだけ呼ぶ） */
function obtainRuntimeSeed(): number {
  // 暗号の用途ではないので Math.random で足りる
  runtimeSeed ??= Math.floor(Math.random() * 0x100000000) >>> 0;
  return runtimeSeed;
}

/**
 * Pro の見せ方を 1 つでも希望しているか
 *
 * 希望していれば認証と特典を待ち、していなければ待たずに既定で確定する。
 */
function wantsProPresentation(
  orientation: TileOrientationMode,
  order: TileOrderMode,
): boolean {
  return orientation === "random" || order === "unsorted";
}

/** 期限が来たときに、待っていた段階から既定へ落とす理由を決める */
function reasonAtDeadline(
  inputs: HandPresentationInputs,
): HandPresentationFallbackReason | undefined {
  if (inputs.settingsStatus === "pending") return "settingsTimeout";
  if (inputs.settingsStatus === "failed") return "settingsFailed";
  if (!wantsProPresentation(inputs.savedOrientation, inputs.savedOrder)) {
    return undefined;
  }
  if (inputs.auth.kind === "loading") return "authTimeout";
  if (inputs.auth.kind === "signedOut") return undefined;
  return "benefitsTimeout";
}

/**
 * 練習の画面の手牌の見せ方を準備する
 * 手牌表示準備
 *
 * 見せ方は Provider がマウントされている間だけ固定する。確定した後の購入・失効・
 * ログインの切り替え・設定の変更・特典の読み直しでは変えず、次の問題でも
 * 決め直さない。決め直すのは Provider がマウントし直されたときだけ。iOS で
 * プラン画面を積んで戻る・アプリが前面へ戻る・画面にフォーカスが戻るだけでは
 * マウントし直されないので、元の見せ方のまま続く（変更は練習を開き直すと
 * 反映される）。
 *
 * 決める順:
 *
 * 1. 対象外のプラットフォームは待たずに既定（`upright` + `sorted`）
 * 2. 設定の復元を待つ。失敗したら既定（案内あり）
 * 3. 向きも並べ方も既定を希望していれば、認証も特典も待たずに確定
 * 4. Pro の見せ方（`random` か `unsorted`）を希望していればログイン状態を待つ。
 *    未ログインは既定
 * 5. ログイン中ならそのユーザーの特典を 1 度だけ読み、`practice_tools` があれば希望どおり
 * 6. 読めない・reject・期限切れは向きも並べ方も既定（案内あり）
 *
 * 特典は回数制限（quota）の応答とは別に、この開始時点の読み取りで決める。
 * 回答時間の表示（ゲートの特典に追随）と食い違う回があることは許容する。
 * 読み取りに失敗しても、購入・回数制限・設定画面の特典の判定には触れない。
 *
 * 期限は入力が変わっても延ばさない。タイマーが遅れて走った場合（バックグラウンド等）
 * にも期限の後の応答を採らないよう、応答を受け取った時点でも期限を確かめる。
 * 遅れて届いた成功で、既定へ落とした見せ方と案内を取り消さない — 練習の途中で
 * 盤面の見え方が変わるため。
 *
 * 準備中にユーザーか希望（向き・並べ方）が変わったら古い要求の応答を捨てて
 * 読み直す。ID の一致だけでなく effect の世代でも見分けるため、A → B → A と
 * 戻っても最初の A の応答は採らない。希望が変わったときに古い保存値で確定しない
 * よう、effect の依存には希望の有無ではなく向きと並べ方の保存値をそれぞれ置く。
 *
 * @param inputs 設定・認証・特典の取得の具体（各アプリの Provider が渡す）
 */
export function useHandPresentationPreparation(
  inputs: HandPresentationInputs,
): HandPresentationPreparation {
  const [preparation, setPreparation] = useState<HandPresentationPreparation>({
    status: "pending",
  });
  const decided = preparation.status === "ready";
  const decidedRef = useRef(false);
  const deadlineRef = useRef<number | undefined>(undefined);
  const latestInputsRef = useRef(inputs);
  const requestGenerationRef = useRef(0);

  const {
    supported,
    settingsStatus,
    savedOrientation,
    savedOrder,
    auth,
    fetchBenefits,
  } = inputs;
  const authKind = auth.kind;
  const userId = auth.kind === "signedIn" ? auth.userId : undefined;

  useEffect(() => {
    latestInputsRef.current = inputs;
  });

  // 期限は最初のクライアントの effect から数える（StrictMode で effect が
  // やり直されても、ref は残るので延びない）
  useEffect(() => {
    deadlineRef.current ??= Date.now() + HAND_PRESENTATION_DEADLINE_MS;
  }, []);

  const isExpired = () =>
    deadlineRef.current !== undefined && Date.now() >= deadlineRef.current;

  const decide = (
    settings: HandPresentationSettings,
    fallbackReason: HandPresentationFallbackReason | undefined,
  ) => {
    if (decidedRef.current) return;
    decidedRef.current = true;
    setPreparation({
      status: "ready",
      snapshot: {
        orientation: settings.orientation,
        order: settings.order,
        sessionSeed: obtainRuntimeSeed(),
      },
      fallbackReason,
    });
  };

  // 期限のタイマー。確定したら止める
  useEffect(() => {
    if (decided) return;
    const deadline = deadlineRef.current ?? Date.now();
    const timer = setTimeout(
      () => {
        decide(
          DEFAULT_HAND_PRESENTATION_SETTINGS,
          reasonAtDeadline(latestInputsRef.current),
        );
      },
      Math.max(0, deadline - Date.now()),
    );
    return () => clearTimeout(timer);
    // decide は ref だけを触るので依存に入れない
  }, [decided]);

  useEffect(() => {
    if (decidedRef.current) return;
    if (isExpired()) {
      decide(
        DEFAULT_HAND_PRESENTATION_SETTINGS,
        reasonAtDeadline(latestInputsRef.current),
      );
      return;
    }
    if (!supported) {
      decide(DEFAULT_HAND_PRESENTATION_SETTINGS, undefined);
      return;
    }
    if (settingsStatus === "pending") return;
    if (settingsStatus === "failed") {
      decide(DEFAULT_HAND_PRESENTATION_SETTINGS, "settingsFailed");
      return;
    }
    if (!wantsProPresentation(savedOrientation, savedOrder)) {
      decide(DEFAULT_HAND_PRESENTATION_SETTINGS, undefined);
      return;
    }
    if (authKind === "loading") return;
    if (userId === undefined) {
      decide(DEFAULT_HAND_PRESENTATION_SETTINGS, undefined);
      return;
    }

    const generation = ++requestGenerationRef.current;
    let active = true;
    const isCurrent = () =>
      active && generation === requestGenerationRef.current;
    const settle = (result: HandPresentationBenefitsResult) => {
      if (!isCurrent()) return;
      if (isExpired()) {
        decide(DEFAULT_HAND_PRESENTATION_SETTINGS, "benefitsTimeout");
        return;
      }
      if (!result.ok) {
        decide(DEFAULT_HAND_PRESENTATION_SETTINGS, "benefitsUnavailable");
        return;
      }
      decide(
        resolveHandPresentationSettings(
          { orientation: savedOrientation, order: savedOrder },
          result.benefits,
        ),
        undefined,
      );
    };
    let request: Promise<HandPresentationBenefitsResult>;
    try {
      request = fetchBenefits(userId);
    } catch {
      request = Promise.resolve({ ok: false });
    }
    request.then(settle, () => settle({ ok: false }));
    return () => {
      active = false;
    };
    // decide / isExpired は ref だけを触るので依存に入れない。auth は
    // オブジェクトの参照ではなく種類とユーザー ID で見る
  }, [
    supported,
    settingsStatus,
    savedOrientation,
    savedOrder,
    authKind,
    userId,
    fetchBenefits,
  ]);

  return preparation;
}

/**
 * 盤面へ流す見せ方
 * 手牌表示コンテキスト値
 *
 * - `off` — 見せ方を変えない（既定。Provider の外・説明用の見本）
 * - `on` — 確定した見せ方で描く
 *
 * 準備中（pending）は流さない — 準備中は盤面そのものをマウントしない。
 */
export type HandPresentationContextValue =
  | { readonly kind: "off" }
  | ({ readonly kind: "on" } & HandPresentationSnapshot);

/** 見せ方を変えない値 */
export const HAND_PRESENTATION_OFF: HandPresentationContextValue = {
  kind: "off",
};

/**
 * 盤面へ見せ方を流すコンテキスト
 * 手牌表示コンテキスト
 *
 * 練習の Provider が `on` を流す。練習の木の中に説明用の見本の盤面があれば、
 * そこだけ {@link HAND_PRESENTATION_OFF} で遮る（見本を random にしない）。
 */
export const HandPresentationContext =
  createContext<HandPresentationContextValue>(HAND_PRESENTATION_OFF);

/**
 * 見せ方を確かめられずに既定へ落としたことを、画面へ知らせるコンテキスト
 * 手牌表示案内コンテキスト
 *
 * 練習の Provider が、確定した理由（{@link HandPresentationFallbackReason}）が
 * あるときだけ true を流す。同じ Provider の間は同じ値で、次の問題ごとに
 * 知らせ直さない。各アプリのシェルが盤面の外に補足として出す（盤面の寸法は
 * 変えない）— web は見出しの直下、モバイルは盤面の下（盤面をヘッダーの直下に
 * 付ける配置を崩さないため）。確認のボタン・自動の再試行・練習のやり直しは持たない。
 */
export const HandPresentationNoticeContext = createContext(false);

/**
 * 既定へ落とした案内を出すかを引くフック
 * 手牌表示案内フック
 */
export function useHandPresentationNotice(): boolean {
  return useContext(HandPresentationNoticeContext);
}

/**
 * 確定した見せ方をコンテキストの値にする
 * 手牌表示コンテキスト値生成
 *
 * @param snapshot 確定した見せ方
 */
export function toHandPresentationContextValue(
  snapshot: HandPresentationSnapshot,
): HandPresentationContextValue {
  return { kind: "on", ...snapshot };
}

/**
 * 盤面の手牌の見せ方を引くフック
 * 手牌表示フック
 *
 * 盤面（`TehaiDisplay`）だけが呼ぶ。コンテキストが `off` なら undefined
 * （従来の表示）。
 *
 * @param split 元の手牌から和了牌を切り離したもの（`splitAgariHai` の結果）
 */
export function useHandPresentation(
  split: SplitTehai,
): HandPresentation | undefined {
  const context = useContext(HandPresentationContext);
  const orientation = context.kind === "on" ? context.orientation : undefined;
  const order = context.kind === "on" ? context.order : undefined;
  const sessionSeed = context.kind === "on" ? context.sessionSeed : undefined;
  return useMemo(
    () =>
      orientation === undefined ||
      order === undefined ||
      sessionSeed === undefined
        ? undefined
        : buildHandPresentation(split, { orientation, order, sessionSeed }),
    [split, orientation, order, sessionSeed],
  );
}
