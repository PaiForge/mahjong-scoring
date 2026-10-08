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
 * `jq` 等で畳む（CLI は既定で直近 24 時間・100 件に絞るので、`--since` と
 * `--limit` を明示し、上限に当たったら時間窓を分ける）。恒常的に p95 を
 * 追うなら {@link logAnswerTiming} の中身をメトリクスの送信へ差し替える —
 * 出口はこの関数 1 つに限り、計測する側（Action・採点）は変えない。
 *
 * 1 行に入れるのはメニュー・問題番号・結果と各段階の所要時間だけ。
 * ユーザー ID・挑戦 ID・回答内容は入れない（ログに個人の記録を残さない。
 * 1 件を追うなら Vercel のリクエスト ID で足りる）。例外で落ちた回答も
 * 「失敗」として同じ形で残す（成功と通常の拒否だけの分布にすると、
 * 障害時の待ち時間と失敗率を過小に見積もる）。
 */

/**
 * 回答処理の段階（処理の順）
 * 回答段階
 *
 * - `auth` — 認証サーバーへの本人確認（`getUser()`）
 * - `ban` — BAN 判定の `profiles` 参照
 * - `lock` — 挑戦行のロック付き読み取り。入力の検証・接続の確保・BEGIN・
 *   SELECT・ロック待ちを含む
 * - `grade` — 採点と次問の生成
 * - `update` — 挑戦行の UPDATE
 * - `commit` — トランザクションの確定。応答の組み立て（正解を伏せた次問）と
 *   COMMIT の往復を含む
 *
 * 各値は「その段階の処理区間の経過時間」で、純粋な DB の往復時間ではない。
 * Fluid Compute では他のリクエストに実行を譲った時間も入る。認証 / BAN / DB の
 * どれが大きいかの一次判断には足りるが、`lock` が大きいというだけで DB 往復の
 * 統合を選ばず、そのときは接続・BEGIN と SELECT を分けて測り直す。
 *
 * サーバー時計の起点（`transitions.ts` の `answeredChallenge` の
 * `respondedAt`）は `update` の直前に取るので、`update` と `commit` は
 * 応答の猶予（`RESPONSE_GRACE_MS`）を食う側に入る。
 */
export const ANSWER_PHASES = [
  "auth",
  "ban",
  "lock",
  "grade",
  "update",
  "commit",
] as const;

export type AnswerPhase = (typeof ANSWER_PHASES)[number];

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
 * 処理が途中で落ちたとき、どの段階の中で落ちたか
 * 未完了段階
 *
 * 段階は {@link ANSWER_PHASES} の順に通るので、記録が無い最初の段階が
 * 落ちた場所。全段階を通っていれば undefined
 */
export function pendingPhase(
  phases: AnswerPhaseTimings,
): AnswerPhase | undefined {
  return ANSWER_PHASES.find((phase) => !(phase in phases));
}

/**
 * クライアントが回答に添える、直前の回答の観測値
 * 回答観測値
 *
 * `previous` は、直前の回答（問題番号 `sequence`）を押してから正誤が届く
 * までに画面側で測った時間。サーバーには見えない通信の往復
 * （ブラウザ → 関数 → ブラウザ）を知る唯一の手がかり。申告値なので信用せず、
 * **観測に使うだけで競技時間の補正には一切使わない**。
 *
 * 次の回答に添えて送るのは、観測のためだけに往復を増やさないため。そのため
 * ログに載るのは「次の回答に進めた回答」の往復だけで、最後の回答・途中で
 * やめた挑戦・通信に失敗した回答は標本に入らない（1 問で終えた挑戦の標本は
 * 0 件）。全員の待ち時間の p95 とは呼ばず、サーバーの回答件数と標本数を
 * 併記して読む。
 *
 * 同じ行に並ぶサーバーの段階時間は**今回の**回答のもので、`previous` とは
 * 別の問題。両者を引き算して通信時間を出すことはできず、別々の分布として
 * 扱う（前問のサーバー処理の行とは、挑戦 ID を載せない以上結合できない）。
 */
export interface AnswerObservation {
  readonly previous?: {
    readonly sequence: number;
    readonly roundTripMs: number;
  };
}

/** 申告された往復時間として受け付ける上限。これを超える値は欠損として扱う */
const MAX_ROUND_TRIP_MS = 10 * 60 * 1000;

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

/**
 * クライアントの観測値を読む。形が違えば欠損として扱い、拒否はしない
 * 回答観測値解釈
 */
export function parseAnswerObservation(value: unknown): AnswerObservation {
  if (typeof value !== "object" || value === null) return {};
  const previous: unknown = Reflect.get(value, "previous");
  if (typeof previous !== "object" || previous === null) return {};
  const sequence: unknown = Reflect.get(previous, "sequence");
  const roundTripMs: unknown = Reflect.get(previous, "roundTripMs");
  return isNonNegativeInteger(sequence) &&
    isNonNegativeInteger(roundTripMs) &&
    roundTripMs <= MAX_ROUND_TRIP_MS
    ? { previous: { sequence, roundTripMs } }
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
 * - `banned` — BAN されたユーザーだった
 * - `failed` — 例外で落ちた（接続失敗・ロック待ち後のエラー・UPDATE / COMMIT
 *   の失敗など）。落ちた段階は `failedPhase`
 */
export type AnswerHandling =
  "answered" | "expired" | "rejected" | "unauthorized" | "banned" | "failed";

/** 1 回の回答の計測結果 */
export interface AnswerTiming {
  readonly handling: AnswerHandling;
  /** 採点したメニュー。採点に至らなかったときは不明 */
  readonly menuType?: string;
  /** 回答した問題番号（0 が最初の問題）。整数でなければ不明 */
  readonly sequence?: number;
  readonly phases: AnswerPhaseTimings;
  /** 受け取ってから処理を終える（落ちる）までの合計（ms） */
  readonly totalMs: number;
  readonly observation: AnswerObservation;
}

/**
 * 1 回の回答の計測結果をログに出す
 * 回答計測出力
 *
 * 出す項目:
 * - `first` — 挑戦の最初の問題か（関数のコールドスタートの指標ではない）
 * - `failedPhase` — `failed` のとき、落ちた段階
 * - `afterRespondedMs` — 採点できた回答だけ。`update` と `commit` の和で、
 *   サーバー時計の起点を決めてから DB で確定するまでの時間。**猶予 100ms を
 *   超えていれば、DB の確定までに猶予を使い切ったと分かる。100ms 以下でも
 *   余裕があるとは言えない** — このログの出力・Server Action の応答の
 *   直列化・下りの通信は含まないため
 * - `previousSequence` / `previousClientRoundTripMs` — 直前の回答の
 *   問題番号と、画面で測った往復時間（{@link AnswerObservation}）
 */
export function logAnswerTiming(timing: AnswerTiming): void {
  const { handling, phases, observation } = timing;
  console.info(
    JSON.stringify({
      event: "challenge.answer",
      handling,
      menuType: timing.menuType,
      sequence: timing.sequence,
      first: timing.sequence === 0,
      totalMs: timing.totalMs,
      failedPhase: handling === "failed" ? pendingPhase(phases) : undefined,
      afterRespondedMs:
        handling === "answered"
          ? (phases.update ?? 0) + (phases.commit ?? 0)
          : undefined,
      ...phases,
      previousSequence: observation.previous?.sequence,
      previousClientRoundTripMs: observation.previous?.roundTripMs,
    }),
  );
}
