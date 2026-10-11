import "server-only";

import {
  Environment,
  SignedDataVerifier,
  VerificationException,
  VerificationStatus,
} from "@apple/app-store-server-library";
import { z } from "zod";

import { APPLE_APP_BUNDLE_ID } from "@mahjong-scoring/features/account/apple";

import { logExternalError } from "@/lib/log-error";

/**
 * App Store の課金環境
 * 課金環境
 *
 * - `Sandbox` — TestFlight・審査・開発中の課金。実際には課金されず、本番の
 *   サーバーにも届く
 * - `Production` — App Store で配布したアプリの実際の課金
 *
 * Apple にはほかに `Xcode` / `LocalTesting`（StoreKit の設定ファイルによる
 * 端末内の試験。Apple の署名が無い）があるが、検証を通らないので扱わない。
 */
export const AppleEnvironment = {
  Sandbox: "Sandbox",
  Production: "Production",
} as const;
export type AppleEnvironment =
  (typeof AppleEnvironment)[keyof typeof AppleEnvironment];

/**
 * 検証済みの取引（署名付き取引を検証して読んだもの）
 * 取引
 *
 * Apple のライブラリの型（`JWSTransactionDecodedPayload`）を外に出さないための
 * 自前の形。記録（`record.ts`）が使う項目だけを持つ。
 */
export interface AppleTransaction {
  /** 取引 ID。購入の冪等キー */
  readonly transactionId: string;
  /** 元の取引 ID（復元・再購入でも変わらない最初の取引） */
  readonly originalTransactionId: string;
  readonly bundleId: string;
  readonly productId: string;
  /** 商品の種類。`"Non-Consumable"` / `"Non-Renewing Subscription"` / その他 */
  readonly type: string;
  /** `"PURCHASED"` / `"FAMILY_SHARED"` */
  readonly inAppOwnershipType: string;
  readonly purchaseDate: Date;
  /** 購入時にアプリが渡した UUID（このアプリでは購入した人の user_id） */
  readonly appAccountToken: string | undefined;
  /** 返金・取り消しの日時。取り消されていなければ undefined */
  readonly revocationDate: Date | undefined;
  readonly environment: AppleEnvironment;
  /** 価格（通貨の 1/1000 単位） */
  readonly price: number | undefined;
  /** 通貨（ISO 4217） */
  readonly currency: string | undefined;
}

/**
 * 検証済みの App Store Server Notification
 * 通知
 */
export interface AppleNotification {
  /** 通知の一意な ID（`notificationUUID`）。再送の判定に使う */
  readonly notificationUuid: string;
  /** `REFUND` 等の種別（`notificationType`） */
  readonly notificationType: string;
  readonly subtype: string | undefined;
  /**
   * Apple が通知に署名した日時（`signedDate`）。同じ取引の通知の前後関係は
   * これで決める（受信順は再送で入れ替わる）
   */
  readonly signedDate: Date;
  readonly environment: AppleEnvironment;
  /** `data.signedTransactionInfo` を検証したもの。無ければ undefined */
  readonly transaction: AppleTransaction | undefined;
}

/**
 * 署名付きデータの検証の結果
 * 検証結果
 *
 * - `invalidSignature` — 署名・証明書の鎖・アプリ・課金環境のどれかが合わない、
 *   または中身の形が違う。送り直しても通らない
 * - `unavailable` — 証明書の失効確認（OCSP）に届かない等、一時的に検証できない。
 *   後で送り直せば通りうる
 */
export type AppleVerification<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly reason: "invalidSignature" | "unavailable" };

/**
 * 署名付きデータの検証器
 * 署名検証器
 *
 * Apple のライブラリ（`SignedDataVerifier`）を境界の裏に閉じ込める。記録や
 * HTTP の入口はこの interface だけを知り、テストは偽物
 * （`verifier-fake.ts`）を渡す。
 */
export interface AppleSignedDataVerifier {
  /** アプリから届いた署名付き取引（JWS）を検証して読む */
  verifyTransaction(jws: string): Promise<AppleVerification<AppleTransaction>>;
  /** 通知の `signedPayload` を検証して読む。中の署名付き取引も検証する */
  verifyNotification(
    signedPayload: string,
  ): Promise<AppleVerification<AppleNotification>>;
}

/** 検証器を作るための設定 */
export interface AppleSignedDataVerifierOptions {
  /** App Store Connect の数値の App ID（`readAppleAppId()`）。Production の検証に必須 */
  readonly appAppleId: number;
  /** Apple のルート証明書（`appleRootCertificates()`） */
  readonly rootCertificates: readonly Buffer[];
}

const transactionPayloadSchema = z.object({
  transactionId: z.string().min(1),
  originalTransactionId: z.string().min(1),
  bundleId: z.string().min(1),
  productId: z.string().min(1),
  type: z.string().min(1),
  inAppOwnershipType: z.string().min(1),
  purchaseDate: z.number(),
  appAccountToken: z.string().optional(),
  revocationDate: z.number().optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
});

const notificationPayloadSchema = z.object({
  notificationUUID: z.string().min(1),
  notificationType: z.string().min(1),
  subtype: z.string().optional(),
  signedDate: z.number(),
  data: z.object({ signedTransactionInfo: z.string().optional() }).optional(),
});

/** 検証の失敗 */
type VerificationFailure = Extract<
  AppleVerification<never>,
  { readonly ok: false }
>;

/**
 * Apple のライブラリで署名付きデータを検証する検証器を作る
 * 署名検証器生成
 *
 * Production と Sandbox の検証器を 2 つ持ち、まず Production で検証する。
 * 課金環境が違う（`INVALID_ENVIRONMENT`）ときだけ Sandbox で検証し直す。
 * 署名不正など他の失敗では Sandbox を試さない — 不正なデータを 2 回検証すると、
 * どちらの失敗が本当の理由かログから読めなくなる。
 *
 * 証明書の失効確認（OCSP）をオンにしている（`enableOnlineChecks`）。Apple に
 * 届かないときは `unavailable` を返し、呼び出し側は一時的な失敗として応答する
 * （アプリは取引を未完了のまま残し、通知は Apple が再送する）。
 *
 * 中身は zod で自前の形（{@link AppleTransaction}）に写す。ライブラリは項目を
 * すべて省略可能として返すので、記録に要る項目が無ければ `invalidSignature`。
 * 課金環境は検証が通った側の検証器のもの（ライブラリが中身の `environment` との
 * 一致を確かめている）。
 *
 * App ID（`APPLE_IAP_APP_APPLE_ID`）が無ければ作れない。呼び出し側は設定が
 * 無いことを `unavailable` 相当として扱う。
 */
export function createAppleSignedDataVerifier({
  appAppleId,
  rootCertificates,
}: AppleSignedDataVerifierOptions): AppleSignedDataVerifier {
  const roots = [...rootCertificates];
  const verifiers = {
    [AppleEnvironment.Production]: new SignedDataVerifier(
      roots,
      true,
      Environment.PRODUCTION,
      APPLE_APP_BUNDLE_ID,
      appAppleId,
    ),
    [AppleEnvironment.Sandbox]: new SignedDataVerifier(
      roots,
      true,
      Environment.SANDBOX,
      APPLE_APP_BUNDLE_ID,
    ),
  };

  /** Production で検証し、課金環境が違うときだけ Sandbox で検証し直す */
  async function verifyEitherEnvironment<T>(
    verify: (verifier: SignedDataVerifier) => Promise<T>,
  ): Promise<
    | {
        readonly ok: true;
        readonly payload: T;
        readonly environment: AppleEnvironment;
      }
    | VerificationFailure
  > {
    try {
      return {
        ok: true,
        payload: await verify(verifiers.Production),
        environment: AppleEnvironment.Production,
      };
    } catch (error) {
      if (!isInvalidEnvironment(error)) return failureOf(error);
    }
    try {
      return {
        ok: true,
        payload: await verify(verifiers.Sandbox),
        environment: AppleEnvironment.Sandbox,
      };
    } catch (error) {
      return failureOf(error);
    }
  }

  async function verifyTransaction(
    jws: string,
  ): Promise<AppleVerification<AppleTransaction>> {
    const verified = await verifyEitherEnvironment((verifier) =>
      verifier.verifyAndDecodeTransaction(jws),
    );
    if (!verified.ok) return verified;
    const parsed = transactionPayloadSchema.safeParse(verified.payload);
    if (!parsed.success) {
      logExternalError(
        "verifyAppleTransaction",
        "署名付き取引に記録に要る項目が無い",
        parsed.error,
      );
      return { ok: false, reason: "invalidSignature" };
    }
    const payload = parsed.data;
    return {
      ok: true,
      value: {
        transactionId: payload.transactionId,
        originalTransactionId: payload.originalTransactionId,
        bundleId: payload.bundleId,
        productId: payload.productId,
        type: payload.type,
        inAppOwnershipType: payload.inAppOwnershipType,
        purchaseDate: new Date(payload.purchaseDate),
        appAccountToken: payload.appAccountToken || undefined,
        revocationDate:
          payload.revocationDate === undefined
            ? undefined
            : new Date(payload.revocationDate),
        environment: verified.environment,
        price: payload.price,
        currency: payload.currency,
      },
    };
  }

  /**
   * 通知の外側を検証した後、`data.signedTransactionInfo` があれば内側も
   * 検証する。外側の署名が正しくても、内側の取引は別の JWS なので、内側が
   * 通らなければ通知全体を通さない（内側だけ差し替えた通知を受け付けない）
   */
  async function verifyNotification(
    signedPayload: string,
  ): Promise<AppleVerification<AppleNotification>> {
    const verified = await verifyEitherEnvironment((verifier) =>
      verifier.verifyAndDecodeNotification(signedPayload),
    );
    if (!verified.ok) return verified;
    const parsed = notificationPayloadSchema.safeParse(verified.payload);
    if (!parsed.success) {
      logExternalError(
        "verifyAppleNotification",
        "通知に必要な項目が無い",
        parsed.error,
      );
      return { ok: false, reason: "invalidSignature" };
    }
    const payload = parsed.data;
    const signedTransaction = payload.data?.signedTransactionInfo;
    let transaction: AppleTransaction | undefined;
    if (signedTransaction !== undefined) {
      const inner = await verifyTransaction(signedTransaction);
      if (!inner.ok) return inner;
      transaction = inner.value;
    }
    return {
      ok: true,
      value: {
        notificationUuid: payload.notificationUUID,
        notificationType: payload.notificationType,
        subtype: payload.subtype,
        signedDate: new Date(payload.signedDate),
        environment: verified.environment,
        transaction,
      },
    };
  }

  return { verifyTransaction, verifyNotification };
}

/** 課金環境が違うだけの失敗か（Sandbox で検証し直す唯一の条件） */
function isInvalidEnvironment(error: unknown): boolean {
  return (
    error instanceof VerificationException &&
    error.status === VerificationStatus.INVALID_ENVIRONMENT
  );
}

/**
 * ライブラリの例外を検証の失敗に写す
 *
 * `RETRYABLE_VERIFICATION_FAILURE`（OCSP に届かない等）と想定外の例外は
 * 一時的な `unavailable`、それ以外の検証の例外は `invalidSignature`。
 */
function failureOf(error: unknown): VerificationFailure {
  if (
    error instanceof VerificationException &&
    error.status !== VerificationStatus.RETRYABLE_VERIFICATION_FAILURE
  )
    return { ok: false, reason: "invalidSignature" };
  logExternalError(
    "verifyAppleSignedData",
    "署名付きデータを検証できない",
    error instanceof VerificationException ? (error.cause ?? error) : error,
  );
  return { ok: false, reason: "unavailable" };
}
