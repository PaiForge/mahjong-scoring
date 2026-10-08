/**
 * 回答 1 回の処理時間の記録
 * 回答計測
 *
 * チャレンジの答え合わせはサーバーで行うため、押してから正誤が返るまでの
 * 時間がそのまま体験に響く。どの段階に時間が掛かっているかを本番で知る
 * ために、回答ごとに 1 行の構造化ログ（JSON）を出す。
 *
 * 出す先は Vercel の関数ログ（`console.info`）。Sentry も Vercel の
 * Custom Metrics（Observability Plus）もこのアプリには入っていないため、
 * 依存も契約も足さずに届く先がこれしかない。集計は `vercel logs --json` を
 * `jq` 等で畳む（CLI は 24 時間分しか遡れない）。恒常的に p95 を追うなら
 * {@link logAnswerTiming} の中身をメトリクスの送信へ差し替える —
 * 出口はこの関数 1 つに限り、計測する側（Action・採点）は変えない。
 *
 * 1 行に入れるのはメニュー・問題番号・結果と各段階の所要時間だけ。
 * ユーザー ID・挑戦 ID・回答内容は入れない（ログに個人の記録を残さない。
 * 1 件を追うなら Vercel のリクエスト ID で足りる）。
 */

/**
 * 回答処理の段階
 * 回答段階
 *
 * - `auth` — 認証サーバーへの本人確認（`getUser()`）
 * - `ban` — BAN 判定の `profiles` 参照
 * - `lock` — 挑戦行のロック付き読み取り（接続の確保・ロック待ちを含む）
 * - `grade` — 採点と次問の生成
 * - `update` — 挑戦行の UPDATE
 * - `commit` — トランザクションの確定（COMMIT の往復）
 *
 * サーバー時計の起点（`transitions.ts` の `answeredChallenge` の
 * `respondedAt`）は `update` の直前に取るので、`update` と `commit` は
 * 応答の猶予（`RESPONSE_GRACE_MS`）を食う側に入る。
 */
export type AnswerPhase =
  "auth" | "ban" | "lock" | "grade" | "update" | "commit";

/** 段階ごとの所要時間（ms、整数）。通らなかった段階は持たない */
export type AnswerPhaseTimings = Readonly<Partial<Record<AnswerPhase, number>>>;

/**
 * 段階ごとの所要時間を区切りながら測るストップウォッチ
 * 段階計測
 */
export interface PhaseStopwatch {
  /** 直前の区切りからの経過を `phase` の所要時間として記録し、区切りを今に進める */
  readonly lap: (phase: AnswerPhase) => void;
  /** これまでに記録した所要時間 */
  readonly phases: AnswerPhaseTimings;
  /** 計測開始からの合計（ms、整数） */
  readonly elapsed: () => number;
}

/**
 * ストップウォッチを作る
 * 段階計測生成
 *
 * @param now - 現在時刻（ms）。テストで差し替える以外は `performance.now()`
 */
export function createPhaseStopwatch(
  now: () => number = () => performance.now(),
): PhaseStopwatch {
  const startedAt = now();
  let last = startedAt;
  const phases: Partial<Record<AnswerPhase, number>> = {};
  return {
    lap(phase) {
      const at = now();
      phases[phase] = Math.round(at - last);
      last = at;
    },
    phases,
    elapsed: () => Math.round(now() - startedAt),
  };
}

/**
 * クライアントが回答に添える観測値
 * 回答観測値
 *
 * `previousRoundTripMs` は、直前の回答を押してから正誤が届くまでに画面側で
 * 測った時間。サーバーには見えない通信の往復（ブラウザ → 関数 → ブラウザ）を
 * 知る唯一の手がかり。申告値なので信用せず、**観測に使うだけで競技時間の
 * 補正には一切使わない**。別のリクエストに添えて送るのは、観測のためだけに
 * 往復を増やさないため（最初の回答には無い）。
 */
export interface AnswerObservation {
  readonly previousRoundTripMs?: number;
}

/** 申告された往復時間として受け付ける上限。これを超える値は欠損として扱う */
const MAX_ROUND_TRIP_MS = 10 * 60 * 1000;

/**
 * クライアントの観測値を読む。形が違えば欠損として扱い、拒否はしない
 * 回答観測値解釈
 */
export function parseAnswerObservation(value: unknown): AnswerObservation {
  if (typeof value !== "object" || value === null) return {};
  const raw: unknown = Reflect.get(value, "previousRoundTripMs");
  return typeof raw === "number" &&
    Number.isInteger(raw) &&
    raw >= 0 &&
    raw <= MAX_ROUND_TRIP_MS
    ? { previousRoundTripMs: raw }
    : {};
}

/**
 * 回答がどう扱われたか
 * 回答結果種別
 *
 * - `answered` — 採点して次問を返した
 * - `expired` — 制限時間を過ぎていた
 * - `rejected` — 受け付けなかった（古い問題番号・早押し・停止中・他人の行など）
 * - `unauthorized` — 本人確認を通らなかった
 */
export type AnswerHandling =
  "answered" | "expired" | "rejected" | "unauthorized";

/** 1 回の回答の計測結果 */
export interface AnswerTiming {
  readonly handling: AnswerHandling;
  /** 採点したメニュー。採点に至らなかったときは不明 */
  readonly menuType?: string;
  /** 回答した問題番号（0 が最初の問題）。整数でなければ不明 */
  readonly sequence?: number;
  readonly phases: AnswerPhaseTimings;
  /** 受け取ってから応答を組み終えるまでの合計（ms） */
  readonly totalMs: number;
  readonly observation: AnswerObservation;
}

/**
 * 1 回の回答の計測結果をログに出す
 * 回答計測出力
 *
 * `afterRespondedMs` は `update` と `commit` の和で、サーバー時計の起点を
 * 決めた後に掛かった時間。固定の猶予 100ms に収まっているかをこれで見る。
 */
export function logAnswerTiming(timing: AnswerTiming): void {
  const { phases, observation } = timing;
  console.info(
    JSON.stringify({
      event: "challenge.answer",
      handling: timing.handling,
      menuType: timing.menuType,
      sequence: timing.sequence,
      first: timing.sequence === 0,
      totalMs: timing.totalMs,
      afterRespondedMs: (phases.update ?? 0) + (phases.commit ?? 0),
      ...phases,
      clientRoundTripMs: observation.previousRoundTripMs,
    }),
  );
}
